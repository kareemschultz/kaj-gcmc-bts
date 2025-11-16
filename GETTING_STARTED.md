# Getting Started with GCMC-KAJ Platform

**Quick Start Guide for Development & Testing**

This guide will help you set up and run the GCMC-KAJ compliance platform locally to see all the recent changes including the new brand design, auth forms, and UI improvements.

---

## Prerequisites

Before you begin, ensure you have installed:

- **Bun** v1.3.2+ - [Install Bun](https://bun.sh/)
- **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **Git** - For cloning the repository

---

## Step 1: Environment Setup

### Create Environment File

The application needs environment variables to run. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

### Update Environment Variables

Open `.env` and update the following **required** variables:

```bash
# Database - Use these for local development
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/gcmc_kaj"

# Auth - Generate a secure secret
BETTER_AUTH_SECRET="your-secret-here-use-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"
CORS_ORIGIN="http://localhost:3001,http://localhost:3002"

# Redis
REDIS_URL="redis://localhost:6379"

# MinIO - Use these for local development
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_REGION="us-east-1"

# Application URLs
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_SERVER_URL="http://localhost:3000"
PORTAL_URL="http://localhost:3002"

# Email (Optional - for development, emails will be logged)
EMAIL_PROVIDER="log"
SUPPORT_EMAIL="support@example.com"

# PostgreSQL (for Docker)
POSTGRES_DB="gcmc_kaj"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="postgres123"

# MinIO (for Docker)
MINIO_ROOT_USER="minioadmin"
MINIO_ROOT_PASSWORD="minioadmin"
MINIO_BUCKET_PREFIX="tenant"

# Feature Flags
ENABLE_EMAIL_NOTIFICATIONS="false"
ENABLE_SMS_NOTIFICATIONS="false"
ENABLE_COMPLIANCE_ENGINE="true"
ENABLE_ANALYTICS="true"
```

### Generate Auth Secret

Generate a secure authentication secret:

```bash
# On macOS/Linux
openssl rand -base64 32

# Copy the output and paste it as BETTER_AUTH_SECRET in your .env file
```

---

## Step 2: Install Dependencies

Install all project dependencies using Bun:

```bash
bun install
```

This will install dependencies for all apps and packages in the monorepo.

**Expected output:**
```
✓ 1436 packages installed [~25s]
```

---

## Step 3: Start Infrastructure Services

Start PostgreSQL, Redis, and MinIO using Docker Compose:

```bash
docker compose up -d postgres redis minio
```

**Expected output:**
```
✓ Container gcmc-kaj-postgres   Started
✓ Container gcmc-kaj-redis      Started
✓ Container gcmc-kaj-minio      Started
```

### Verify Services are Running

```bash
docker compose ps
```

You should see all three services in "Up" state.

---

## Step 4: Database Setup

### Generate Prisma Client

Generate the Prisma client from the schema:

```bash
bun run db:generate
```

**Expected output:**
```
✔ Generated Prisma Client (v6.19.0) to ./prisma/generated in 318ms
```

### Push Database Schema

Push the Prisma schema to your PostgreSQL database:

```bash
bun run db:push
```

**Expected output:**
```
✔ Database synchronized successfully
```

This creates all the necessary tables, relationships, and indexes.

### (Optional) Seed Database

If you want sample data to explore the application:

```bash
cd packages/db
bun run seed
cd ../..
```

---

## Step 5: Start All Development Servers

Start all applications in development mode:

```bash
bun dev
```

This starts:
- **API Server** (port 3000) - Hono + tRPC backend
- **Web App** (port 3001) - Admin dashboard (Next.js)
- **Portal App** (port 3002) - Client portal (Next.js)
- **Worker** - Background job processor

**Expected output:**
```
• Packages in scope: server, web, portal, @GCMC-KAJ/worker
• Running dev in 4 packages

server:dev: Server running at http://localhost:3000
web:dev: ▲ Next.js 16.0.3
web:dev: - Local: http://localhost:3001
portal:dev: ▲ Next.js 16.0.3
portal:dev: - Local: http://localhost:3002
@GCMC-KAJ/worker:dev: Worker started successfully
```

---

## Step 6: Access the Applications

### 🌐 Web Admin Dashboard
**URL:** http://localhost:3001

**What to see:**
- **New Login Form** - Professional design with brand blue colors, validation icons, password visibility toggle
- **Dashboard** - Real-time compliance metrics, charts, activity feed
- **Clients** - Client management with new semantic colors
- **Documents** - Document tracking with emerald (success), rose (danger), amber (warning) colors
- **Filings** - Filing management with updated status indicators
- **Analytics** - Complete analytics dashboard with 6 tabs

### 🏢 Client Portal
**URL:** http://localhost:3002

**What to see:**
- **Sign-up Form** - New branded sign-up with password strength indicator
- **Client Dashboard** - Self-service portal for clients
- **Documents** - Client document viewing
- **Tasks** - Assigned tasks view

### 🔧 API Server
**URL:** http://localhost:3000

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T...",
  "database": "connected",
  "version": "1.0.0"
}
```

### 📦 MinIO Console
**URL:** http://localhost:9001

**Credentials:**
- Username: `minioadmin`
- Password: `minioadmin`

View uploaded documents and file storage.

---

## Step 7: Test the New Features

### Test the Redesigned Auth Forms

1. Go to http://localhost:3001
2. **Observe the new login form:**
   - Brand blue color scheme (blue-600, blue-500)
   - Professional card container with shadow
   - Clean, modern typography
   - Smooth animations

3. Try to log in (if you have seeded data) or create an account
4. **Notice the new features:**
   - Real-time validation with checkmark/X icons
   - Password strength indicator on sign-up
   - Password visibility toggle
   - Professional error states

### Test New UI Components

1. **Loader Component:** You'll see branded loaders throughout the app
2. **Empty States:** Navigate to empty pages to see professional empty state components
3. **Toast Notifications:** Trigger actions to see the new Sonner toast theme with brand colors

### Test Semantic Colors

Navigate through the application and notice:
- **Success states** - emerald-600 (green)
- **Danger/Overdue** - rose-600 (red)
- **Warning/Expiring** - amber-600 (yellow)
- **Primary actions** - blue-600 (brand blue)

---

## Common Development Commands

### Build All Packages
```bash
bun run build
```

### Run Type Checking
```bash
bun run check-types
```

### Run Linting & Formatting
```bash
bun run check
```

### Run Tests
```bash
# Unit tests
bun test

