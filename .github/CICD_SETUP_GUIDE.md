# CI/CD Setup Guide

This guide will help you set up and configure the GitHub Actions CI/CD pipelines for the GCMC-KAJ project.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Workflows Overview](#workflows-overview)
3. [Initial Setup](#initial-setup)
4. [Configuration](#configuration)
5. [Usage Guide](#usage-guide)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- GitHub repository with admin access
- Access to deployment platforms (Railway, AWS, etc.)
- Database and Redis instances for staging/production

### 5-Minute Setup

1. **Add Required Secrets** (see [SECRETS.md](./SECRETS.md))
   ```bash
   # Minimum required secrets for CI to work:
   # No secrets required for basic CI!
   # CI uses service containers with default credentials
   ```

2. **Enable GitHub Actions**
   - Go to repository **Settings** > **Actions** > **General**
   - Under "Actions permissions", select "Allow all actions and reusable workflows"
   - Under "Workflow permissions", select "Read and write permissions"
   - Save changes

3. **Push to trigger CI**
   ```bash
   git add .
   git commit -m "chore(ci): Add CI/CD workflows"
   git push
   ```

4. **Verify workflows are running**
   - Go to **Actions** tab in your repository
   - You should see workflows running

---

## Workflows Overview

### 1. CI Workflow (`ci.yml`)

**Triggers:**
- Push to `main`, `develop`, or `release/**` branches
- Pull requests to `main` or `develop`

**What it does:**
- ✅ Runs Biome linting
- ✅ Type checks all packages with TypeScript
- ✅ Runs Vitest tests with PostgreSQL and Redis
- ✅ Generates Prisma client
- ✅ Runs database migrations in test mode
- ✅ Builds all apps and packages
- ✅ Runs security audit
- ✅ Caches dependencies and build outputs

**Duration:** ~5-8 minutes

**Status Badge:**
```markdown
![CI](https://github.com/YOUR_USERNAME/kaj-gcmc-bts/actions/workflows/ci.yml/badge.svg)
```

---

### 2. Deployment Workflow (`deploy.yml`)

**Triggers:**
- Push to `main` branch
- Git tags matching `v*` (e.g., `v1.0.0`)
- Manual trigger via workflow_dispatch

**What it does:**
- ⏳ Waits for CI to pass
- 🐳 Builds Docker images for web, server, and worker
- 📦 Pushes images to GitHub Container Registry (ghcr.io)
- 🚀 Deploys to Railway (optional)
- 📧 Sends deployment notifications

**Duration:** ~10-15 minutes

**Docker Images:**
```
ghcr.io/YOUR_USERNAME/kaj-gcmc-bts/web:latest
ghcr.io/YOUR_USERNAME/kaj-gcmc-bts/server:latest
ghcr.io/YOUR_USERNAME/kaj-gcmc-bts/worker:latest
```

---

### 3. PR Checks Workflow (`pr-checks.yml`)

**Triggers:**
- Pull request opened, edited, synchronized, or reopened

**What it does:**
- ✅ Validates PR title follows conventional commits
- ⚠️ Checks for breaking changes
- 🔒 Runs security audit
- 📦 Checks bundle size and comments on PR
- 📊 Calculates and reports PR statistics
- 🔍 Reviews dependencies for security issues

**Duration:** ~3-5 minutes

---

### 4. Database Migration Workflow (`migrate.yml`)

**Triggers:**
- Manual workflow_dispatch only (for safety)

**What it does:**
- 💾 Creates database backup (optional)
- 🗄️ Runs Prisma migrations
- ✅ Verifies schema after migration
- 🔄 Rolls back on failure (if backup was created)
- 📧 Sends notification on completion

**Duration:** ~2-5 minutes (depends on migration complexity)

**⚠️ IMPORTANT:** This workflow requires manual approval for production!

---

## Initial Setup

### Step 1: Configure Repository Settings

1. **Enable GitHub Actions**
   - Settings > Actions > General
   - Allow all actions and reusable workflows
   - Enable "Read and write permissions"
   - Enable "Allow GitHub Actions to create and approve pull requests"

2. **Enable GitHub Container Registry**
   - Settings > Packages
   - Ensure package visibility is set appropriately

3. **Set up Branch Protection**
   ```
   Settings > Branches > Add branch protection rule

   Branch name pattern: main
   ☑ Require a pull request before merging
   ☑ Require status checks to pass before merging
     - Select: All Checks Passed
     - Select: Validate PR Title
   ☑ Require conversation resolution before merging
   ☑ Do not allow bypassing the above settings
   ```

---

### Step 2: Create Environments

Create two environments for different deployment stages:

#### Staging Environment

1. Go to Settings > Environments
2. Click "New environment"
3. Name: `staging`
4. Protection rules:
   - ☑ Required reviewers: (optional for staging)
   - ☑ Deployment branches: Select "Protected branches only"
5. Add environment secrets (see SECRETS.md)

#### Production Environment

1. Go to Settings > Environments
2. Click "New environment"
3. Name: `production`
4. Protection rules:
   - ☑ Required reviewers: Add team members (REQUIRED)
   - ☑ Wait timer: 5 minutes (optional)
   - ☑ Deployment branches: Select "Protected branches only"
5. Add environment secrets (see SECRETS.md)

---

### Step 3: Add Secrets

See [SECRETS.md](./SECRETS.md) for detailed secret configuration.

#### Required for Deployment

```bash
# Database
DATABASE_URL

# Redis
REDIS_URL

# Authentication
BETTER_AUTH_SECRET
CORS_ORIGIN

# Storage (MinIO/S3)
MINIO_ENDPOINT
MINIO_PORT
MINIO_USE_SSL
MINIO_ACCESS_KEY
MINIO_SECRET_KEY
MINIO_REGION

# Deployment (if using Railway)
RAILWAY_TOKEN
```

#### Optional

```bash
# Notifications
SLACK_WEBHOOK_URL
DISCORD_WEBHOOK_URL
```

---

### Step 4: Configure Dependabot (Optional)

Dependabot is already configured in `.github/dependabot.yml`.

To enable:
1. Settings > Security & analysis
2. Enable "Dependabot alerts"
3. Enable "Dependabot security updates"
4. Enable "Dependabot version updates"

Dependabot will:
- Check for dependency updates weekly
- Create PRs for updates
- Group related updates together
- Update GitHub Actions automatically

---

## Configuration

### Customizing Workflows

#### Modify Branch Triggers

Edit `.github/workflows/ci.yml`:

```yaml
on:
  push:
    branches:
      - main
      - develop
      - feature/*  # Add custom branch patterns
```

#### Adjust Cache Strategy

```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: |
      ~/.bun/install/cache
      node_modules
    key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
```

#### Change Test Database

Edit service containers in `ci.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine  # Change version if needed
    env:
      POSTGRES_DB: test_db
```

#### Configure Deployment Target

Edit `.github/workflows/deploy.yml` to change deployment platform:

```yaml
# For Render instead of Railway
- name: Deploy to Render
  run: |
    curl -X POST "https://api.render.com/deploy/srv-xxxx?key=${{ secrets.RENDER_DEPLOY_KEY }}"
```

---

## Usage Guide

### Running CI Manually

```bash
# Go to Actions tab
# Select "CI" workflow
# Click "Run workflow"
# Select branch
# Click "Run workflow"
```

### Creating a Release

```bash
# Create and push a git tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# This will trigger deployment workflow
```

### Running Database Migrations

1. Go to **Actions** tab
2. Select "Database Migration" workflow
3. Click "Run workflow"
4. Select:
   - Environment: `staging` or `production`
   - Migration action: `deploy`, `status`, or `reset`
   - Backup: `true` (recommended)
   - Dry run: `true` (to preview changes)
5. Click "Run workflow"

**⚠️ For production migrations:**
- Always create a backup first
- Run a dry run to preview changes
- Notify team before running
- Have a rollback plan ready

### Viewing Deployment Status

```bash
# Check GitHub Actions tab for deployment status
# Or use GitHub CLI:
gh run list --workflow=deploy.yml

# Watch a specific run:
gh run watch <run-id>
```

---

## CI/CD Best Practices

### 1. Always Use Feature Branches

```bash
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature
# Create PR
```

### 2. Follow Conventional Commits

```bash
git commit -m "feat: Add user authentication"
git commit -m "fix: Resolve database connection issue"
git commit -m "docs: Update API documentation"
```

### 3. Keep PRs Small

- Focus on one feature or fix per PR
- Easier to review and test
- Faster CI/CD pipeline execution

### 4. Monitor Build Times

- Check workflow duration trends
- Optimize slow steps
- Use caching effectively

### 5. Review Security Alerts

- Check Dependabot PRs regularly
- Review security audit results
- Update dependencies promptly

---

## Troubleshooting

### CI Failing on Type Check

```bash
# Run type check locally first
bun run check-types

# Fix type errors in your code
# Commit and push
```

### Build Failing

```bash
# Run build locally to reproduce
bun run build

# Check for missing environment variables
# Verify all dependencies are installed
```

### Docker Build Failing

```bash
# Test Docker build locally
docker build -f apps/web/Dockerfile .

# Check Dockerfile syntax
# Verify all required files are included
```

### Deployment Failing

Common issues:

1. **Missing secrets**
   - Verify all required secrets are added
   - Check secret names match exactly

2. **Database connection**
   - Verify DATABASE_URL is correct
   - Check database is accessible from GitHub Actions

3. **Railway token expired**
   - Generate new token
   - Update RAILWAY_TOKEN secret

### Migration Failing

```bash
# Check migration status locally
cd packages/db
bunx prisma migrate status

# Verify DATABASE_URL is correct
# Check for schema conflicts
# Review migration SQL
```

### Workflow Not Triggering

1. **Check workflow file syntax**
   ```bash
   # Use GitHub's workflow validator
   # Or use act to test locally: https://github.com/nektos/act
   ```

2. **Verify branch protection rules**
   - Settings > Branches
   - Ensure workflow is not blocked

3. **Check Actions permissions**
   - Settings > Actions > General
   - Verify workflows are enabled

---

## Performance Optimization

### Reduce CI Time

1. **Use caching effectively**
   ```yaml
   - uses: actions/cache@v4
     with:
       path: ~/.bun/install/cache
       key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
   ```

2. **Run jobs in parallel**
   ```yaml
   jobs:
     lint:
       # Runs in parallel with type-check
     type-check:
       # Runs in parallel with lint
   ```

3. **Use matrix strategy for multi-app builds**
   ```yaml
   strategy:
     matrix:
       app: [web, server, worker]
   ```

### Reduce Build Size

1. **Use multi-stage Docker builds**
2. **Minimize layers in Dockerfile**
3. **Use .dockerignore file**

---

## Advanced Configuration

### Custom Workflow Dispatch Inputs

Add custom inputs to workflows:

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - development
          - staging
          - production
```

### Conditional Steps

Run steps only when conditions are met:

```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: echo "Deploying to production"
```

### Reusable Workflows

Create reusable workflows for common tasks:

```yaml
# .github/workflows/reusable-test.yml
on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
```

---

## Monitoring and Alerts

### Set Up Status Checks

1. Settings > Branches > Branch protection rules
2. Add required status checks:
   - All Checks Passed
   - Validate PR Title
   - Bundle Size Check

### Enable Email Notifications

1. GitHub Settings (personal) > Notifications
2. Configure Actions notifications
3. Choose notification preferences

### Set Up Slack/Discord Notifications

Uncomment notification steps in `deploy.yml`:

```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Deployment ${{ needs.build-and-push.result }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Security Considerations

### Secret Management

- Never commit secrets to code
- Rotate secrets regularly (see SECRETS.md)
- Use environment-specific secrets
- Enable secret scanning

### Dependency Security

- Enable Dependabot alerts
- Review security advisories
- Update dependencies promptly
- Use `bun pm audit` regularly

### Container Security

- Use official base images
- Scan images for vulnerabilities
- Keep base images updated
- Use non-root users in containers

---

## Maintenance

### Regular Tasks

**Weekly:**
- [ ] Review Dependabot PRs
- [ ] Check CI/CD workflow status
- [ ] Review failed builds

**Monthly:**
- [ ] Review and update dependencies
- [ ] Check build performance metrics
- [ ] Review secret rotation schedule

**Quarterly:**
- [ ] Rotate production secrets
- [ ] Review and update workflows
- [ ] Update documentation
- [ ] Review access controls

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Bun Documentation](https://bun.sh/docs)
- [Turbo Documentation](https://turbo.build/repo/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Documentation](https://docs.docker.com/)

---

## Support

For issues or questions:

1. Check this guide and [SECRETS.md](./SECRETS.md)
2. Review GitHub Actions logs
3. Check [Troubleshooting](#troubleshooting) section
4. Open an issue in the repository
5. Contact @kareemschultz

---

**Last Updated:** 2025-11-15

**Document Version:** 1.0.0

**Maintained by:** @kareemschultz
