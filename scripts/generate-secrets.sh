#!/bin/bash
# ==============================================================================
# GCMC-KAJ Platform - Secure Secret Generator
# ==============================================================================
# This script generates cryptographically secure random secrets for the
# GCMC-KAJ platform. Use these values in your .env or .env.production files.
#
# Usage:
#   ./scripts/generate-secrets.sh              # Generate all secrets
#   ./scripts/generate-secrets.sh --env-file   # Output in .env format
#   ./scripts/generate-secrets.sh --help       # Show help
#
# SECURITY NOTES:
# - Store these secrets securely (password manager, secrets vault)
# - Never commit secrets to version control
# - Use different secrets for each environment (dev, staging, production)
# - Rotate secrets regularly (every 90 days recommended)
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to generate a secure password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 48 | tr -d '/+=' | cut -c1-"$length"
}

# Function to generate a base64 secret
generate_base64_secret() {
    openssl rand -base64 32
}

# Function to generate a hex secret
generate_hex_secret() {
    local length=${1:-32}
    openssl rand -hex "$length"
}

# Function to generate a UUID
generate_uuid() {
    if command -v uuidgen &> /dev/null; then
        uuidgen | tr '[:upper:]' '[:lower:]'
    else
        openssl rand -hex 16 | sed 's/\(.\{8\}\)\(.\{4\}\)\(.\{4\}\)\(.\{4\}\)\(.\{12\}\)/\1-\2-\3-\4-\5/'
    fi
}

# Show help
show_help() {
    cat << EOF
GCMC-KAJ Secret Generator

Usage: ./scripts/generate-secrets.sh [OPTIONS]

Options:
    --env-file      Output in .env file format
    --json          Output in JSON format
    --help          Show this help message

Examples:
    # Generate and display all secrets
    ./scripts/generate-secrets.sh

    # Generate secrets in .env format (for copy/paste)
    ./scripts/generate-secrets.sh --env-file

    # Generate secrets and save to .env.production
    ./scripts/generate-secrets.sh --env-file > .env.production

Security Best Practices:
    1. Store secrets in a password manager or secrets vault
    2. Never commit secrets to version control
    3. Use different secrets for each environment
    4. Rotate secrets every 90 days
    5. Use environment variables, not hardcoded values

EOF
}

# Main function
main() {
    local output_format="default"

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env-file)
                output_format="env"
                shift
                ;;
            --json)
                output_format="json"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Check if openssl is available
    if ! command -v openssl &> /dev/null; then
        print_error "openssl is required but not installed."
        print_error "Install it with: apt-get install openssl (Debian/Ubuntu) or brew install openssl (macOS)"
        exit 1
    fi

    # Generate all secrets
    local postgres_password=$(generate_password 32)
    local better_auth_secret=$(generate_base64_secret)
    local minio_root_user="gcmc_kaj_admin_$(openssl rand -hex 4)"
    local minio_root_password=$(generate_password 32)
    local minio_access_key="gcmc_kaj_minio_$(openssl rand -hex 4)"
    local minio_secret_key=$(generate_password 32)
    local jwt_secret=$(generate_hex_secret 32)
    local encryption_key=$(generate_hex_secret 32)
    local session_secret=$(generate_base64_secret)

    # Output based on format
    if [ "$output_format" = "env" ]; then
        cat << EOF
# ==============================================================================
# GCMC-KAJ Platform - Generated Secrets
# ==============================================================================
# Generated on: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# SECURITY: Keep these secrets secure and never commit to version control
# ==============================================================================

# ------------------------------------------------------------------------------
# PostgreSQL Database
# ------------------------------------------------------------------------------
POSTGRES_DB="gcmc_kaj"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="$postgres_password"

# Database connection URL
DATABASE_URL="postgresql://postgres:$postgres_password@localhost:5432/gcmc_kaj"

# ------------------------------------------------------------------------------
# Better-Auth Configuration
# ------------------------------------------------------------------------------
BETTER_AUTH_SECRET="$better_auth_secret"
BETTER_AUTH_URL="https://your-domain.com"  # Change to your actual domain

# ------------------------------------------------------------------------------
# MinIO Object Storage
# ------------------------------------------------------------------------------
# Root credentials (administrative access)
MINIO_ROOT_USER="$minio_root_user"
MINIO_ROOT_PASSWORD="$minio_root_password"

# Application credentials (for API/Worker access)
MINIO_ACCESS_KEY="$minio_access_key"
MINIO_SECRET_KEY="$minio_secret_key"

MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_REGION="us-east-1"
MINIO_BUCKET_PREFIX="tenant"

# ------------------------------------------------------------------------------
# Additional Security Tokens (Optional)
# ------------------------------------------------------------------------------
# JWT signing secret (if using custom JWT implementation)
JWT_SECRET="$jwt_secret"

# Encryption key for sensitive data
ENCRYPTION_KEY="$encryption_key"

