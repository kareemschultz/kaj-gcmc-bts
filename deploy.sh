#!/bin/bash

# GCMC-KAJ Production Deployment Script
# Handles complete deployment with performance optimizations

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions for colored output
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
PROJECT_NAME="gcmc-kaj"
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"

# Check if running as root (not recommended for Docker)
if [[ $EUID -eq 0 ]]; then
    warning "Running as root. Consider using a non-root user with Docker group membership."
fi

# Function to check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker >/dev/null 2>&1; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check if Docker Compose is installed
    if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    # Check if .env.production exists
    if [[ ! -f "$ENV_FILE" ]]; then
        error "Environment file $ENV_FILE not found. Please create it from .env.example"
        exit 1
    fi

    # Check if bun is available for builds
    if ! command -v bun >/dev/null 2>&1; then
        warning "Bun not found. Using npm for builds (slower)."
    fi

    success "Prerequisites check completed."
}

# Function to create backup
create_backup() {
    info "Creating backup..."

    mkdir -p "$BACKUP_DIR"
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="${BACKUP_DIR}/backup_${timestamp}.sql"

    # Backup database if running
    if docker-compose -f "$COMPOSE_FILE" ps database | grep -q "Up"; then
        info "Creating database backup..."
        docker-compose -f "$COMPOSE_FILE" exec -T database \
            pg_dump -U "${DB_USER}" -d "${DB_NAME}" > "$backup_file"
        success "Database backup created: $backup_file"
    else
        warning "Database not running, skipping backup."
    fi
}

# Function to run database migrations
run_migrations() {
    info "Running database migrations and optimizations..."

    # Wait for database to be ready
    info "Waiting for database to be ready..."
    docker-compose -f "$COMPOSE_FILE" exec database \
        bash -c 'while ! pg_isready -U "${DB_USER}" -d "${DB_NAME}"; do sleep 1; done'

    # Run Prisma migrations
    info "Running Prisma migrations..."
    docker-compose -f "$COMPOSE_FILE" exec web \
        npx prisma migrate deploy

    # Apply performance indexes
    info "Applying performance indexes..."
    docker-compose -f "$COMPOSE_FILE" exec -T database \
        psql -U "${DB_USER}" -d "${DB_NAME}" -f /docker-entrypoint-initdb.d/add-performance-indexes.sql

    success "Database migrations completed."
}

# Function to build and deploy
build_and_deploy() {
    info "Starting build and deployment..."

    # Pull latest images
    info "Pulling latest base images..."
    docker-compose -f "$COMPOSE_FILE" pull

    # Build application images
    info "Building application images..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache

    # Start services
    info "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d

    # Wait for services to be healthy
    info "Waiting for services to be healthy..."
    sleep 30

    # Check service health
    check_health

    success "Deployment completed successfully!"
}

# Function to check service health
check_health() {
    info "Checking service health..."

    services=("database" "redis" "minio" "web" "worker")

    for service in "${services[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            success "$service is running"
        else
            error "$service is not running"
            return 1
        fi
    done

    # Check web application health
    info "Checking web application health..."
    max_attempts=10
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
            success "Web application is healthy"
            break
        else
            warning "Health check attempt $attempt/$max_attempts failed, retrying..."
            sleep 10
            ((attempt++))
        fi
    done

    if [ $attempt -gt $max_attempts ]; then
        error "Web application health check failed after $max_attempts attempts"
        return 1
    fi
}

# Function to optimize system performance
optimize_performance() {
    info "Applying performance optimizations..."

    # Clear Redis cache
    info "Clearing Redis cache for fresh start..."
    docker-compose -f "$COMPOSE_FILE" exec redis redis-cli FLUSHALL

    # Optimize database
    info "Running database maintenance..."
    docker-compose -f "$COMPOSE_FILE" exec -T database \
        psql -U "${DB_USER}" -d "${DB_NAME}" -c "VACUUM ANALYZE;"

    # Restart services for optimization
    info "Restarting services..."
    docker-compose -f "$COMPOSE_FILE" restart web worker

    success "Performance optimizations applied."
}

# Function to show deployment summary
show_summary() {
    info "Deployment Summary:"
    echo "===================="
    echo "Project: $PROJECT_NAME"
    echo "Environment: Production"
    echo "Compose file: $COMPOSE_FILE"
    echo ""
    echo "Services:"
    docker-compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Command}}\t{{.State}}\t{{.Ports}}"
    echo ""
    echo "URLs:"
    echo "  - Web Application: http://localhost:3000"
    echo "  - MinIO Console: http://localhost:9001"
    echo "  - Health Check: http://localhost:3000/api/health"
    echo ""
    info "Logs can be viewed with: docker-compose -f $COMPOSE_FILE logs -f [service]"
    info "To stop all services: docker-compose -f $COMPOSE_FILE down"
}

# Function to rollback deployment
rollback() {
    warning "Rolling back deployment..."

    # Stop current services
    docker-compose -f "$COMPOSE_FILE" down

    # Restore database from latest backup
    latest_backup=$(ls -t "$BACKUP_DIR"/backup_*.sql 2>/dev/null | head -n1)

    if [[ -n "$latest_backup" ]]; then
        info "Restoring database from $latest_backup"
        docker-compose -f "$COMPOSE_FILE" up -d database
        sleep 10
        docker-compose -f "$COMPOSE_FILE" exec -T database \
            psql -U "${DB_USER}" -d "${DB_NAME}" < "$latest_backup"
    else
        warning "No backup found for rollback"
    fi

    warning "Rollback completed. Please investigate the issue before redeploying."
}

# Main deployment function
main() {
    info "Starting GCMC-KAJ production deployment..."

    # Load environment variables
    if [[ -f "$ENV_FILE" ]]; then
        set -a
        source "$ENV_FILE"
        set +a
    fi

    # Handle command line arguments
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            create_backup
            build_and_deploy
            run_migrations
            optimize_performance
            show_summary
            ;;
        "rollback")
            rollback
            ;;
        "health")
            check_health
            ;;
        "optimize")
            optimize_performance
            ;;
        "logs")
            docker-compose -f "$COMPOSE_FILE" logs -f "${2:-}"
            ;;
        "stop")
            docker-compose -f "$COMPOSE_FILE" down
            success "All services stopped"
            ;;
        "restart")
            docker-compose -f "$COMPOSE_FILE" restart "${2:-}"
            success "Service(s) restarted"
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|health|optimize|logs [service]|stop|restart [service]}"
            echo ""
            echo "Commands:"
            echo "  deploy    - Full deployment with health checks"
            echo "  rollback  - Rollback to previous database backup"
            echo "  health    - Check service health"
            echo "  optimize  - Apply performance optimizations"
            echo "  logs      - View logs (optionally for specific service)"
            echo "  stop      - Stop all services"
            echo "  restart   - Restart services"
            exit 1
            ;;
    esac
}

# Trap errors and attempt rollback
trap 'error "Deployment failed! Use ./deploy.sh rollback if needed."; exit 1' ERR

# Run main function with all arguments
main "$@"