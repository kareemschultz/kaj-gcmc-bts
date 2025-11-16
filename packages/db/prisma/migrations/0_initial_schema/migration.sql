-- CreateTable "user"
CREATE TABLE "user" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("_id")
);

-- CreateTable "session"
CREATE TABLE "session" (
    "_id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("_id")
);

-- CreateTable "account"
CREATE TABLE "account" (
    "_id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("_id")
);

-- CreateTable "verification"
CREATE TABLE "verification" (
    "_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("_id")
);

-- CreateTable "tenants"
CREATE TABLE "tenants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contactInfo" JSONB,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable "tenant_users"
CREATE TABLE "tenant_users" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable "roles"
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable "permissions"
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable "clients"
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "tin" TEXT,
    "nisNumber" TEXT,
    "sector" TEXT,
    "riskLevel" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable "client_portal_access"
CREATE TABLE "client_portal_access" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_portal_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable "client_businesses"
CREATE TABLE "client_businesses" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "registrationType" TEXT,
    "incorporationDate" TIMESTAMP(3),
    "country" TEXT,
    "sector" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable "document_types"
CREATE TABLE "document_types" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "authority" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable "documents"
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "clientBusinessId" INTEGER,
    "documentTypeId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "authority" TEXT,
    "tags" TEXT[],
    "latestVersionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable "document_versions"
CREATE TABLE "document_versions" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "issuingAuthority" TEXT,
    "ocrText" TEXT,
    "aiSummary" TEXT,
    "metadata" JSONB,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLatest" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable "filing_types"
CREATE TABLE "filing_types" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "defaultDueDay" INTEGER,
    "defaultDueMonth" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filing_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable "filings"
CREATE TABLE "filings" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "clientBusinessId" INTEGER,
    "filingTypeId" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "periodLabel" TEXT,
    "status" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "taxAmount" DOUBLE PRECISION,
    "penalties" DOUBLE PRECISION,
    "interest" DOUBLE PRECISION,
    "total" DOUBLE PRECISION,
    "submissionDate" TIMESTAMP(3),
    "approvalDate" TIMESTAMP(3),
    "internalNotes" TEXT,
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filings_pkey" PRIMARY KEY ("id")
);

