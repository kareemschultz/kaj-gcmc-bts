# GCMC-KAJ Digital Transformation Platform - Production Deployment Guide

## Overview

This document provides comprehensive instructions for deploying the GCMC-KAJ Digital Transformation Platform to production. The platform features complete GRA/NIS eServices integration, hybrid physical-to-digital migration workflows, dynamic service package management, and enterprise-grade compliance automation.

## Platform Architecture

### Core Services
- **Web Application**: Next.js admin dashboard with business intelligence
- **Portal Application**: Next.js client portal with document management
- **API Server**: Hono + tRPC backend with GRA/NIS integration
- **Worker**: BullMQ background job processor for compliance automation
- **PostgreSQL**: Primary database with multi-tenant isolation
- **Redis**: Cache, job queue, and session storage
- **MinIO**: S3-compatible object storage for documents

### Integration Services
- **GRA eServices**: Direct integration with [eservices.gra.gov.gy](https://eservices.gra.gov.gy) OPTIMAL system
- **NIS Electronic Schedules**: Integration with [esched.nis.org.gy](https://esched.nis.org.gy)
- **Dynamic Service Management**: Flexible client service packages and pricing
- **Compliance Automation**: Real-time filing and submission workflows

## Prerequisites

### Infrastructure Requirements

#### Kubernetes Cluster
- **Minimum**: 3 nodes with 4 cores, 8GB RAM each
- **Recommended**: 5+ nodes with 8 cores, 16GB RAM each
- **Storage**: SSD-backed persistent storage (100GB+ available)
- **Network**: Load balancer support, ingress controller

#### External Services
- **Domain**: Configured DNS for your domains
- **SSL/TLS**: Valid certificates (Let's Encrypt or commercial)
- **SMTP**: Email service for notifications
- **Monitoring**: External monitoring service (optional)

### Tools Required
- `kubectl` (v1.25+)
- `kustomize` (v4.5+)
- `docker` (v20.10+)
- `helm` (v3.10+) - for optional components

## Pre-Deployment Setup

### 1. Container Registry Setup

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Build and push images
docker build -t ghcr.io/your-org/gcmc-kaj/web:v1.0.0 -f apps/web/Dockerfile .
docker build -t ghcr.io/your-org/gcmc-kaj/server:v1.0.0 -f apps/server/Dockerfile .
docker build -t ghcr.io/your-org/gcmc-kaj/worker:v1.0.0 -f apps/worker/Dockerfile .
docker build -t ghcr.io/your-org/gcmc-kaj/portal:v1.0.0 -f apps/portal/Dockerfile .

docker push ghcr.io/your-org/gcmc-kaj/web:v1.0.0
docker push ghcr.io/your-org/gcmc-kaj/server:v1.0.0
docker push ghcr.io/your-org/gcmc-kaj/worker:v1.0.0
docker push ghcr.io/your-org/gcmc-kaj/portal:v1.0.0
```

### 2. Kubernetes Configuration

```bash
# Verify cluster access
kubectl cluster-info
kubectl get nodes

# Create namespaces
kubectl apply -f k8s/base/namespace.yaml

# Create monitoring namespace
kubectl create namespace monitoring
```

### 3. Secrets Configuration

#### Required Secrets

1. **Database Credentials**
```bash
# Generate secure database password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-32)

# Update secrets file
sed -i "s/PLACEHOLDER_DB_PASSWORD/$DB_PASSWORD/g" k8s/base/secrets.yaml
```

2. **Authentication Secrets**
```bash
# Generate authentication secret
AUTH_SECRET=$(openssl rand -base64 32)

# Update secrets file
sed -i "s/PLACEHOLDER_AUTH_SECRET/$AUTH_SECRET/g" k8s/base/secrets.yaml
```

3. **MinIO Credentials**
```bash
# Generate MinIO credentials
MINIO_ACCESS_KEY=$(openssl rand -base64 12 | tr -d '/+=' | cut -c1-16)
MINIO_SECRET_KEY=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-32)

# Update secrets file
sed -i "s/PLACEHOLDER_MINIO_ACCESS_KEY/$MINIO_ACCESS_KEY/g" k8s/base/secrets.yaml
sed -i "s/PLACEHOLDER_MINIO_SECRET_KEY/$MINIO_SECRET_KEY/g" k8s/base/secrets.yaml
sed -i "s/PLACEHOLDER_MINIO_ROOT_USER/$MINIO_ACCESS_KEY/g" k8s/base/secrets.yaml
sed -i "s/PLACEHOLDER_MINIO_ROOT_PASSWORD/$MINIO_SECRET_KEY/g" k8s/base/secrets.yaml
```

4. **SMTP Configuration**
```bash
# Update with your SMTP provider details
sed -i "s/PLACEHOLDER_SMTP_HOST/smtp.yourprovider.com/g" k8s/base/secrets.yaml
sed -i "s/PLACEHOLDER_SMTP_USER/your-smtp-user/g" k8s/base/secrets.yaml
sed -i "s/PLACEHOLDER_SMTP_PASSWORD/your-smtp-password/g" k8s/base/secrets.yaml
```

### 4. GRA/NIS Integration Setup

#### GRA eServices Configuration
```bash
# Register your application with GRA eServices
# Contact: eservices@gra.gov.gy or optimal@gra.gov.gy
# Obtain production API credentials

# Update secrets with GRA credentials
sed -i "s/PLACEHOLDER_GRA_CLIENT_ID/your-gra-client-id/g" k8s/base/secrets.yaml
sed -i "s/PLACEHOLDER_GRA_CLIENT_SECRET/your-gra-client-secret/g" k8s/base/secrets.yaml
sed -i "s/PLACEHOLDER_GRA_API_URL/https:\/\/eservices.gra.gov.gy\/api/g" k8s/base/secrets.yaml
```

#### NIS Electronic Schedule Configuration
```bash
# Register your application with NIS esched system
# Contact: support@nis.org.gy
# Obtain NIS API credentials

# Update secrets with NIS credentials
sed -i "s/PLACEHOLDER_NIS_API_KEY/your-nis-api-key/g" k8s/base/secrets.yaml
sed -i "s/PLACEHOLDER_NIS_API_URL/https:\/\/esched.nis.org.gy\/api/g" k8s/base/secrets.yaml
```

#### Government Integration Compliance
```bash
# Ensure compliance with Government IT Security Requirements
# Configure TLS certificates for government API communication
# Set up API rate limiting according to GRA/NIS guidelines
# Configure audit logging for all government API interactions
```

### 5. Domain and DNS Configuration

Update the following files with your actual domains:
- `k8s/base/secrets.yaml` - Update all URL references
- `k8s/base/ingress.yaml` - Update host names
- `k8s/overlays/*/patches/*.yaml` - Update environment-specific URLs

## Deployment Procedures

### Production Deployment

1. **Apply Base Configuration**
```bash
cd k8s/overlays/production

# Update image tags
kustomize edit set image \
  ghcr.io/your-org/gcmc-kaj/web:v1.0.0 \
  ghcr.io/your-org/gcmc-kaj/server:v1.0.0 \
  ghcr.io/your-org/gcmc-kaj/worker:v1.0.0 \
  ghcr.io/your-org/gcmc-kaj/portal:v1.0.0

# Apply configuration
kubectl apply -k .
```

2. **Verify Deployment**
```bash
# Check pod status
kubectl get pods -n gcmc-kaj

# Check services
kubectl get svc -n gcmc-kaj

# Check ingress
kubectl get ingress -n gcmc-kaj

# Monitor rollout
kubectl rollout status deployment/gcmc-kaj-api -n gcmc-kaj
kubectl rollout status deployment/gcmc-kaj-web -n gcmc-kaj
kubectl rollout status deployment/gcmc-kaj-portal -n gcmc-kaj
kubectl rollout status deployment/gcmc-kaj-worker -n gcmc-kaj
```

3. **Database Migration & Initial Setup**
```bash
# Run database migrations (from a temporary pod)
kubectl run migration-job --rm -i --tty \
  --image=ghcr.io/your-org/gcmc-kaj/server:v1.0.0 \
  --namespace=gcmc-kaj \
  --restart=Never \
  --env="DATABASE_URL=postgresql://postgres:$DB_PASSWORD@postgres:5432/gcmc_kaj" \
  -- bun --cwd packages/db db:migrate:deploy

# Initialize GRA/NIS integration data
kubectl run setup-integration-job --rm -i --tty \
  --image=ghcr.io/your-org/gcmc-kaj/server:v1.0.0 \
  --namespace=gcmc-kaj \
  --restart=Never \
  --env="DATABASE_URL=postgresql://postgres:$DB_PASSWORD@postgres:5432/gcmc_kaj" \
  -- bun run setup-gra-nis-integration.js

# Create default service packages
kubectl run setup-services-job --rm -i --tty \
  --image=ghcr.io/your-org/gcmc-kaj/server:v1.0.0 \
  --namespace=gcmc-kaj \
  --restart=Never \
  --env="DATABASE_URL=postgresql://postgres:$DB_PASSWORD@postgres:5432/gcmc_kaj" \
  -- bun run setup-default-service-packages.js
```

### Staging Deployment

```bash
cd k8s/overlays/staging
kustomize edit set image \
  ghcr.io/your-org/gcmc-kaj/web:staging-latest \
  ghcr.io/your-org/gcmc-kaj/server:staging-latest \
  ghcr.io/your-org/gcmc-kaj/worker:staging-latest \
  ghcr.io/your-org/gcmc-kaj/portal:staging-latest

kubectl apply -k .
```

### Development Deployment

```bash
cd k8s/overlays/development
kubectl apply -k .
```

## Monitoring Setup

### 1. Deploy Prometheus and Grafana
```bash
kubectl apply -f k8s/monitoring/prometheus.yaml
kubectl apply -f k8s/monitoring/grafana.yaml
```

### 2. Deploy ELK Stack (Optional)
```bash
kubectl apply -f k8s/monitoring/elasticsearch.yaml
```

### 3. Access Monitoring Dashboards

- **Grafana**: https://monitoring.gcmc-kaj.example.com
  - Username: admin
  - Password: admin123!@# (change immediately)

- **Kibana**: https://logs.gcmc-kaj.example.com
  - Username: admin
  - Password: logs123 (change immediately)

## Health Checks and Validation

### Application Health Endpoints

1. **API Server**: `https://api.gcmc-kaj.example.com/health`
2. **Web Application**: `https://app.gcmc-kaj.example.com/api/health`
3. **Portal**: `https://portal.gcmc-kaj.example.com/api/health`
4. **Worker**: Internal health check on port 3004
5. **GRA Integration**: `https://api.gcmc-kaj.example.com/health/gra-integration`
6. **NIS Integration**: `https://api.gcmc-kaj.example.com/health/nis-integration`
7. **Dynamic Services**: `https://api.gcmc-kaj.example.com/health/dynamic-services`

### Verification Commands

```bash
# Check all pods are running
kubectl get pods -n gcmc-kaj --watch

# Check HPA status
kubectl get hpa -n gcmc-kaj

# Check resource usage
kubectl top pods -n gcmc-kaj
kubectl top nodes

# Check logs
kubectl logs -f deployment/gcmc-kaj-api -n gcmc-kaj
kubectl logs -f deployment/gcmc-kaj-web -n gcmc-kaj

# Test database connectivity
kubectl exec -it deployment/postgres -n gcmc-kaj -- psql -U postgres -d gcmc_kaj -c "SELECT version();"

# Test Redis connectivity
kubectl exec -it deployment/redis -n gcmc-kaj -- redis-cli ping

# Test GRA eServices integration
kubectl exec -it deployment/gcmc-kaj-api -n gcmc-kaj -- \
  curl -H "Authorization: Bearer $GRA_API_TOKEN" \
  https://eservices.gra.gov.gy/api/health

# Test NIS Electronic Schedule integration
kubectl exec -it deployment/gcmc-kaj-api -n gcmc-kaj -- \
  curl -H "X-API-Key: $NIS_API_KEY" \
  https://esched.nis.org.gy/api/health

# Verify dynamic service packages are loaded
kubectl exec -it deployment/gcmc-kaj-api -n gcmc-kaj -- \
  curl http://localhost:3000/api/trpc/dynamicServices.getServicePackages

# Test compliance automation worker
kubectl logs -f deployment/gcmc-kaj-worker -n gcmc-kaj | grep "compliance-refresh"
```

## Scaling and Performance

### Manual Scaling
```bash
# Scale API servers
kubectl scale deployment gcmc-kaj-api --replicas=10 -n gcmc-kaj

# Scale web servers
kubectl scale deployment gcmc-kaj-web --replicas=5 -n gcmc-kaj
```

### Auto-scaling Configuration
HPA is configured for all services with the following targets:
- **CPU**: 70% utilization
- **Memory**: 80% utilization

### Performance Monitoring
Monitor the following metrics in Grafana:
- Request rate and response times
- Error rates
- Resource utilization
- Database performance
- Queue lengths (Redis)

## Security Considerations

### Network Security
- All inter-pod communication is encrypted
- Network policies restrict traffic flow
- Ingress uses TLS termination

### Pod Security
- All containers run as non-root users
- Read-only root filesystems where possible
- Security contexts defined for all pods
- Resource limits enforced

### Secrets Management
- All sensitive data stored in Kubernetes secrets
- Secrets mounted as environment variables or files
- Regular secret rotation recommended

## Backup and Disaster Recovery

### Database Backup
```bash
# Create backup job
kubectl create job postgres-backup-$(date +%Y%m%d) \
  --from=cronjob/postgres-backup \
  -n gcmc-kaj
```

### MinIO Backup
```bash
# Backup MinIO data
kubectl exec -it deployment/minio -n gcmc-kaj -- \
  mc mirror myminio/tenant-1-documents /backup/tenant-1-documents
```

### Configuration Backup
```bash
# Backup Kubernetes configurations
kubectl get all,secrets,configmaps -n gcmc-kaj -o yaml > gcmc-kaj-backup.yaml
```

## Troubleshooting

### Common Issues

1. **Pods Not Starting**
```bash
# Check events
kubectl describe pod <pod-name> -n gcmc-kaj

# Check logs
kubectl logs <pod-name> -n gcmc-kaj --previous
```

2. **Database Connection Issues**
```bash
# Check database pod status
kubectl get pods -l app=postgres -n gcmc-kaj

# Test connectivity
kubectl exec -it deployment/gcmc-kaj-api -n gcmc-kaj -- \
  curl -f http://postgres:5432 || echo "Database not accessible"
```

3. **Ingress Issues**
```bash
# Check ingress status
kubectl describe ingress gcmc-kaj-ingress -n gcmc-kaj

# Check ingress controller logs
kubectl logs -l app.kubernetes.io/name=ingress-nginx -n ingress-nginx
```

### Emergency Procedures

#### Rollback Deployment
```bash
# Rollback to previous version
kubectl rollout undo deployment/gcmc-kaj-api -n gcmc-kaj
kubectl rollout undo deployment/gcmc-kaj-web -n gcmc-kaj
```

#### Scale Down for Maintenance
```bash
# Scale down all services
kubectl scale deployment gcmc-kaj-api --replicas=0 -n gcmc-kaj
kubectl scale deployment gcmc-kaj-web --replicas=0 -n gcmc-kaj
kubectl scale deployment gcmc-kaj-portal --replicas=0 -n gcmc-kaj
kubectl scale deployment gcmc-kaj-worker --replicas=0 -n gcmc-kaj
```

## Maintenance Procedures

### Regular Maintenance

1. **Weekly**:
   - Review logs for errors
   - Check resource utilization
   - Update monitoring dashboards

2. **Monthly**:
   - Update container images
   - Review security policies
   - Perform backup restoration tests

3. **Quarterly**:
   - Security audit
   - Performance review
   - Disaster recovery testing

### Updates and Patches

1. **Security Updates**: Apply immediately
2. **Feature Updates**: Deploy to staging first
3. **Infrastructure Updates**: Plan maintenance windows

## Contact Information

- **DevOps Team**: devops@gcmc-kaj.example.com
- **Emergency Contact**: +1-XXX-XXX-XXXX
- **Documentation**: https://docs.gcmc-kaj.example.com

---

**Note**: This document should be updated regularly as the deployment evolves. Always test changes in staging before applying to production.