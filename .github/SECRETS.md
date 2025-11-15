# GitHub Secrets Configuration

This document describes all the GitHub secrets required for CI/CD workflows to function properly.

## Table of Contents

- [Required Secrets](#required-secrets)
  - [Database Secrets](#database-secrets)
  - [Application Secrets](#application-secrets)
  - [Storage Secrets](#storage-secrets)
  - [Deployment Secrets](#deployment-secrets)
  - [Notification Secrets](#notification-secrets)
- [Environment-Specific Secrets](#environment-specific-secrets)
- [How to Add Secrets](#how-to-add-secrets)
- [Secret Rotation Policy](#secret-rotation-policy)

---

## Required Secrets

### Database Secrets

#### `DATABASE_URL`

**Required for:** CI, Deployment, Database Migration workflows

**Description:** PostgreSQL connection string for the database

**Format:** `postgresql://username:password@host:port/database`

**Example:**
```
postgresql://postgres:password123@db.example.com:5432/gcmc_kaj_production
```

**How to generate:**
- Get this from your database provider (Railway, Supabase, AWS RDS, etc.)
- Format: `postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]`

**Security notes:**
- Use a dedicated database user with minimal required permissions for CI
- Use different databases for staging and production
- Ensure SSL is enabled in production

---

### Application Secrets

#### `BETTER_AUTH_SECRET`

**Required for:** CI, Build, Deployment workflows

**Description:** Secret key used for session encryption and JWT signing

**Format:** Base64-encoded string (32+ characters recommended)

**How to generate:**
```bash
openssl rand -base64 32
```

**Example:**
```
Jx7kP9mN2qR5tY8wZ1aB4cD6eF0gH3iJ5kL8mN1oP4qR7sT0uV3wX6yZ9aB2cD5e
```

**Security notes:**
- Never reuse this across environments
- Rotate regularly (every 90 days recommended)
- Changing this will invalidate all existing sessions

---

#### `CORS_ORIGIN`

**Required for:** Deployment workflows

**Description:** Comma-separated list of allowed CORS origins

**Example:**
```
https://app.example.com,https://www.example.com
```

**Security notes:**
- Never use `*` in production
- Include all legitimate frontend domains

---

### Storage Secrets

#### `MINIO_ENDPOINT`

**Required for:** Deployment workflows

**Description:** MinIO server endpoint (or S3-compatible storage)

**Example:**
```
s3.amazonaws.com
```
or
```
minio.example.com
```

---

#### `MINIO_PORT`

**Required for:** Deployment workflows (optional, defaults to 443 for HTTPS)

**Description:** MinIO server port

**Example:**
```
9000
```

---

#### `MINIO_USE_SSL`

**Required for:** Deployment workflows

**Description:** Whether to use SSL/TLS for MinIO connections

**Values:** `true` or `false`

**Example:**
```
true
```

---

#### `MINIO_ACCESS_KEY`

**Required for:** Deployment workflows

**Description:** MinIO access key (equivalent to AWS access key ID)

**Example:**
```
AKIAIOSFODNN7EXAMPLE
```

**How to generate:**
- From MinIO console: User > Access Keys > Create Access Key
- For AWS S3: IAM > Users > Security Credentials > Create Access Key

**Security notes:**
- Use IAM roles instead of access keys when possible
- Grant minimal required permissions (S3: GetObject, PutObject, DeleteObject)

---

#### `MINIO_SECRET_KEY`

**Required for:** Deployment workflows

**Description:** MinIO secret key (equivalent to AWS secret access key)

**Example:**
```
wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Security notes:**
- Never commit this to version control
- Rotate regularly (every 90 days recommended)

---

#### `MINIO_REGION`

**Required for:** Deployment workflows

**Description:** MinIO/S3 region

**Example:**
```
us-east-1
```

---

### Deployment Secrets

#### `REDIS_URL`

**Required for:** CI, Deployment workflows

**Description:** Redis connection string for BullMQ job queues

**Format:** `redis://[password]@[host]:[port]` or `rediss://` for TLS

**Example:**
```
redis://password123@redis.example.com:6379
```
or for TLS:
```
rediss://password123@redis.example.com:6380
```

**How to generate:**
- Get from Redis provider (Upstash, Redis Cloud, AWS ElastiCache, etc.)

**Security notes:**
- Use TLS (rediss://) in production
- Enable password authentication
- Use different Redis instances for different environments

---

#### `RAILWAY_TOKEN`

**Required for:** Deployment workflow (if using Railway)

**Description:** Railway API token for deployments

**How to generate:**
1. Go to Railway dashboard
2. Navigate to Account Settings > Tokens
3. Click "Create New Token"
4. Copy the token immediately (shown only once)

**Security notes:**
- Create separate tokens for CI/CD and personal use
- Limit token scope to specific projects if possible
- Rotate regularly

---

#### `GHCR_TOKEN` or `GITHUB_TOKEN`

**Required for:** Deployment workflow

**Description:** Token for pushing Docker images to GitHub Container Registry

**Note:** The `GITHUB_TOKEN` is automatically provided by GitHub Actions with appropriate permissions. You may need to configure additional permissions in your workflow.

**How to configure:**
- Go to repository Settings > Actions > General
- Under "Workflow permissions", select "Read and write permissions"
- Check "Allow GitHub Actions to create and approve pull requests"

**For personal access token (if needed):**
1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token with scopes: `write:packages`, `read:packages`, `delete:packages`

---

### Notification Secrets (Optional)

#### `SLACK_WEBHOOK_URL`

**Required for:** Deployment notifications (optional)

**Description:** Slack webhook URL for sending deployment notifications

**How to generate:**
1. Go to your Slack workspace
2. Navigate to Apps > Incoming Webhooks
3. Click "Add to Slack"
4. Select channel and copy the webhook URL

**Example:**
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

---

#### `DISCORD_WEBHOOK_URL`

**Required for:** Deployment notifications (optional)

**Description:** Discord webhook URL for sending deployment notifications

**How to generate:**
1. Go to your Discord server settings
2. Navigate to Integrations > Webhooks
3. Click "New Webhook"
4. Copy the webhook URL

**Example:**
```
https://discord.com/api/webhooks/000000000000000000/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Environment-Specific Secrets

GitHub supports environment-specific secrets. We recommend creating the following environments:

### Environments

1. **staging**
   - All secrets with staging values
   - Less restrictive protection rules

2. **production**
   - All secrets with production values
   - Require reviewers before deployment
   - Limit to protected branches only

### How to Create Environments

1. Go to repository Settings > Environments
2. Click "New environment"
3. Enter environment name (e.g., "production")
4. Configure protection rules:
   - Required reviewers
   - Wait timer
   - Deployment branches (e.g., only `main`)
5. Add environment-specific secrets

---

## How to Add Secrets

### Repository Secrets

1. Navigate to your repository on GitHub
2. Go to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Enter the secret name (must match exactly as listed above)
5. Enter the secret value
6. Click **Add secret**

### Environment Secrets

1. Navigate to your repository on GitHub
2. Go to **Settings** > **Environments**
3. Select the environment (e.g., "production")
4. Under "Environment secrets", click **Add secret**
5. Enter the secret name and value
6. Click **Add secret**

---

## Secret Rotation Policy

For security best practices, rotate secrets on the following schedule:

| Secret Type | Rotation Frequency | Notes |
|-------------|-------------------|-------|
| `DATABASE_URL` | When compromised | Only password portion |
| `BETTER_AUTH_SECRET` | Every 90 days | Will invalidate sessions |
| `REDIS_URL` | When compromised | Only password portion |
| `MINIO_ACCESS_KEY` | Every 90 days | Update application after rotation |
| `MINIO_SECRET_KEY` | Every 90 days | Update application after rotation |
| `RAILWAY_TOKEN` | Every 180 days | Minimal risk if properly scoped |
| Webhook URLs | When compromised | Regenerate from provider |

### Rotation Checklist

When rotating secrets:

- [ ] Generate new secret
- [ ] Update in GitHub Secrets
- [ ] Update in production environment
- [ ] Verify workflows still pass
- [ ] Update in all relevant environments
- [ ] Document rotation in changelog
- [ ] Revoke old secret (if applicable)
- [ ] Test application functionality

---

## Testing Secrets in CI

For testing purposes, some secrets can use dummy values:

### CI Test Values

These are used in the CI workflow for testing:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db
REDIS_URL=redis://localhost:6379
BETTER_AUTH_SECRET=test-secret-key-for-ci-only-do-not-use-in-production
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_REGION=us-east-1
NODE_ENV=test
```

**Note:** These values are hardcoded in the CI workflow and work with the service containers. No GitHub secrets are required for CI to run basic tests.

---

## Security Best Practices

1. **Never commit secrets to version control**
   - Use `.env.example` for documentation
   - Add `.env` to `.gitignore`

2. **Use environment-specific secrets**
   - Different secrets for development, staging, and production
   - Never use production secrets in development

3. **Rotate secrets regularly**
   - Follow the rotation policy above
   - Automate rotation where possible

4. **Limit secret access**
   - Only add secrets that are actually needed
   - Use environment protection rules for production

5. **Monitor secret usage**
   - Review GitHub Actions logs regularly
   - Set up alerts for failed deployments

6. **Use secret scanning**
   - Enable GitHub secret scanning
   - Set up branch protection rules

---

## Troubleshooting

### Common Issues

#### Workflow fails with "Secret not found"
- Ensure the secret name matches exactly (case-sensitive)
- Verify the secret is added to the correct environment
- Check that the workflow has access to the environment

#### Database connection fails in CI
- Verify `DATABASE_URL` format is correct
- Ensure PostgreSQL service is running in CI
- Check that the port is correct (5432)

#### Docker push fails
- Verify `GITHUB_TOKEN` has write:packages permission
- Check repository visibility settings
- Ensure image name is lowercase

#### Deployment fails
- Check all required secrets are set for the environment
- Verify `RAILWAY_TOKEN` is valid and not expired
- Ensure environment protection rules allow deployment

---

## Support

For questions or issues with secrets configuration:

1. Check this documentation first
2. Review GitHub Actions logs for specific error messages
3. Contact the DevOps team
4. Open an issue in the repository (without including actual secret values)

---

**Last Updated:** 2025-11-15

**Document Version:** 1.0.0

**Maintained by:** @kareemschultz