# Session secret (if using custom sessions)
SESSION_SECRET="$session_secret"

# ------------------------------------------------------------------------------
# Application Configuration
# ------------------------------------------------------------------------------
NODE_ENV="production"
CORS_ORIGIN="https://app.your-domain.com"  # Change to your actual domain
PORTAL_URL="https://portal.your-domain.com"  # Change to your actual domain
SUPPORT_EMAIL="support@your-domain.com"  # Change to your support email

# ------------------------------------------------------------------------------
# Email Configuration
# ------------------------------------------------------------------------------
EMAIL_PROVIDER="resend"  # or "smtp" or "log"
RESEND_API_KEY=""  # Add your Resend API key
# SMTP_HOST="smtp.example.com"
# SMTP_PORT="587"
# SMTP_USER="your-email@example.com"
# SMTP_PASS="your-smtp-password"
# SMTP_FROM="noreply@your-domain.com"

# ------------------------------------------------------------------------------
# Redis Configuration
# ------------------------------------------------------------------------------
REDIS_URL="redis://localhost:6379"

# ------------------------------------------------------------------------------
# Docker & Scaling (Production)
# ------------------------------------------------------------------------------
API_REPLICAS="2"
WEB_REPLICAS="2"
WORKER_REPLICAS="1"
DOCKER_REGISTRY="your-registry.azurecr.io"
VERSION="latest"

# ==============================================================================
# SECURITY CHECKLIST:
# ==============================================================================
# [ ] Changed BETTER_AUTH_URL to your actual domain
# [ ] Changed CORS_ORIGIN to your actual domain
# [ ] Changed PORTAL_URL to your actual portal domain
# [ ] Changed SUPPORT_EMAIL to your support email
# [ ] Configured email provider and API keys
# [ ] Stored these secrets in a secure location
# [ ] Added .env.production to .gitignore
# [ ] Tested all services with new credentials
# ==============================================================================
EOF

    elif [ "$output_format" = "json" ]; then
        cat << EOF
{
  "generated_at": "$(date -u +"%Y-%m-%d %H:%M:%S UTC")",
  "secrets": {
    "database": {
      "postgres_password": "$postgres_password",
      "database_url": "postgresql://postgres:$postgres_password@localhost:5432/gcmc_kaj"
    },
    "authentication": {
      "better_auth_secret": "$better_auth_secret",
      "jwt_secret": "$jwt_secret",
      "session_secret": "$session_secret"
    },
    "storage": {
      "minio_root_user": "$minio_root_user",
      "minio_root_password": "$minio_root_password",
      "minio_access_key": "$minio_access_key",
      "minio_secret_key": "$minio_secret_key"
    },
    "encryption": {
      "encryption_key": "$encryption_key"
    }
  }
}
EOF

    else
        # Default human-readable output
        print_header "GCMC-KAJ Secure Secrets Generated"
        echo ""

        print_success "PostgreSQL Database"
        echo "  Database Name:      gcmc_kaj"
        echo "  User:              postgres"
        echo "  Password:          $postgres_password"
        echo ""

        print_success "Better-Auth Configuration"
        echo "  Auth Secret:       $better_auth_secret"
        echo ""

        print_success "MinIO Object Storage"
        echo "  Root User:         $minio_root_user"
        echo "  Root Password:     $minio_root_password"
        echo "  Access Key:        $minio_access_key"
        echo "  Secret Key:        $minio_secret_key"
        echo ""

        print_success "Additional Security Tokens"
        echo "  JWT Secret:        $jwt_secret"
        echo "  Encryption Key:    $encryption_key"
        echo "  Session Secret:    $session_secret"
        echo ""

        print_header "Next Steps"
        echo ""
        echo "1. Copy these secrets to your .env.production file"
        echo "   Or run: ./scripts/generate-secrets.sh --env-file > .env.production"
        echo ""
        echo "2. Update the following values in .env.production:"
        echo "   - BETTER_AUTH_URL (your actual domain)"
        echo "   - CORS_ORIGIN (your actual domain)"
        echo "   - PORTAL_URL (your portal domain)"
        echo "   - SUPPORT_EMAIL (your support email)"
        echo "   - Email provider configuration"
        echo ""
        echo "3. Store these secrets securely:"
        echo "   - Use a password manager (1Password, LastPass, etc.)"
        echo "   - Or use a secrets vault (HashiCorp Vault, AWS Secrets Manager, etc.)"
        echo ""
        echo "4. Test your deployment:"
        echo "   docker-compose --env-file .env.production -f docker-compose.prod.yml up -d"
        echo ""

        print_warning "SECURITY REMINDERS"
        echo "  • Never commit .env.production to version control"
        echo "  • Use different secrets for dev/staging/production"
        echo "  • Rotate secrets every 90 days"
        echo "  • Restrict access to production secrets"
        echo "  • Enable audit logging for secret access"
        echo ""
    fi
}

# Run main function
main "$@"
