# Developer Setup Guide

> **KAJ-GCMC BTS Platform - Complete Developer Environment Setup**
> **Version:** 1.0.0
> **Last Updated:** 2025-11-18

This comprehensive guide will help you set up a complete development environment for the KAJ-GCMC Business Tax Services platform.

---

## 📚 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (5 Minutes)](#quick-start-5-minutes)
- [Detailed Setup](#detailed-setup)
- [Development Environment](#development-environment)
- [IDE Configuration](#ide-configuration)
- [Testing Setup](#testing-setup)
- [Debugging & Troubleshooting](#debugging--troubleshooting)
- [Performance Optimization](#performance-optimization)
- [Common Development Tasks](#common-development-tasks)

---

## ✅ Prerequisites

### Required Software

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Bun** | 1.0.0+ | Runtime & Package Manager | [bun.sh](https://bun.sh) |
| **Docker** | 20.0+ | Container Runtime | [docker.com](https://docker.com) |
| **Docker Compose** | 2.0+ | Multi-container Orchestration | Included with Docker |
| **Git** | 2.30+ | Version Control | [git-scm.com](https://git-scm.com) |
| **Node.js** | 18.0+ | Alternative Runtime | [nodejs.org](https://nodejs.org) |

### System Requirements

```yaml
Minimum Requirements:
  CPU: 4 cores (Intel/AMD x64 or Apple Silicon)
  Memory: 16 GB RAM
  Storage: 50 GB free space (SSD recommended)
  OS: macOS 11+, Ubuntu 20.04+, Windows 10+ with WSL2

Recommended:
  CPU: 8 cores
  Memory: 32 GB RAM
  Storage: 100 GB SSD
  Network: Broadband internet connection
```

### Development Tools (Optional but Recommended)

```bash
# Database tools
brew install postgresql-client  # macOS
apt install postgresql-client    # Ubuntu

# Redis CLI
brew install redis              # macOS
apt install redis-tools         # Ubuntu

# Cloud tools (for deployment)
brew install awscli terraform   # macOS
apt install awscli terraform    # Ubuntu

# Monitoring tools
brew install htop btop          # macOS
apt install htop btop           # Ubuntu
```

---

## ⚡ Quick Start (5 Minutes)

For experienced developers who want to get running quickly:

```bash
# 1. Clone repository
git clone https://github.com/your-org/kaj-gcmc-bts.git
cd kaj-gcmc-bts

# 2. Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # or restart terminal

# 3. Install dependencies
bun install

# 4. Start infrastructure
docker compose up -d postgres redis minio

# 5. Setup environment
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/server/.env.example apps/server/.env

# 6. Setup database
bun run db:push
bun run db:seed

# 7. Start development
bun run dev

# 8. Open application
open http://localhost:3001  # Web app
open http://localhost:3000  # API
```

**Default Login:**
- Email: `admin@gcmc-kaj.com`
- Password: `GCMCAdmin2024!`

---

## 🔧 Detailed Setup

### 1. Repository Setup

```bash
# Clone with all submodules
git clone --recursive https://github.com/your-org/kaj-gcmc-bts.git
cd kaj-gcmc-bts

# Verify repository structure
ls -la
# Should see: apps/, packages/, docs/, docker-compose.yml, etc.

# Set up Git hooks (for code quality)
bun run prepare
```

### 2. Environment Configuration

#### Root Environment (.env)

```bash
# Copy and configure root environment
cp .env.example .env

# Edit configuration
nano .env  # or use your preferred editor
```

Essential variables:

```bash
# Database
DATABASE_URL=postgresql://gcmc:gcmc@localhost:5432/gcmc

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_PREFIX=gcmc-dev

# Authentication
AUTH_SECRET=your-super-secret-key-for-development-only
AUTH_URL=http://localhost:3001

# Development settings
NODE_ENV=development
LOG_LEVEL=debug
NEXT_TELEMETRY_DISABLED=1
```

#### App-Specific Environments

```bash
# Web app environment
cp apps/web/.env.example apps/web/.env
# Edit: NEXT_PUBLIC_API_URL=http://localhost:3000

# Server environment
cp apps/server/.env.example apps/server/.env
# Edit: PORT=3000

# Worker environment
cp apps/worker/.env.example apps/worker/.env
# Edit: WORKER_CONCURRENCY=5
```

### 3. Infrastructure Setup

#### Start Required Services

```bash
# Start PostgreSQL, Redis, MinIO
docker compose up -d postgres redis minio

# Verify services are running
docker compose ps

# Check service logs if needed
docker compose logs postgres
docker compose logs redis
docker compose logs minio
```

#### Service Access

```bash
# PostgreSQL
psql postgresql://gcmc:gcmc@localhost:5432/gcmc

# Redis
redis-cli -h localhost -p 6379

# MinIO Console
open http://localhost:9001
# Login: minioadmin / minioadmin
```

### 4. Database Setup

#### Initialize Database

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Optional: Run migrations (if using migrations)
bun run db:migrate

# Seed development data
bun run db:seed

# Verify setup
bun run db:studio  # Open Prisma Studio
```

#### Database Verification

```bash
# Connect to database
psql postgresql://gcmc:gcmc@localhost:5432/gcmc

# Check tables
\dt

# Verify seed data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM tenants;
SELECT COUNT(*) FROM roles;
```

### 5. Install Dependencies

```bash
# Install all workspace dependencies
bun install

# Verify installation
bun run --help

# Check workspace configuration
cat package.json | jq '.workspaces'
```

---

## 🛠 Development Environment

### Start Development Servers

#### Option 1: All Services (Recommended)

```bash
# Start all apps in development mode
bun run dev

# This starts:
# - Web app: http://localhost:3001
# - API server: http://localhost:3000
# - Background worker: (no HTTP interface)
```

#### Option 2: Individual Services

```bash
# Terminal 1: API Server
bun run dev:api

# Terminal 2: Web Application
bun run dev:web

# Terminal 3: Background Worker
bun run dev:worker

# Terminal 4: Database Studio (optional)
bun run db:studio
```

### Development URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Web App** | http://localhost:3001 | Main application interface |
| **API** | http://localhost:3000 | tRPC API endpoints |
| **API Health** | http://localhost:3000/health | Health check |
| **Prisma Studio** | http://localhost:5555 | Database management |
| **MinIO Console** | http://localhost:9001 | File storage management |

### Hot Reloading

The development setup includes hot reloading for:

- **Next.js Web App**: Automatic page reload on file changes
- **Hono API Server**: Automatic restart on TypeScript changes
- **Prisma Schema**: Automatic client regeneration
- **Shared Packages**: Cross-workspace dependency updates

---

## 💻 IDE Configuration

### Visual Studio Code

#### Recommended Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "biomejs.biome",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "ms-playwright.playwright",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode-remote.remote-containers"
  ]
}
```

#### Workspace Settings (.vscode/settings.json)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/bun.lockb": true,
    "**/.turbo": true,
    "**/dist": true,
    "**/build": true
  }
}
```

#### Debug Configuration (.vscode/launch.json)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/server/src/index.ts",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["--inspect"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Worker",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/worker/src/index.ts",
      "runtimeExecutable": "bun",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### IntelliJ IDEA / WebStorm

#### Project Configuration

1. **Enable TypeScript Service**: File → Settings → Languages → TypeScript
2. **Configure Biome**: File → Settings → Tools → File Watchers
3. **Setup Run Configurations**:
   - Name: "Dev Server"
   - Command: `bun run dev`
   - Working Directory: Project root

### Vim/Neovim

```lua
-- Essential plugins for development
require('packer').use {
  'neovim/nvim-lspconfig',
  'jose-elias-alvarez/null-ls.nvim',  -- For Biome integration
  'windwp/nvim-autopairs',
  'nvim-treesitter/nvim-treesitter',
  'hrsh7th/nvim-cmp',  -- Autocomplete
}

-- LSP configuration
local lspconfig = require('lspconfig')

-- TypeScript
lspconfig.tsserver.setup{}

-- Prisma
lspconfig.prismals.setup{}

-- Tailwind CSS
lspconfig.tailwindcss.setup{}
```

---

## 🧪 Testing Setup

### Test Environment

```bash
# Install test dependencies (if not already installed)
bun install

# Setup test database
cp .env.test.example .env.test
# Edit TEST_DATABASE_URL in .env.test

# Run test database setup
bun run test:db:setup
```

### Running Tests

```bash
# All tests
bun run test

# Watch mode
bun run test:watch

# Coverage report
bun run test:coverage

# Specific test suites
bun run test:api      # API tests only
bun run test:rbac     # RBAC tests only
bun run test:e2e      # End-to-end tests
```

### Test Configuration

#### Vitest Config (vitest.workspace.ts)

```typescript
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  './packages/*/vitest.config.ts',
  './apps/*/vitest.config.ts',
  {
    test: {
      name: 'integration',
      include: ['tests/**/*.test.ts'],
      environment: 'node',
      setupFiles: ['./test-setup.ts'],
    },
  },
]);
```

#### E2E Testing with Playwright

```bash
# Install Playwright
bunx playwright install

# Run E2E tests
bun run test:e2e

# Run with UI
bun run test:e2e:ui

# Generate test code
bunx playwright codegen http://localhost:3001
```

---

## 🐛 Debugging & Troubleshooting

### Debug Tools

#### Application Logging

```typescript
// Use structured logging in development
import { logger } from '@GCMC-KAJ/config/logger';

logger.debug('Processing client request', {
  clientId: 123,
  userId: 'user-456',
  action: 'create_document'
});
```

#### Database Query Debugging

```typescript
// Enable Prisma query logging
// packages/db/src/index.ts
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});
```

#### Network Debugging

```bash
# Monitor API calls
curl -v http://localhost:3000/trpc/clients.list

# Check tRPC requests
bunx trpc-cli info --url http://localhost:3000/trpc

# Monitor database connections
psql postgresql://gcmc:gcmc@localhost:5432/gcmc \
  -c "SELECT * FROM pg_stat_activity;"
```

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port
lsof -ti :3000
# or
netstat -tulpn | grep :3000

# Kill process
kill -9 $(lsof -ti :3000)
```

#### 2. Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check connection
psql postgresql://gcmc:gcmc@localhost:5432/gcmc -c "SELECT 1"

# Reset database
docker compose down postgres
docker volume rm kaj-gcmc-bts_postgres_data
docker compose up -d postgres
bun run db:push
```

#### 3. Environment Variable Issues

```bash
# Verify environment loading
bun run -e "console.log(process.env.DATABASE_URL)"

# Check all environment variables
bun run -e "console.table(process.env)"
```

#### 4. Dependency Issues

```bash
# Clear node_modules and lockfile
rm -rf node_modules bun.lockb
bun install

# Clear Turbo cache
rm -rf .turbo
bun run build

# Reset everything
bun run clean && bun install
```

---

## ⚡ Performance Optimization

### Development Performance

#### Turbo Configuration

```json
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

#### Bun Optimizations

```bash
# Use Bun's fast bundler
export BUN_BUNDLE=true

# Enable Bun's package manager optimizations
export BUN_INSTALL_CACHE_DIR=~/.bun/install/cache

# Use Bun runtime for better performance
export BUN_RUNTIME=bun
```

### Database Performance

```sql
-- Development database optimizations
-- postgresql.conf adjustments for development

shared_buffers = 256MB
work_mem = 8MB
maintenance_work_mem = 128MB
effective_cache_size = 4GB

-- Enable query logging for development
log_statement = 'all'
log_min_duration_statement = 0
```

### File Watching Optimization

```bash
# Increase file watch limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# macOS (if using watchman)
brew install watchman
```

---

## 🔄 Common Development Tasks

### Database Operations

```bash
# Reset database completely
bun run db:reset

# Generate new migration
bun run db:migrate:create --name add_new_feature

# Apply pending migrations
bun run db:migrate

# View migration status
bun run db:migrate:status

# Seed specific data
bun run seed:users
bun run seed:test-data
```

### Code Generation

```bash
# Generate Prisma client
bun run db:generate

# Generate tRPC types
bun run api:generate-types

# Generate OpenAPI spec
bun run api:generate-openapi

# Update all generated code
bun run generate
```

### Code Quality

```bash
# Format all code
bun run format

# Lint and fix issues
bun run lint:fix

# Type checking
bun run type-check

# Full quality check
bun run quality:check
```

### Testing Workflows

```bash
# Run tests for changed files
bun run test:changed

# Run tests related to specific file
bun run test apps/api/src/routers/clients.ts

# Update test snapshots
bun run test:update-snapshots

# Performance testing
bun run test:performance
```

### Docker Development

```bash
# Build development images
docker compose -f docker-compose.dev.yml build

# Run in Docker for testing
docker compose -f docker-compose.dev.yml up

# Shell into running container
docker exec -it kaj-gcmc-bts-api-1 /bin/bash

# View container logs
docker compose logs -f api
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Stage and commit with conventional commits
git add .
git commit -m "feat(clients): add client search functionality"

# Update main branch
git checkout main
git pull origin main

# Rebase feature branch
git checkout feature/new-feature
git rebase main

# Push feature branch
git push origin feature/new-feature
```

---

## 📋 Development Checklist

### Initial Setup

- [ ] Prerequisites installed (Bun, Docker, Git)
- [ ] Repository cloned and dependencies installed
- [ ] Environment files configured
- [ ] Infrastructure services running (PostgreSQL, Redis, MinIO)
- [ ] Database setup and seeded
- [ ] Development servers starting successfully
- [ ] Can access web app at localhost:3001
- [ ] Can access API at localhost:3000
- [ ] Tests passing
- [ ] IDE/editor configured with recommended extensions

### Daily Development

- [ ] Pull latest changes from main
- [ ] Check if dependencies need updating
- [ ] Run tests before making changes
- [ ] Use conventional commit messages
- [ ] Format code before committing
- [ ] Ensure no lint errors
- [ ] Write tests for new features
- [ ] Update documentation if needed

### Before PR Submission

- [ ] All tests passing
- [ ] Code formatted and linted
- [ ] Type checking passes
- [ ] No console errors in browser
- [ ] Documentation updated
- [ ] Branch rebased on latest main
- [ ] Descriptive PR description
- [ ] Linked to relevant issues

---

## 🆘 Getting Help

### Documentation Resources

- [API Documentation](../api/API_REFERENCE.md)
- [Database Schema](../DATABASE_SCHEMA.md)
- [Project Structure](../PROJECT_STRUCTURE.md)
- [Testing Guide](../testing/TESTING_GUIDE.md)

### Community & Support

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Wiki**: Extended documentation and guides
- **Email**: [dev-team@gcmc-kaj.com](mailto:dev-team@gcmc-kaj.com)

### Debugging Resources

```bash
# Health check script
./scripts/health-check.sh

# Comprehensive diagnostic
./scripts/diagnose-development.sh

# Reset development environment
./scripts/reset-dev-environment.sh
```

---

## 🚀 Next Steps

After completing the setup:

1. **Explore the Codebase**: Review the project structure and key files
2. **Run Tests**: Familiarize yourself with the testing patterns
3. **Make a Small Change**: Try adding a simple feature or fix
4. **Read Contributing Guide**: Understand the development workflow
5. **Join the Community**: Introduce yourself and ask questions

---

**Developer Setup Guide Version:** 1.0.0
**Platform Version:** 1.0.0
**Last Updated:** 2025-11-18
**Next Review:** 2025-12-18

Happy coding! 🎉