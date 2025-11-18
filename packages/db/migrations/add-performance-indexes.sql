-- Performance Optimization Indexes
-- Generated during Phase 9 Performance Optimization
-- These indexes address the most common query patterns in the application

-- Client table optimizations (most queried table)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_tenant_status
ON "Client"("tenantId", "status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_tenant_type
ON "Client"("tenantId", "type");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_search
ON "Client" USING gin(to_tsvector('english', name || ' ' || email || ' ' || COALESCE("taxId", '')));

-- Filing table optimizations (critical for compliance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filing_tenant_status
ON "Filing"("tenantId", "status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filing_client_due
ON "Filing"("clientId", "periodEnd");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filing_tenant_due
ON "Filing"("tenantId", "periodEnd");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filing_status_due
ON "Filing"("status", "periodEnd");

-- FilingType optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filing_type_name
ON "FilingType"("name");

-- ComplianceScore optimizations (for dashboard queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_score_tenant_level
ON "ComplianceScore"("tenantId", "level");

-- User and tenant optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email
ON "User"("email");

-- Performance-specific indexes for common dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filing_tenant_status_type
ON "Filing"("tenantId", "status", "filingTypeId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filing_filed_at
ON "Filing"("filedAt") WHERE "filedAt" IS NOT NULL;

-- Composite index for complex compliance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filing_compliance_complex
ON "Filing"("tenantId", "status", "periodEnd", "filingTypeId");

-- Create partial indexes for overdue filings (frequently queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filing_overdue
ON "Filing"("tenantId", "periodEnd", "clientId")
WHERE "status" IN ('draft', 'prepared') AND "periodEnd" < NOW();

-- Create index for upcoming deadlines (next 30 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_filing_upcoming
ON "Filing"("tenantId", "periodEnd", "status")
WHERE "periodEnd" BETWEEN NOW() AND NOW() + INTERVAL '30 days';

-- Statistics collection update
ANALYZE "Client";
ANALYZE "Filing";
ANALYZE "FilingType";
ANALYZE "ComplianceScore";
ANALYZE "User";