# Watch mode
bun test:watch

# E2E tests (requires apps running)
bun test:e2e
```

### Database Commands
```bash
# Open Prisma Studio (database GUI)
bun run db:studio

# Create a migration
bun run db:migrate

# Reset database (WARNING: deletes all data)
bun run db:push --accept-data-loss
```

### Docker Commands
```bash
# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f postgres
docker compose logs -f redis

# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v

# Rebuild containers
docker compose build --no-cache
```

---

## Troubleshooting

### "Prisma Client not found" Error

**Solution:**
```bash
bun run db:generate
```

### Database Connection Refused

**Check if PostgreSQL is running:**
```bash
docker compose ps postgres
```

**If not running, start it:**
```bash
docker compose up -d postgres
```

### Port Already in Use

**Find process using port 3000:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Or change port in .env:**
```bash
# Change NEXT_PUBLIC_API_URL and BETTER_AUTH_URL ports
```

### Build Errors After Pulling Latest Changes

**Clean and rebuild:**
```bash
# Clean all build artifacts
rm -rf node_modules apps/*/node_modules apps/*/.next packages/*/node_modules packages/*/dist

# Reinstall
bun install

# Regenerate Prisma
bun run db:generate

# Rebuild
bun run build
```

### Type Errors in IDE

**Restart TypeScript server:**
- VSCode: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

**Or regenerate types:**
```bash
bun run db:generate
bun run check-types
```

---

## What's New (Phase 2-4 Updates)

### 🎨 Visual Changes
- ✅ Complete brand color migration (indigo → blue)
- ✅ Professional auth forms with animations
- ✅ Semantic color system (success, danger, warning)
- ✅ New Loader, EmptyState, and Toast components

### 🔒 Security
- ✅ Next.js updated to 16.0.3 (CVE-2025-29927 resolved)
- ✅ jsPDF secure version
- ✅ Better-Auth middleware hardened
- ✅ Multi-tenant isolation improved

### ⚡ Performance
- ✅ CI/CD 30-50% faster
- ✅ Bun caching (50-80% faster installs)
- ✅ Turbo build caching optimized
- ✅ Playwright 90% faster setup

### 🏗️ Infrastructure
- ✅ Portal fully Docker integrated
- ✅ Test infrastructure portable
- ✅ TypeScript strict mode enhanced
- ✅ Biome VCS integration

---

## Next Steps

1. **Explore the Dashboard** - See real-time compliance metrics
2. **Test CRUD Operations** - Create clients, documents, filings
3. **Test the Portal** - Sign up as a client and explore self-service
4. **Review the Code** - Examine the new components in `apps/portal/src/components/ui/`
5. **Run Tests** - Execute `bun test` to see 125+ passing tests
6. **Check CI/CD** - Review `.github/workflows/` for optimized pipelines

---

## Additional Resources

- **Full README:** [README.md](./README.md)
- **Current Status:** [docs/development/CURRENT_STATUS.md](./docs/development/CURRENT_STATUS.md)
- **Tech Stack:** [docs/TECH_STACK.md](./docs/TECH_STACK.md)
- **Project Structure:** [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)
- **Deployment Guide:** [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

## Getting Help

If you encounter issues:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Review [docs/development/CURRENT_STATUS.md](./docs/development/CURRENT_STATUS.md)
3. Check Docker logs: `docker compose logs -f`
4. Verify environment variables in `.env`
5. Ensure all prerequisites are installed

---

**🎉 You're all set! Enjoy exploring the GCMC-KAJ platform with all the latest improvements!**
