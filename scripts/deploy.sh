#!/bin/bash

# GCMC-KAJ Business Tax Services - Production Deployment Script
# This script handles the complete deployment process for all environments

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_LOG="deployment-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

# Help function
show_help() {
    cat << EOF
GCMC-KAJ Deployment Script

Usage: ./deploy.sh [ENVIRONMENT] [OPTIONS]

ENVIRONMENTS:
    development     Deploy to development environment
    staging         Deploy to staging environment
    production      Deploy to production environment

OPTIONS:
    --dry-run       Show what would be deployed without making changes
    --force         Skip confirmation prompts
    --skip-tests    Skip pre-deployment testing
    --skip-backup   Skip pre-deployment backup (production only)
    --image-tag     Specify image tag (default: latest)
    --help          Show this help message

EXAMPLES:
    ./deploy.sh staging                                    # Deploy to staging
    ./deploy.sh production --image-tag=v1.2.0            # Deploy specific version to production
    ./deploy.sh development --dry-run                     # Preview development deployment
    ./deploy.sh production --force --skip-backup         # Force production deployment without backup

PREREQUISITES:
    - kubectl configured and connected to cluster
    - kustomize installed
    - docker login completed for image registry
    - Required secrets configured

EOF
}

# Parse command line arguments
ENVIRONMENT=""
DRY_RUN=false
FORCE=false
SKIP_TESTS=false
SKIP_BACKUP=false
IMAGE_TAG="latest"

while [[ $# -gt 0 ]]; do
    case $1 in
        development|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --image-tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" ]]; then
    log_error "Environment must be specified"
    show_help
    exit 1
fi

# Environment-specific configuration
case $ENVIRONMENT in
    development)
        NAMESPACE="gcmc-kaj-dev"
        KUSTOMIZE_PATH="k8s/overlays/development"
        ;;
    staging)
        NAMESPACE="gcmc-kaj-staging"
        KUSTOMIZE_PATH="k8s/overlays/staging"
        ;;
    production)
        NAMESPACE="gcmc-kaj"
        KUSTOMIZE_PATH="k8s/overlays/production"
        ;;
esac

log "Starting deployment to $ENVIRONMENT environment"
log "Namespace: $NAMESPACE"
log "Kustomize path: $KUSTOMIZE_PATH"
log "Image tag: $IMAGE_TAG"
log "Dry run: $DRY_RUN"

# Prerequisite checks
check_prerequisites() {
    log "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi

    # Check kustomize
    if ! command -v kustomize &> /dev/null; then
        log_error "kustomize not found. Please install kustomize."
        exit 1
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Check kubeconfig."
        exit 1
    fi

    # Check namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE does not exist. Creating..."
        if [[ "$DRY_RUN" == false ]]; then
            kubectl create namespace "$NAMESPACE"
        fi
    fi

    log_success "Prerequisites check passed"
}

# Pre-deployment tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        log_warning "Skipping tests as requested"
        return 0
    fi

    log "Running pre-deployment tests..."

    # Validate Kubernetes manifests
    if ! kustomize build "$PROJECT_ROOT/$KUSTOMIZE_PATH" > /dev/null; then
        log_error "Kustomize build failed. Check manifest syntax."
        exit 1
    fi

    # Additional tests can be added here
    # - Helm lint
    # - Policy validation
    # - Security scanning

    log_success "Pre-deployment tests passed"
}

# Backup current deployment (production only)
backup_deployment() {
    if [[ "$ENVIRONMENT" != "production" || "$SKIP_BACKUP" == true ]]; then
        return 0
    fi

    log "Creating backup of current production deployment..."

    BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    # Backup configurations
    kubectl get all,secrets,configmaps -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/resources.yaml" 2>/dev/null || true

    # Backup database (if possible)
    # This would need to be customized based on your backup strategy

    log_success "Backup created in $BACKUP_DIR"
}

# Deploy application
deploy() {
    log "Deploying to $ENVIRONMENT..."

    cd "$PROJECT_ROOT/$KUSTOMIZE_PATH"

    # Update image tags
    log "Updating image tags to $IMAGE_TAG..."

    if [[ "$DRY_RUN" == false ]]; then
        kustomize edit set image \
            "ghcr.io/your-org/gcmc-kaj/web:$IMAGE_TAG" \
            "ghcr.io/your-org/gcmc-kaj/server:$IMAGE_TAG" \
            "ghcr.io/your-org/gcmc-kaj/worker:$IMAGE_TAG" \
            "ghcr.io/your-org/gcmc-kaj/portal:$IMAGE_TAG"
    fi

    # Apply or preview
    if [[ "$DRY_RUN" == true ]]; then
        log "Dry run - showing what would be applied:"
        kustomize build . | kubectl apply --dry-run=client -f -
    else
        log "Applying configuration..."
        kustomize build . | kubectl apply -f -
    fi

    cd "$PROJECT_ROOT"

    log_success "Configuration applied"
}