-- CreateTable "filing_documents"
CREATE TABLE "filing_documents" (
    "id" SERIAL NOT NULL,
    "filingId" INTEGER NOT NULL,
    "documentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "filing_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable "services"
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DOUBLE PRECISION,
    "estimatedDays" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable "service_request_templates"
CREATE TABLE "service_request_templates" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stepsDefinition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_request_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable "service_requests"
CREATE TABLE "service_requests" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "clientBusinessId" INTEGER,
    "serviceId" INTEGER NOT NULL,
    "templateId" INTEGER,
    "status" TEXT NOT NULL,
    "priority" TEXT,
    "currentStepOrder" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable "service_steps"
CREATE TABLE "service_steps" (
    "id" SERIAL NOT NULL,
    "serviceRequestId" INTEGER NOT NULL,
    "filingId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "requiredDocTypeIds" INTEGER[],
    "dependsOnStepId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable "recurring_filings"
CREATE TABLE "recurring_filings" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "clientBusinessId" INTEGER,
    "filingTypeId" INTEGER NOT NULL,
    "schedule" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_filings_pkey" PRIMARY KEY ("id")
);

-- CreateTable "tasks"
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "serviceRequestId" INTEGER,
    "filingId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "priority" TEXT,
    "dueDate" TIMESTAMP(3),
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable "client_tasks"
CREATE TABLE "client_tasks" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "serviceRequestId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable "conversations"
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "serviceRequestId" INTEGER,
    "subject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable "messages"
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable "compliance_rule_sets"
CREATE TABLE "compliance_rule_sets" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "appliesTo" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_rule_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable "compliance_rules"
CREATE TABLE "compliance_rules" (
    "id" SERIAL NOT NULL,
    "ruleSetId" INTEGER NOT NULL,
    "ruleType" TEXT NOT NULL,
    "condition" JSONB,
    "targetId" INTEGER,
    "weight" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable "compliance_scores"
CREATE TABLE "compliance_scores" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "scoreValue" DOUBLE PRECISION NOT NULL,
    "level" TEXT NOT NULL,
    "missingCount" INTEGER NOT NULL,
    "expiringCount" INTEGER NOT NULL,
    "overdueFilingsCount" INTEGER NOT NULL,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL,
    "breakdown" JSONB,

    CONSTRAINT "compliance_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable "notifications"
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channelStatus" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable "audit_logs"
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "actorUserId" TEXT,
    "clientId" INTEGER,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable "plans"
CREATE TABLE "plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DOUBLE PRECISION,
    "yearlyPrice" DOUBLE PRECISION,
    "limits" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable "subscriptions"
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable "requirement_bundles"
CREATE TABLE "requirement_bundles" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirement_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable "requirement_bundle_items"
CREATE TABLE "requirement_bundle_items" (
    "id" SERIAL NOT NULL,
    "bundleId" INTEGER NOT NULL,
    "documentTypeId" INTEGER,
    "filingTypeId" INTEGER,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirement_bundle_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_createdAt_idx" ON "user"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "session_expiresAt_idx" ON "session"("expiresAt");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "account_providerId_idx" ON "account"("providerId");

-- CreateIndex
CREATE INDEX "account_accountId_idx" ON "account"("accountId");

-- CreateIndex
CREATE INDEX "verification_identifier_value_idx" ON "verification"("identifier", "value");

-- CreateIndex
CREATE INDEX "verification_expiresAt_idx" ON "verification"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_users_tenantId_userId_key" ON "tenant_users"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "tenant_users_userId_idx" ON "tenant_users"("userId");

-- CreateIndex
CREATE INDEX "tenant_users_tenantId_idx" ON "tenant_users"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_users_roleId_idx" ON "tenant_users"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenantId_name_key" ON "roles"("tenantId", "name");

-- CreateIndex
CREATE INDEX "roles_tenantId_idx" ON "roles"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_roleId_module_action_key" ON "permissions"("roleId", "module", "action");

-- CreateIndex
CREATE INDEX "permissions_roleId_idx" ON "permissions"("roleId");

-- CreateIndex
CREATE INDEX "permissions_roleId_module_idx" ON "permissions"("roleId", "module");

-- CreateIndex
CREATE INDEX "clients_tenantId_idx" ON "clients"("tenantId");

-- CreateIndex
CREATE INDEX "clients_tenantId_type_idx" ON "clients"("tenantId", "type");

-- CreateIndex
CREATE INDEX "clients_tenantId_riskLevel_idx" ON "clients"("tenantId", "riskLevel");

-- CreateIndex
CREATE INDEX "clients_tenantId_sector_idx" ON "clients"("tenantId", "sector");

-- CreateIndex
CREATE INDEX "clients_createdAt_idx" ON "clients"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "client_portal_access_tenantId_userId_clientId_key" ON "client_portal_access"("tenantId", "userId", "clientId");

-- CreateIndex
CREATE INDEX "client_portal_access_tenantId_userId_idx" ON "client_portal_access"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "client_portal_access_tenantId_clientId_idx" ON "client_portal_access"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "client_businesses_tenantId_idx" ON "client_businesses"("tenantId");

-- CreateIndex
CREATE INDEX "client_businesses_clientId_idx" ON "client_businesses"("clientId");

-- CreateIndex
CREATE INDEX "client_businesses_tenantId_clientId_idx" ON "client_businesses"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "client_businesses_status_idx" ON "client_businesses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_tenantId_name_category_key" ON "document_types"("tenantId", "name", "category");

-- CreateIndex
CREATE INDEX "document_types_tenantId_idx" ON "document_types"("tenantId");

-- CreateIndex
CREATE INDEX "document_types_category_idx" ON "document_types"("category");

-- CreateIndex
CREATE INDEX "documents_tenantId_idx" ON "documents"("tenantId");

-- CreateIndex
CREATE INDEX "documents_clientId_idx" ON "documents"("clientId");

-- CreateIndex
CREATE INDEX "documents_clientBusinessId_idx" ON "documents"("clientBusinessId");

-- CreateIndex
CREATE INDEX "documents_documentTypeId_idx" ON "documents"("documentTypeId");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE INDEX "documents_tenantId_status_idx" ON "documents"("tenantId", "status");

-- CreateIndex
CREATE INDEX "documents_tenantId_clientId_idx" ON "documents"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "documents_clientId_status_idx" ON "documents"("clientId", "status");

-- CreateIndex
CREATE INDEX "documents_createdAt_idx" ON "documents"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "documents_latestVersionId_key" ON "documents"("latestVersionId");

-- CreateIndex
CREATE INDEX "document_versions_documentId_idx" ON "document_versions"("documentId");

-- CreateIndex
CREATE INDEX "document_versions_documentId_isLatest_idx" ON "document_versions"("documentId", "isLatest");

-- CreateIndex
CREATE INDEX "document_versions_documentId_uploadedAt_idx" ON "document_versions"("documentId", "uploadedAt");

-- CreateIndex
CREATE INDEX "document_versions_expiryDate_idx" ON "document_versions"("expiryDate");

-- CreateIndex
CREATE INDEX "document_versions_isLatest_idx" ON "document_versions"("isLatest");

-- CreateIndex
CREATE UNIQUE INDEX "filing_types_tenantId_code_key" ON "filing_types"("tenantId", "code");

-- CreateIndex
CREATE INDEX "filing_types_tenantId_idx" ON "filing_types"("tenantId");

-- CreateIndex
CREATE INDEX "filing_types_authority_idx" ON "filing_types"("authority");

-- CreateIndex
CREATE INDEX "filing_types_frequency_idx" ON "filing_types"("frequency");

-- CreateIndex
CREATE INDEX "filings_tenantId_idx" ON "filings"("tenantId");

-- CreateIndex
CREATE INDEX "filings_clientId_idx" ON "filings"("clientId");

-- CreateIndex
CREATE INDEX "filings_clientBusinessId_idx" ON "filings"("clientBusinessId");

-- CreateIndex
CREATE INDEX "filings_filingTypeId_idx" ON "filings"("filingTypeId");

-- CreateIndex
CREATE INDEX "filings_status_idx" ON "filings"("status");

-- CreateIndex
CREATE INDEX "filings_tenantId_status_idx" ON "filings"("tenantId", "status");

-- CreateIndex
CREATE INDEX "filings_tenantId_status_periodEnd_idx" ON "filings"("tenantId", "status", "periodEnd");

-- CreateIndex
CREATE INDEX "filings_periodEnd_idx" ON "filings"("periodEnd");

-- CreateIndex
CREATE INDEX "filings_submissionDate_idx" ON "filings"("submissionDate");

-- CreateIndex
CREATE INDEX "filings_createdAt_idx" ON "filings"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "filing_documents_filingId_documentId_key" ON "filing_documents"("filingId", "documentId");

-- CreateIndex
CREATE INDEX "filing_documents_filingId_idx" ON "filing_documents"("filingId");

-- CreateIndex
CREATE INDEX "filing_documents_documentId_idx" ON "filing_documents"("documentId");

-- CreateIndex
CREATE INDEX "services_tenantId_idx" ON "services"("tenantId");

-- CreateIndex
CREATE INDEX "services_tenantId_active_idx" ON "services"("tenantId", "active");

-- CreateIndex
CREATE INDEX "services_category_idx" ON "services"("category");

-- CreateIndex
CREATE INDEX "service_request_templates_tenantId_idx" ON "service_request_templates"("tenantId");

-- CreateIndex
CREATE INDEX "service_request_templates_serviceId_idx" ON "service_request_templates"("serviceId");

-- CreateIndex
CREATE INDEX "service_requests_tenantId_idx" ON "service_requests"("tenantId");

-- CreateIndex
CREATE INDEX "service_requests_clientId_idx" ON "service_requests"("clientId");

-- CreateIndex
CREATE INDEX "service_requests_clientBusinessId_idx" ON "service_requests"("clientBusinessId");

-- CreateIndex
CREATE INDEX "service_requests_serviceId_idx" ON "service_requests"("serviceId");

-- CreateIndex
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");

-- CreateIndex
CREATE INDEX "service_requests_priority_idx" ON "service_requests"("priority");

-- CreateIndex
CREATE INDEX "service_requests_tenantId_status_idx" ON "service_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "service_requests_tenantId_clientId_idx" ON "service_requests"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "service_requests_createdAt_idx" ON "service_requests"("createdAt");

-- CreateIndex
CREATE INDEX "service_requests_updatedAt_idx" ON "service_requests"("updatedAt");

-- CreateIndex
CREATE INDEX "service_steps_serviceRequestId_idx" ON "service_steps"("serviceRequestId");

-- CreateIndex
CREATE INDEX "service_steps_filingId_idx" ON "service_steps"("filingId");

-- CreateIndex
CREATE INDEX "service_steps_status_idx" ON "service_steps"("status");

-- CreateIndex
CREATE INDEX "service_steps_dueDate_idx" ON "service_steps"("dueDate");

-- CreateIndex
CREATE INDEX "service_steps_dependsOnStepId_idx" ON "service_steps"("dependsOnStepId");

-- CreateIndex
CREATE INDEX "service_steps_serviceRequestId_order_idx" ON "service_steps"("serviceRequestId", "order");

-- CreateIndex
CREATE INDEX "service_steps_serviceRequestId_status_order_idx" ON "service_steps"("serviceRequestId", "status", "order");

-- CreateIndex
CREATE INDEX "recurring_filings_tenantId_idx" ON "recurring_filings"("tenantId");

-- CreateIndex
CREATE INDEX "recurring_filings_clientId_idx" ON "recurring_filings"("clientId");

-- CreateIndex
CREATE INDEX "recurring_filings_clientBusinessId_idx" ON "recurring_filings"("clientBusinessId");

-- CreateIndex
CREATE INDEX "recurring_filings_filingTypeId_idx" ON "recurring_filings"("filingTypeId");

-- CreateIndex
CREATE INDEX "recurring_filings_active_idx" ON "recurring_filings"("active");

-- CreateIndex
CREATE INDEX "recurring_filings_nextRunAt_idx" ON "recurring_filings"("nextRunAt");

-- CreateIndex
CREATE INDEX "recurring_filings_tenantId_active_nextRunAt_idx" ON "recurring_filings"("tenantId", "active", "nextRunAt");

-- CreateIndex
CREATE INDEX "tasks_tenantId_idx" ON "tasks"("tenantId");

-- CreateIndex
CREATE INDEX "tasks_clientId_idx" ON "tasks"("clientId");

-- CreateIndex
CREATE INDEX "tasks_serviceRequestId_idx" ON "tasks"("serviceRequestId");

-- CreateIndex
CREATE INDEX "tasks_filingId_idx" ON "tasks"("filingId");

-- CreateIndex
CREATE INDEX "tasks_assignedToId_idx" ON "tasks"("assignedToId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");

-- CreateIndex
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");

-- CreateIndex
CREATE INDEX "tasks_tenantId_status_idx" ON "tasks"("tenantId", "status");

-- CreateIndex
CREATE INDEX "tasks_tenantId_assignedToId_idx" ON "tasks"("tenantId", "assignedToId");

-- CreateIndex
CREATE INDEX "tasks_tenantId_assignedToId_status_idx" ON "tasks"("tenantId", "assignedToId", "status");

-- CreateIndex
CREATE INDEX "tasks_assignedToId_status_dueDate_idx" ON "tasks"("assignedToId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "tasks_tenantId_status_dueDate_idx" ON "tasks"("tenantId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "tasks_updatedAt_idx" ON "tasks"("updatedAt");

-- CreateIndex
CREATE INDEX "client_tasks_tenantId_idx" ON "client_tasks"("tenantId");

-- CreateIndex
CREATE INDEX "client_tasks_clientId_idx" ON "client_tasks"("clientId");

-- CreateIndex
CREATE INDEX "client_tasks_serviceRequestId_idx" ON "client_tasks"("serviceRequestId");

-- CreateIndex
CREATE INDEX "client_tasks_status_idx" ON "client_tasks"("status");

-- CreateIndex
CREATE INDEX "client_tasks_dueDate_idx" ON "client_tasks"("dueDate");

-- CreateIndex
CREATE INDEX "client_tasks_tenantId_clientId_idx" ON "client_tasks"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "client_tasks_tenantId_status_idx" ON "client_tasks"("tenantId", "status");

-- CreateIndex
CREATE INDEX "conversations_tenantId_idx" ON "conversations"("tenantId");

-- CreateIndex
CREATE INDEX "conversations_clientId_idx" ON "conversations"("clientId");

-- CreateIndex
CREATE INDEX "conversations_serviceRequestId_idx" ON "conversations"("serviceRequestId");

-- CreateIndex
CREATE INDEX "conversations_createdAt_idx" ON "conversations"("createdAt");

-- CreateIndex
CREATE INDEX "messages_tenantId_idx" ON "messages"("tenantId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_authorId_idx" ON "messages"("authorId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_conversationId_readAt_idx" ON "messages"("conversationId", "readAt");

-- CreateIndex
CREATE INDEX "compliance_rule_sets_tenantId_idx" ON "compliance_rule_sets"("tenantId");

-- CreateIndex
CREATE INDEX "compliance_rule_sets_tenantId_active_idx" ON "compliance_rule_sets"("tenantId", "active");

-- CreateIndex
CREATE INDEX "compliance_rules_ruleSetId_idx" ON "compliance_rules"("ruleSetId");

-- CreateIndex
CREATE INDEX "compliance_rules_ruleType_idx" ON "compliance_rules"("ruleType");

-- CreateIndex
CREATE INDEX "compliance_rules_ruleSetId_ruleType_idx" ON "compliance_rules"("ruleSetId", "ruleType");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_scores_tenantId_clientId_key" ON "compliance_scores"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "compliance_scores_tenantId_idx" ON "compliance_scores"("tenantId");

-- CreateIndex
CREATE INDEX "compliance_scores_clientId_idx" ON "compliance_scores"("clientId");

-- CreateIndex
CREATE INDEX "compliance_scores_level_idx" ON "compliance_scores"("level");

-- CreateIndex
CREATE INDEX "compliance_scores_scoreValue_idx" ON "compliance_scores"("scoreValue");

-- CreateIndex
CREATE INDEX "compliance_scores_lastCalculatedAt_idx" ON "compliance_scores"("lastCalculatedAt");

-- CreateIndex
CREATE INDEX "compliance_scores_tenantId_level_idx" ON "compliance_scores"("tenantId", "level");

-- CreateIndex
CREATE INDEX "compliance_scores_tenantId_lastCalculatedAt_idx" ON "compliance_scores"("tenantId", "lastCalculatedAt");

-- CreateIndex
CREATE INDEX "notifications_tenantId_idx" ON "notifications"("tenantId");

-- CreateIndex
CREATE INDEX "notifications_recipientUserId_idx" ON "notifications"("recipientUserId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_channelStatus_idx" ON "notifications"("channelStatus");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_tenantId_recipientUserId_idx" ON "notifications"("tenantId", "recipientUserId");

-- CreateIndex
CREATE INDEX "notifications_recipientUserId_channelStatus_idx" ON "notifications"("recipientUserId", "channelStatus");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_logs_clientId_idx" ON "audit_logs"("clientId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_actorUserId_idx" ON "audit_logs"("tenantId", "actorUserId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_entityType_idx" ON "audit_logs"("tenantId", "entityType");

-- CreateIndex
CREATE INDEX "plans_name_idx" ON "plans"("name");

-- CreateIndex
CREATE INDEX "subscriptions_tenantId_idx" ON "subscriptions"("tenantId");

-- CreateIndex
CREATE INDEX "subscriptions_planId_idx" ON "subscriptions"("planId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_renewalDate_idx" ON "subscriptions"("renewalDate");

-- CreateIndex
CREATE INDEX "subscriptions_tenantId_status_idx" ON "subscriptions"("tenantId", "status");

-- CreateIndex
CREATE INDEX "subscriptions_tenantId_renewalDate_idx" ON "subscriptions"("tenantId", "renewalDate");

-- CreateIndex
CREATE INDEX "requirement_bundles_tenantId_idx" ON "requirement_bundles"("tenantId");

-- CreateIndex
CREATE INDEX "requirement_bundles_authority_idx" ON "requirement_bundles"("authority");

-- CreateIndex
CREATE INDEX "requirement_bundles_category_idx" ON "requirement_bundles"("category");

-- CreateIndex
CREATE INDEX "requirement_bundles_tenantId_authority_idx" ON "requirement_bundles"("tenantId", "authority");

-- CreateIndex
CREATE INDEX "requirement_bundle_items_bundleId_idx" ON "requirement_bundle_items"("bundleId");

-- CreateIndex
CREATE INDEX "requirement_bundle_items_documentTypeId_idx" ON "requirement_bundle_items"("documentTypeId");

-- CreateIndex
CREATE INDEX "requirement_bundle_items_filingTypeId_idx" ON "requirement_bundle_items"("filingTypeId");

-- CreateIndex
CREATE INDEX "requirement_bundle_items_bundleId_order_idx" ON "requirement_bundle_items"("bundleId", "order");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portal_access" ADD CONSTRAINT "client_portal_access_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portal_access" ADD CONSTRAINT "client_portal_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portal_access" ADD CONSTRAINT "client_portal_access_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_businesses" ADD CONSTRAINT "client_businesses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_businesses" ADD CONSTRAINT "client_businesses_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_types" ADD CONSTRAINT "document_types_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_clientBusinessId_fkey" FOREIGN KEY ("clientBusinessId") REFERENCES "client_businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_latestVersionId_fkey" FOREIGN KEY ("latestVersionId") REFERENCES "document_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filing_types" ADD CONSTRAINT "filing_types_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filings" ADD CONSTRAINT "filings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filings" ADD CONSTRAINT "filings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filings" ADD CONSTRAINT "filings_clientBusinessId_fkey" FOREIGN KEY ("clientBusinessId") REFERENCES "client_businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filings" ADD CONSTRAINT "filings_filingTypeId_fkey" FOREIGN KEY ("filingTypeId") REFERENCES "filing_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filing_documents" ADD CONSTRAINT "filing_documents_filingId_fkey" FOREIGN KEY ("filingId") REFERENCES "filings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filing_documents" ADD CONSTRAINT "filing_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_templates" ADD CONSTRAINT "service_request_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_templates" ADD CONSTRAINT "service_request_templates_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_clientBusinessId_fkey" FOREIGN KEY ("clientBusinessId") REFERENCES "client_businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "service_request_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_steps" ADD CONSTRAINT "service_steps_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_steps" ADD CONSTRAINT "service_steps_filingId_fkey" FOREIGN KEY ("filingId") REFERENCES "filings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_steps" ADD CONSTRAINT "service_steps_dependsOnStepId_fkey" FOREIGN KEY ("dependsOnStepId") REFERENCES "service_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_filings" ADD CONSTRAINT "recurring_filings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_filings" ADD CONSTRAINT "recurring_filings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_filings" ADD CONSTRAINT "recurring_filings_clientBusinessId_fkey" FOREIGN KEY ("clientBusinessId") REFERENCES "client_businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_filings" ADD CONSTRAINT "recurring_filings_filingTypeId_fkey" FOREIGN KEY ("filingTypeId") REFERENCES "filing_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_filingId_fkey" FOREIGN KEY ("filingId") REFERENCES "filings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_tasks" ADD CONSTRAINT "client_tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_tasks" ADD CONSTRAINT "client_tasks_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_tasks" ADD CONSTRAINT "client_tasks_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_rule_sets" ADD CONSTRAINT "compliance_rule_sets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_rules" ADD CONSTRAINT "compliance_rules_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "compliance_rule_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_scores" ADD CONSTRAINT "compliance_scores_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_scores" ADD CONSTRAINT "compliance_scores_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_bundles" ADD CONSTRAINT "requirement_bundles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_bundle_items" ADD CONSTRAINT "requirement_bundle_items_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "requirement_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_bundle_items" ADD CONSTRAINT "requirement_bundle_items_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_bundle_items" ADD CONSTRAINT "requirement_bundle_items_filingTypeId_fkey" FOREIGN KEY ("filingTypeId") REFERENCES "filing_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
