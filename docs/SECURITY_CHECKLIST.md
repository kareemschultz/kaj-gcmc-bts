# GCMC-KAJ Platform Security Checklist

**Last Updated:** 2025-11-16
**Version:** 1.0.0
**Purpose:** Pre-deployment security verification for all environments

## Overview

This checklist ensures that all security requirements are met before deploying the GCMC-KAJ platform to any environment. Complete ALL items before proceeding with deployment.

**Risk Level Indicators:**
- 🔴 **CRITICAL** - Must be completed before deployment
- 🟡 **HIGH** - Should be completed before deployment
- 🟢 **MEDIUM** - Recommended for production environments

---

## 1. Credential Security

### 1.1 Secret Generation 🔴 CRITICAL

- [ ] All secrets generated using cryptographically secure methods
  - [ ] Used `./scripts/generate-secrets.sh` OR
  - [ ] Used `openssl rand -base64 32` for all secrets
- [ ] Verified secret strength meets minimum requirements:
  - [ ] PostgreSQL password: ≥ 32 characters
  - [ ] Better-Auth secret: ≥ 32 characters (base64)
  - [ ] MinIO root password: ≥ 32 characters
  - [ ] MinIO access keys: ≥ 32 characters
- [ ] Secrets are unique (no password reuse across services)
- [ ] Secrets are unique per environment (dev ≠ staging ≠ production)

### 1.2 No Default Credentials 🔴 CRITICAL

- [ ] Verified NO use of default passwords in configuration:
  - [ ] NOT using `postgres` as PostgreSQL password
  - [ ] NOT using `minioadmin` for MinIO credentials
  - [ ] NOT using `admin`, `password`, or similar weak passwords
  - [ ] NOT using example secrets from `.env.example`
- [ ] All placeholders (`<GENERATE_*>`) replaced with actual values
- [ ] Development defaults (`localdev_only_insecure`) NOT used in production

### 1.3 Secret Storage 🔴 CRITICAL

- [ ] Production secrets stored securely:
  - [ ] Using password manager (1Password, LastPass, Bitwarden) OR
  - [ ] Using secrets vault (HashiCorp Vault, AWS Secrets Manager) OR
  - [ ] Using environment variables (not in files) OR
  - [ ] Using Docker secrets (Swarm mode)
- [ ] `.env` and `.env.production` files excluded from version control
  - [ ] Verified in `.gitignore`
  - [ ] Run `git check-ignore .env .env.production` successfully
- [ ] No secrets committed to Git repository
  - [ ] Run `git log --all -p | grep -i "password\|secret"` shows no leaks
- [ ] Backup of secrets stored in secure location
- [ ] Access to secrets restricted (principle of least privilege)

---

## 2. Configuration Security

### 2.1 Environment Files 🔴 CRITICAL

- [ ] `.env.example` contains NO actual secrets (only placeholders)
- [ ] `.env.production` created with actual secrets
- [ ] `.env.production` file permissions set correctly: `chmod 600 .env.production`
- [ ] Owner of `.env.production` is correct user (not root)
- [ ] All required environment variables are set:
  ```bash
  # Verify with:
  docker-compose --env-file .env.production -f docker-compose.prod.yml config > /dev/null
  ```

### 2.2 Docker Configuration 🟡 HIGH

- [ ] `docker-compose.yml` NOT used in production (development only)
- [ ] `docker-compose.prod.yml` used for production deployment
- [ ] All production services have resource limits defined
- [ ] Health checks configured for all services
- [ ] Logging configured with size limits
- [ ] Networks properly isolated (frontend/backend separation)
- [ ] Volumes use named volumes (not bind mounts for sensitive data)

### 2.3 Application Configuration 🟡 HIGH

- [ ] `NODE_ENV=production` in production environments
- [ ] CORS configured correctly:
  - [ ] `CORS_ORIGIN` set to actual frontend URL
  - [ ] NOT using wildcard (`*`) in production
- [ ] URLs configured correctly:
  - [ ] `BETTER_AUTH_URL` points to actual API domain
  - [ ] `NEXT_PUBLIC_API_URL` points to actual API URL
  - [ ] `PORTAL_URL` points to actual portal URL
- [ ] Email configuration complete:
  - [ ] `EMAIL_PROVIDER` set (not "log" in production)
  - [ ] API keys or SMTP credentials configured
  - [ ] `SUPPORT_EMAIL` set to actual email

---

## 3. Network Security

### 3.1 Firewall Configuration 🟡 HIGH

- [ ] Firewall enabled on server
- [ ] Only necessary ports open:
  - [ ] HTTP (80) - for HTTPS redirect only
  - [ ] HTTPS (443) - primary access
  - [ ] SSH (22) - restricted to specific IPs if possible
- [ ] Database port (5432) NOT publicly accessible
- [ ] Redis port (6379) NOT publicly accessible
- [ ] MinIO API port (9000) NOT publicly accessible (use reverse proxy)
- [ ] MinIO console (9001) NOT publicly accessible OR protected by auth

### 3.2 SSL/TLS Configuration 🔴 CRITICAL