# Wait for rollout
wait_for_rollout() {
    if [[ "$DRY_RUN" == true ]]; then
        return 0
    fi

    log "Waiting for deployment rollout..."

    # Get deployment names based on environment
    if [[ "$ENVIRONMENT" == "development" ]]; then
        DEPLOYMENTS=("dev-gcmc-kaj-api" "dev-gcmc-kaj-web" "dev-gcmc-kaj-portal" "dev-gcmc-kaj-worker")
    elif [[ "$ENVIRONMENT" == "staging" ]]; then
        DEPLOYMENTS=("staging-gcmc-kaj-api" "staging-gcmc-kaj-web" "staging-gcmc-kaj-portal" "staging-gcmc-kaj-worker")
    else
        DEPLOYMENTS=("gcmc-kaj-api" "gcmc-kaj-web" "gcmc-kaj-portal" "gcmc-kaj-worker")
    fi

    for deployment in "${DEPLOYMENTS[@]}"; do
        log "Waiting for $deployment rollout..."
        if ! kubectl rollout status "deployment/$deployment" -n "$NAMESPACE" --timeout=600s; then
            log_error "Rollout failed for $deployment"
            exit 1
        fi
    done

    log_success "All deployments rolled out successfully"
}

# Health checks
health_check() {
    if [[ "$DRY_RUN" == true ]]; then
        return 0
    fi

    log "Running health checks..."

    # Wait for pods to be ready
    if ! kubectl wait --for=condition=ready pod -l app.kubernetes.io/part-of=gcmc-kaj -n "$NAMESPACE" --timeout=300s; then
        log_error "Pods failed to become ready"
        exit 1
    fi

    # Test service endpoints
    case $ENVIRONMENT in
        development)
            API_URL="http://dev-api.gcmc-kaj.local:3000"
            WEB_URL="http://dev-app.gcmc-kaj.local:3001"
            ;;
        staging)
            API_URL="https://staging-api.gcmc-kaj.example.com"
            WEB_URL="https://staging-app.gcmc-kaj.example.com"
            ;;
        production)
            API_URL="https://api.gcmc-kaj.example.com"
            WEB_URL="https://app.gcmc-kaj.example.com"
            ;;
    esac

    # Test health endpoints (if accessible)
    log "Testing health endpoints..."

    # Internal health checks using kubectl port-forward or exec
    kubectl exec deployment/gcmc-kaj-api -n "$NAMESPACE" -- curl -f http://localhost:3000/health || log_warning "API health check failed"
    kubectl exec deployment/gcmc-kaj-web -n "$NAMESPACE" -- curl -f http://localhost:3001/api/health || log_warning "Web health check failed"

    log_success "Health checks completed"
}

# Post-deployment tasks
post_deployment() {
    if [[ "$DRY_RUN" == true ]]; then
        return 0
    fi

    log "Running post-deployment tasks..."

    # Database migrations (if needed)
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "Running database migrations..."
        kubectl run migration-job-$(date +%s) --rm -i --tty \
            --image="ghcr.io/your-org/gcmc-kaj/server:$IMAGE_TAG" \
            --namespace="$NAMESPACE" \
            --restart=Never \
            --env="DATABASE_URL=$(kubectl get secret gcmc-kaj-secrets -n "$NAMESPACE" -o jsonpath='{.data.DATABASE_URL}' | base64 -d)" \
            -- bun --cwd packages/db db:migrate:deploy || log_warning "Migration job failed"
    fi

    # Clear caches
    log "Clearing application caches..."
    kubectl exec deployment/redis -n "$NAMESPACE" -- redis-cli FLUSHDB || log_warning "Cache clear failed"

    log_success "Post-deployment tasks completed"
}

# Main deployment workflow
main() {
    # Banner
    echo "======================================"
    echo "GCMC-KAJ Deployment Script"
    echo "======================================"
    echo "Environment: $ENVIRONMENT"
    echo "Image Tag: $IMAGE_TAG"
    echo "Dry Run: $DRY_RUN"
    echo "======================================"

    # Confirmation for production
    if [[ "$ENVIRONMENT" == "production" && "$FORCE" != true && "$DRY_RUN" != true ]]; then
        echo ""
        echo "⚠️  WARNING: You are about to deploy to PRODUCTION!"
        echo "This will affect live users and services."
        echo ""
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log "Deployment cancelled by user"
            exit 0
        fi
    fi

    # Run deployment steps
    check_prerequisites
    run_tests
    backup_deployment
    deploy
    wait_for_rollout
    health_check
    post_deployment

    # Summary
    echo ""
    echo "======================================"
    if [[ "$DRY_RUN" == true ]]; then
        log_success "Dry run completed successfully"
    else
        log_success "Deployment to $ENVIRONMENT completed successfully!"
        echo ""
        echo "📋 Deployment Summary:"
        echo "   Environment: $ENVIRONMENT"
        echo "   Image Tag: $IMAGE_TAG"
        echo "   Namespace: $NAMESPACE"
        echo "   Log File: $DEPLOYMENT_LOG"

        if [[ "$ENVIRONMENT" == "production" ]]; then
            echo ""
            echo "🌐 Production URLs:"
            echo "   Admin: https://app.gcmc-kaj.example.com"
            echo "   Portal: https://portal.gcmc-kaj.example.com"
            echo "   API: https://api.gcmc-kaj.example.com"
            echo "   Monitoring: https://monitoring.gcmc-kaj.example.com"
        fi
    fi
    echo "======================================"
}

# Error handling
trap 'log_error "Deployment failed. Check logs for details."; exit 1' ERR

# Run main function
main "$@"