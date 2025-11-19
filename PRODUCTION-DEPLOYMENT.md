# GCMC-KAJ Business Tax Services - Production Deployment Guide

## Quick Start (One-Command Deployment)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd kaj-gcmc-bts
   ```

2. **Configure admin credentials in `.env.production`:**
   ```bash
   # Edit the admin credentials (CHANGE THESE FOR YOUR DEPLOYMENT)
   ADMIN_EMAIL="admin@yourdomain.com"
   ADMIN_PASSWORD="YourSecurePassword123!@#"
   ```

3. **Deploy with Docker:**
   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
   ```

4. **Access the application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3003
   - Admin login with the credentials you set above

## Environment Configuration

The `.env.production` file contains all necessary defaults. You only need to change:

### Required Changes:
- `ADMIN_EMAIL` - Default admin user email
- `ADMIN_PASSWORD` - Default admin user password

### Optional Changes:
- `BETTER_AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `POSTGRES_PASSWORD` - Database password
- `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` - Object storage credentials

### Production URLs (if deploying to a domain):
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SERVER_URL`

## Services Included

The Docker deployment includes:
- **Web Frontend** (Next.js) - Port 3001
- **API Server** (Hono) - Port 3003
- **PostgreSQL Database** - Port 5432
- **Redis Cache** - Port 6379
- **MinIO Object Storage** - Port 9000/9001

## Verification

After deployment, verify the system is working:

```bash
# Check all services are running
docker ps

# Test the health endpoints
curl http://localhost:3001  # Should redirect to login
curl http://localhost:3003/health  # Should return {"status":"ok"}

# Run the comprehensive test
node comprehensive-test.cjs
```

## Features Included

- ✅ **Authentication & Authorization** - Secure login with role-based access
- ✅ **Business Tax Compliance** - Guyana GRA compliance engine
- ✅ **Client Management** - Complete CRM functionality
- ✅ **Document Management** - Secure file upload/storage
- ✅ **Audit Logging** - Complete audit trail
- ✅ **Notifications** - Email/SMS notification system
- ✅ **Analytics Dashboard** - Business intelligence & reporting
- ✅ **API Integration** - RESTful APIs with tRPC
- ✅ **Professional UI** - Modern emerald green theme
- ✅ **Production Ready** - Docker containerization, caching, optimization

## Security Features

- Content Security Policy (CSP) configured
- HTTPS-ready (add SSL certificates in production)
- Secure session management
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Role-based access control

## Backup & Maintenance

- **Database backups**: PostgreSQL data persisted in Docker volumes
- **File storage**: MinIO object storage with data persistence
- **Logs**: Centralized logging for all services
- **Health monitoring**: Built-in health check endpoints

## Support

For issues or questions:
1. Check the comprehensive test output
2. Review container logs: `docker logs <container-name>`
3. Verify environment variables are correctly set

## Architecture

This is a full-stack TypeScript application with:
- **Frontend**: Next.js 14 with App Router, TailwindCSS, shadcn/ui
- **Backend**: Hono with Better Auth, tRPC, Prisma ORM
- **Database**: PostgreSQL with Redis caching
- **Storage**: MinIO S3-compatible object storage
- **Infrastructure**: Docker Compose with production optimizations

The platform is designed for Guyana's business tax compliance requirements and includes all necessary features for a professional tax services business.