- [ ] SSL/TLS certificates obtained (Let's Encrypt or commercial CA)
- [ ] HTTPS enforced for all external connections
- [ ] HTTP redirects to HTTPS
- [ ] HSTS (HTTP Strict Transport Security) header enabled
- [ ] TLS version ≥ 1.2 (preferably 1.3)
- [ ] Strong cipher suites configured
- [ ] Certificate auto-renewal configured (Let's Encrypt)

### 3.3 Reverse Proxy 🟡 HIGH

- [ ] Reverse proxy configured (Nginx, Traefik, or Caddy)
- [ ] Proxy headers configured correctly:
  - [ ] `X-Real-IP`
  - [ ] `X-Forwarded-For`
  - [ ] `X-Forwarded-Proto`
- [ ] Rate limiting configured
- [ ] Request size limits configured
- [ ] Timeout values configured appropriately

---

## 4. Database Security

### 4.1 PostgreSQL Configuration 🔴 CRITICAL

- [ ] Strong password set for `postgres` user (≥ 32 characters)
- [ ] Password encryption enabled (default in PostgreSQL 14+)
- [ ] Database NOT publicly accessible
- [ ] SSL/TLS connections enforced (if database is remote)
- [ ] Connection pooling configured with limits
- [ ] Regular backups scheduled
- [ ] Backup encryption enabled

### 4.2 Database Access Control 🟡 HIGH

- [ ] Application uses least-privilege database user
- [ ] Database user permissions restricted (no superuser for app)
- [ ] Connection limits configured per user
- [ ] Idle connection timeout configured
- [ ] Query logging enabled for audit trail

---

## 5. Storage Security

### 5.1 MinIO Configuration 🔴 CRITICAL

- [ ] Strong MinIO root credentials (≥ 32 characters)
- [ ] MinIO root user is NOT "minioadmin"
- [ ] MinIO console protected by authentication
- [ ] Bucket policies configured for multi-tenant isolation
- [ ] Anonymous access disabled (unless explicitly needed)
- [ ] SSL/TLS enabled for MinIO connections (production)
- [ ] Regular backups of MinIO data

### 5.2 File Upload Security 🟡 HIGH

- [ ] File size limits configured
- [ ] File type validation enabled
- [ ] Malware scanning considered/implemented
- [ ] Upload rate limiting enabled
- [ ] File metadata sanitization implemented

---

## 6. Authentication & Authorization

### 6.1 Better-Auth Configuration 🔴 CRITICAL

- [ ] Strong `BETTER_AUTH_SECRET` (≥ 32 characters base64)
- [ ] `BETTER_AUTH_URL` configured correctly
- [ ] Session timeout configured appropriately
- [ ] Session storage secured (Redis with password if needed)
- [ ] Cookie security flags enabled (httpOnly, secure, sameSite)

### 6.2 Access Control 🟡 HIGH

- [ ] Multi-tenancy isolation verified
- [ ] Role-based access control (RBAC) implemented
- [ ] Default user has minimum privileges
- [ ] Admin accounts protected with strong passwords
- [ ] Consider 2FA for admin accounts (recommended)

---

## 7. Application Security

### 7.1 Code Security 🟡 HIGH

- [ ] No hardcoded secrets in code
  ```bash
  grep -r "password\|secret\|key" apps/ packages/ --include="*.ts" --include="*.js" | \
    grep -v "process.env" | grep -v ".example"
  ```
- [ ] All dependencies up to date
  ```bash
  bun outdated
  ```
- [ ] Security vulnerabilities addressed
  ```bash
  bun audit
  ```
- [ ] Input validation implemented
- [ ] SQL injection prevention (Prisma ORM handles this)
- [ ] XSS protection enabled

### 7.2 Error Handling 🟡 HIGH

- [ ] Error messages don't leak sensitive information
- [ ] Stack traces disabled in production
- [ ] Logging configured appropriately:
  - [ ] `LOG_LEVEL=info` (not debug in production)
  - [ ] Secrets redacted from logs
  - [ ] Centralized logging configured

---

## 8. Monitoring & Logging

### 8.1 Security Monitoring 🟡 HIGH

- [ ] Health check endpoints functional
- [ ] Uptime monitoring configured
- [ ] Security events logged:
  - [ ] Authentication attempts (success/failure)
  - [ ] Authorization failures
  - [ ] Suspicious activity
- [ ] Log retention policy defined
- [ ] Log analysis tools configured (ELK, Loki, CloudWatch)

### 8.2 Alerting 🟢 MEDIUM

- [ ] Alerts configured for:
  - [ ] Service downtime
  - [ ] High error rates
  - [ ] Failed authentication attempts
  - [ ] Resource exhaustion
  - [ ] Security incidents
- [ ] Alert notifications configured (email, Slack, PagerDuty)
- [ ] On-call rotation defined

---

## 9. Backup & Recovery

### 9.1 Backup Configuration 🟡 HIGH

- [ ] Automated database backups configured
- [ ] Backup frequency defined (minimum: daily)
- [ ] Backup retention policy defined (minimum: 30 days)
- [ ] Backups stored in secure location
- [ ] Backups encrypted at rest
- [ ] Backup restoration tested successfully
- [ ] Backup monitoring and alerting configured

### 9.2 Disaster Recovery 🟢 MEDIUM

- [ ] Disaster recovery plan documented
- [ ] RPO (Recovery Point Objective) defined
- [ ] RTO (Recovery Time Objective) defined
- [ ] DR plan tested (at least annually)
- [ ] Backup restoration time measured
- [ ] Failover procedures documented

---

## 10. Compliance & Documentation

### 10.1 Security Documentation 🟢 MEDIUM

- [ ] Security policies documented
- [ ] Incident response plan created
- [ ] Security contacts defined
- [ ] Vulnerability disclosure policy published
- [ ] Data retention policies documented
- [ ] GDPR/data privacy compliance addressed (if applicable)

### 10.2 Team Awareness 🟢 MEDIUM

- [ ] Team trained on security best practices
- [ ] Credential rotation schedule defined
- [ ] Security incident procedures communicated
- [ ] Regular security reviews scheduled
- [ ] Security champion identified

---

## 11. Pre-Deployment Validation

### 11.1 Automated Checks 🔴 CRITICAL

Run these commands before deployment:

```bash
# 1. Check for weak passwords in docker-compose
grep -i "password.*minioadmin\|password.*postgres\|password.*admin\|localdev" \
  docker-compose.prod.yml && echo "FAIL: Weak passwords found" || echo "PASS"

# 2. Verify .env files are gitignored
git check-ignore .env .env.production .env.local && echo "PASS" || echo "FAIL: .env files not ignored"

# 3. Check docker-compose configuration is valid
docker-compose --env-file .env.production -f docker-compose.prod.yml config > /dev/null && \
  echo "PASS" || echo "FAIL: Invalid docker-compose config"

# 4. Verify no secrets in git history
! git log --all -p | grep -qi "POSTGRES_PASSWORD.*=\|BETTER_AUTH_SECRET.*=\|MINIO.*PASSWORD.*=" && \
  echo "PASS" || echo "FAIL: Secrets found in git history"

# 5. Check secret file permissions
[ "$(stat -c %a .env.production 2>/dev/null)" = "600" ] && \
  echo "PASS" || echo "WARN: .env.production permissions not 600"
```

### 11.2 Manual Verification 🔴 CRITICAL

- [ ] Review all checklist items above
- [ ] Verify secrets are stored securely
- [ ] Confirm backup strategy is operational
- [ ] Test disaster recovery procedure
- [ ] Review recent security audit findings
- [ ] Obtain deployment approval from security team

---

## 12. Post-Deployment Verification

### 12.1 Security Validation 🔴 CRITICAL

After deployment, verify:

```bash
# 1. Check all services are healthy
docker-compose -f docker-compose.prod.yml ps
curl -f http://localhost:3000/health
curl -f http://localhost:3001/api/health
curl -f http://localhost:3002/health

# 2. Verify HTTPS is working
curl -I https://your-domain.com | grep "200 OK"
curl -I https://your-domain.com | grep "Strict-Transport-Security"

# 3. Test authentication
curl -X POST https://api.your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
# Should return authentication error (not 500)

# 4. Verify database connectivity
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d gcmc_kaj -c "SELECT 1;"

# 5. Check for secrets in logs
docker-compose -f docker-compose.prod.yml logs | \
  grep -i "password\|secret" | grep -v "****" | grep -v "REDACTED"
# Should return no matches
```

### 12.2 Monitoring Verification 🟡 HIGH

- [ ] Health checks responding correctly
- [ ] Metrics collection working
- [ ] Logs being aggregated
- [ ] Alerts triggering correctly (test)
- [ ] Backups completing successfully

---

## Sign-Off

**Deployment Information:**
- **Environment:** [Development / Staging / Production]
- **Date:** _______________
- **Deployed By:** _______________
- **Approved By:** _______________

**Security Checklist Completion:**
- [ ] All 🔴 CRITICAL items completed
- [ ] All 🟡 HIGH items completed or explicitly waived
- [ ] All 🟢 MEDIUM items reviewed

**Waived Items (if any):**
| Item | Reason | Approval | Target Date |
|------|--------|----------|-------------|
|      |        |          |             |

**Notes:**
```
[Add any additional security notes or considerations]
```

---

## Resources

**Documentation:**
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [SECURITY_AUDIT_REPORT.md](../audit/SECURITY_AUDIT_REPORT.md) - Security audit
- [CREDENTIALS_HARDENING.md](../audit/CREDENTIALS_HARDENING.md) - Hardening summary

**Tools:**
- [generate-secrets.sh](../scripts/generate-secrets.sh) - Secret generation script

**Contacts:**
- **Security Team:** security@your-domain.com
- **DevOps Team:** devops@your-domain.com
- **On-Call:** [PagerDuty/Phone Number]

---

**REMEMBER:** Security is not a one-time task. Regular reviews, updates, and audits are essential to maintain a secure platform.
