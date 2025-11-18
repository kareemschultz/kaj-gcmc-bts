# Database Layer Remediation Guide
## Guyana Compliance Management Cloud (KAJ-GCMC)

Date: November 18, 2025

---

## PRIORITY 1: CRITICAL FIXES (This Sprint)

### Fix #1: Test Database Setup - Field Mismatch [1 HOUR]

**File:** `packages/api/src/__tests__/helpers/test-db.ts`

**Current Code (Lines 223-234):**
```typescript
const doc1 = await prisma.document.create({
  data: {
    name: "Test Document 1",        // ❌ WRONG
    fileName: "test-doc-1.pdf",     // ❌ WRONG
    fileSize: 1024,                 // ❌ WRONG
    mimeType: "application/pdf",    // ❌ WRONG
    storagePath: "test/doc1.pdf",   // ❌ WRONG
    documentTypeId: docType.id,
    clientId: client1.id,
    tenantId: tenant.id,
    uploadedBy: testFixtures.users.firmAdmin.id  // ❌ WRONG
  }
});
```

**Fixed Code:**
```typescript
// Step 1: Create Document with correct fields
const doc1 = await prisma.document.create({
  data: {
    title: "Test Document 1",           // ✓ CORRECT
    documentTypeId: docType.id,         // ✓ CORRECT
    clientId: client1.id,               // ✓ CORRECT
    tenantId: tenant.id,                // ✓ CORRECT
    status: "valid"                     // ✓ CORRECT (required field)
  }
});

// Step 2: Create DocumentVersion with file metadata
await prisma.documentVersion.create({
  data: {
    documentId: doc1.id,
    fileUrl: "test/doc1.pdf",           // Use instead of storagePath
    storageProvider: "minio",           // Instead of separate field
    fileSize: 1024,
    mimeType: "application/pdf",
    uploadedById: testFixtures.users.firmAdmin.id,  // Link to user
    isLatest: true
  }
});

testFixtures.documents = [{ id: doc1.id, name: doc1.title }];
```

**Also fix createTestDocument() function (Lines 312-345):**
```typescript
export async function createTestDocument(data: {
  title: string;      // Changed from 'name'
  clientId: number;
  uploadedBy: string;
}) {
  let docType = await prisma.documentType.findFirst({
    where: { tenantId: testFixtures.tenant.id }
  });

  if (!docType) {
    docType = await prisma.documentType.create({
      data: {
        name: "Test Document Type",
        category: "general",            // Added required field
        tenantId: testFixtures.tenant.id
      }
    });
  }

  // Create Document
  const document = await prisma.document.create({
    data: {
      title: data.title,
      documentTypeId: docType.id,
      clientId: data.clientId,
      tenantId: testFixtures.tenant.id,
      status: "valid"
    }
  });

  // Create DocumentVersion with file metadata
  const version = await prisma.documentVersion.create({
    data: {
      documentId: document.id,
      fileUrl: `test/${data.title}.pdf`,
      storageProvider: "minio",
      fileSize: 1024,
      mimeType: "application/pdf",
      uploadedById: data.uploadedBy,
      isLatest: true
    }
  });

  return { document, version };
}
```

---

### Fix #2: DocumentType Delete Policy [0.5 HOURS]

**File:** `packages/db/prisma/schema/schema.prisma`

**Current Line 319:**
```prisma
documentType    DocumentType      @relation(fields: [documentTypeId], references: [id], onDelete: Restrict)
```

**Change To:**
```prisma
documentType    DocumentType      @relation(fields: [documentTypeId], references: [id], onDelete: SetNull)
```

**Why:** 
- Allows document types to be deleted even if documents reference them
- Documents keep history, but lose type classification
- Better for compliance records than cascading delete

**Migration Command:**
```bash
npx prisma migrate dev --name "fix_document_type_delete_policy"
```

---

### Fix #3: Add Deadline Escalation Model [8 HOURS]

**File:** `packages/db/prisma/schema/schema.prisma`

Add after the `RequirementBundleItem` model (around line 929):

```prisma
// ============================================================================
// DEADLINE & ESCALATION MANAGEMENT
// ============================================================================

model ComplianceDeadline {
  id              Int       @id @default(autoincrement())
  tenantId        Int
  clientId        Int
  clientBusinessId Int?
  filingTypeId    Int
  
  // Deadline tracking
  dueDate         DateTime  // When the filing is due
  gracePeriodDays Int?      // Days after due date before penalty
  reminderDays    Int[]     // Days before due to send reminders (e.g., [14, 7, 1])
  
  // Status tracking
  status          String    @default("pending")  // pending, reminded, overdue, completed
  completedAt     DateTime?
  
  // Escalation tracking
  escalationLevel Int       @default(0)  // 0=not_escalated, 1=warning, 2=critical
  remindersSent   Int       @default(0)  // Count of reminders sent
  lastReminderAt  DateTime?
  escalatedAt     DateTime?
  
  // Metadata
  metadata        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  client          Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientBusiness  ClientBusiness? @relation(fields: [clientBusinessId], references: [id], onDelete: SetNull)
  filingType      FilingType     @relation(fields: [filingTypeId], references: [id], onDelete: Restrict)
  reminders       DeadlineReminder[]

  @@index([tenantId])
  @@index([clientId])
  @@index([clientBusinessId])
  @@index([filingTypeId])
  @@index([dueDate])
  @@index([status])
  @@index([escalationLevel])
  @@index([tenantId, status, dueDate])
  @@index([tenantId, escalationLevel])
  @@unique([tenantId, clientId, clientBusinessId, filingTypeId, dueDate])
  @@map("compliance_deadlines")
}

model DeadlineReminder {
  id          Int       @id @default(autoincrement())
  tenantId    Int
  deadlineId  Int
  recipientId String
  
  // Reminder details
  type        String    // email, sms, in_app
  channel     String?   // Which channel (e.g., email address, phone number)
  
  // Status
  status      String    @default("pending")  // pending, sent, failed
  sentAt      DateTime?
  failureReason String?
  
  createdAt   DateTime  @default(now())

  tenant      Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  deadline    ComplianceDeadline   @relation(fields: [deadlineId], references: [id], onDelete: Cascade)
  recipient   User                 @relation(fields: [recipientId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([deadlineId])
  @@index([recipientId])
  @@index([status])
  @@index([sentAt])
  @@index([tenantId, status])
  @@map("deadline_reminders")
}
```

**Related Changes to Filing Model:**

Add to `Filing` model (around line 394):
```prisma
model Filing {
  // ... existing fields ...
  
  // Link to deadline if created from scheduled deadline
  complianceDeadlineId Int?
  complianceDeadline   ComplianceDeadline? @relation(fields: [complianceDeadlineId], references: [id], onDelete: SetNull)
  
  // ... rest of model ...
  
  @@index([complianceDeadlineId])
}
```

**Also update Tenant relation:**
In Tenant model, add:
```prisma
model Tenant {
  // ... existing fields ...
  complianceDeadlines ComplianceDeadline[]
  deadlineReminders   DeadlineReminder[]
  // ... rest ...
}
```

**Migration:**
```bash
npx prisma migrate dev --name "add_deadline_escalation_model"
```

**Create Deadline Service (new file):**

`packages/api/src/services/DeadlineService.ts`:
```typescript
import prisma from "@GCMC-KAJ/db";
import { Prisma } from "@GCMC-KAJ/db";

export class DeadlineService {
  /**
   * Calculate and create deadline for a filing type
   */
  static async createDeadlineForClient(
    tenantId: number,
    clientId: number,
    filingTypeId: number,
    dueDate: Date,
    options?: {
      clientBusinessId?: number;
      gracePeriodDays?: number;
      reminderDays?: number[];
    }
  ) {
    const deadline = await prisma.complianceDeadline.create({
      data: {
        tenantId,
        clientId,
        clientBusinessId: options?.clientBusinessId,
        filingTypeId,
        dueDate,
        gracePeriodDays: options?.gracePeriodDays || 5,
        reminderDays: options?.reminderDays || [14, 7, 1],
        status: "pending"
      }
    });

    return deadline;
  }

  /**
   * Get overdue deadlines
   */
  static async getOverdueDeadlines(tenantId: number) {
    return prisma.complianceDeadline.findMany({
      where: {
        tenantId,
        dueDate: { lt: new Date() },
        status: { in: ["pending", "reminded"] }
      },
      include: { client: true, filingType: true }
    });
  }

  /**
   * Get upcoming reminders (within X days)
   */
  static async getUpcomingReminders(tenantId: number, daysAhead = 30) {
    const today = new Date();
    const future = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    
    return prisma.complianceDeadline.findMany({
      where: {
        tenantId,
        dueDate: { gte: today, lte: future },
        status: "pending"
      },
      include: { client: true, filingType: true }
    });
  }

  /**
   * Mark deadline as completed
   */
  static async completeDeadline(deadlineId: number) {
    return prisma.complianceDeadline.update({
      where: { id: deadlineId },
      data: {
        status: "completed",
        completedAt: new Date()
      }
    });
  }
}
```

---

## PRIORITY 2: HIGH PRIORITY FIXES (Next Sprint)

### Enhancement #1: Add Composite Indexes [2 HOURS]

**File:** `packages/db/prisma/schema/schema.prisma`

**ComplianceScore Model (Line 753):**
```prisma
model ComplianceScore {
  // ... existing fields ...
  
  @@unique([tenantId, clientId])
  @@index([tenantId])
  @@index([clientId])
  @@index([level])
  @@index([scoreValue])
  @@index([lastCalculatedAt])
  @@index([tenantId, level])           // ✓ ADD THIS
  @@index([tenantId, lastCalculatedAt])
  @@map("compliance_scores")
}
```

**Message Model (Line 692):**
```prisma
model Message {
  // ... existing fields ...
  
  @@index([tenantId])
  @@index([conversationId])
  @@index([authorId])
  @@index([createdAt])
  @@index([conversationId, createdAt])
  @@index([conversationId, readAt])
  @@index([tenantId, conversationId])  // ✓ ADD THIS
  @@map("messages")
}
```

**Document Model (Line 301):**
```prisma
model Document {
  // ... existing fields ...
  
  @@index([tenantId])
  @@index([clientId])
  @@index([clientBusinessId])
  @@index([documentTypeId])
  @@index([status])
  @@index([tenantId, status])
  @@index([tenantId, clientId])
  @@index([clientId, status])
  @@index([createdAt])
  @@index([tenantId, documentTypeId, status])
  @@index([tenantId, authority])       // ✓ ADD THIS
  @@map("documents")
}
```

**Migration:**
```bash
npx prisma migrate dev --name "add_missing_composite_indexes"
```

---

### Enhancement #2: Add Guyana-Specific Fields [6 HOURS]

**File:** `packages/db/prisma/schema/schema.prisma`

**Update Client Model (around line 192):**
```prisma
model Client {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  name      String
  type      String // individual/company/partnership
  email     String?
  phone     String?
  address   String?
  
  // ===== EXISTING FIELDS =====
  tin       String?
  nisNumber String?
  sector    String?
  riskLevel String?
  notes     String?
  
  // ===== NEW GUYANA-SPECIFIC FIELDS =====
  // Guyana Business Registration Number
  brnNumber String?
  
  // For individuals: passport number
  passportNumber String?
  
  // Compliance Status
  complianceStatus String?  // registered, pending, suspended, delinquent, flagged
  
  // Registration Dates
  taxRegisteredAt   DateTime?  // When registered with GRA
  nisRegisteredAt   DateTime?  // When registered with NIS
  
  // Contact person
  contactPersonName String?
  contactPersonRole String?
  
  // Regulatory Tracking
  regulatoryFlags   String[]  // Array of flags: sanctions, audited, flagged, etc.
  lastAuditDate     DateTime?
  nextAuditDue      DateTime?
  
  // Additional metadata
  metadata          Json?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant           Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  businesses       ClientBusiness[]
  documents        Document[]
  filings          Filing[]
  serviceRequests  ServiceRequest[]
  complianceScores ComplianceScore[]
  tasks            Task[]
  clientTasks      ClientTask[]
  conversations    Conversation[]
  auditLogs        AuditLog[]
  recurringFilings RecurringFiling[]
  portalAccesses   ClientPortalAccess[]
  deadlines        ComplianceDeadline[]

  @@index([tenantId])
  @@index([tenantId, type])
  @@index([tenantId, riskLevel])
  @@index([tenantId, sector])
  @@index([createdAt])
  @@index([tenantId, createdAt])
  @@index([tenantId, complianceStatus])  // ✓ NEW
  @@index([tin])
  @@index([nisNumber])
  @@index([brnNumber])  // ✓ NEW
  @@map("clients")
}
```

**Create Agency Model (NEW):**
```prisma
model Agency {
  id              Int      @id @default(autoincrement())
  
  // Guyana agencies
  code            String   @unique  // GRA, NIS, DCRA, IMMIGRATION, DEEDS, GO_INVEST
  name            String             // Full name
  shortName       String?            // Abbreviated name
  
  // Contact info
  website         String?
  email           String?
  phone           String?
  address         String?
  contactPerson   String?
  contactEmail    String?
  contactPhone    String?
  
  // Filing info
  filingTypes     FilingType[]
  
  // System metadata
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([code])
  @@index([active])
  @@map("agencies")
}
```

**Update FilingType Model:**
```prisma
model FilingType {
  id              Int      @id @default(autoincrement())
  tenantId        Int
  agencyId        Int?             // ✓ NEW
  
  name            String
  code            String
  authority       String           // Keep for backward compat
  frequency       String           // monthly/quarterly/annual/one_off
  defaultDueDay   Int?
  defaultDueMonth Int?
  
  description     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant                 Tenant                  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  agency                 Agency?                 @relation(fields: [agencyId], references: [id], onDelete: SetNull)
  filings                Filing[]
  recurringFilings       RecurringFiling[]
  requirementBundleItems RequirementBundleItem[]
  deadlines              ComplianceDeadline[]

  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([authority])
  @@index([frequency])
  @@index([agencyId])
  @@map("filing_types")
}
```

**Update Tenant Model to include:**
```prisma
model Tenant {
  // ... existing fields ...
  
  // Relations
  // ... existing ...
  deadlines ComplianceDeadline[]
  deadlineReminders DeadlineReminder[]
  
  // ... rest ...
}
```

**Migration:**
```bash
npx prisma migrate dev --name "add_guyana_specific_fields_and_agency_model"
```

---

## PRIORITY 3: MEDIUM PRIORITY (Polish & Performance)

### Enhancement #3: Dashboard Query Optimization [6 HOURS]

**Option A: Materialized View (Recommended)**

Create migration file:
```sql
-- migration: add_dashboard_stats_view

CREATE MATERIALIZED VIEW dashboard_stats_by_tenant AS
SELECT 
  t.id as tenant_id,
  COUNT(DISTINCT c.id) as total_clients,
  COUNT(DISTINCT d.id) as total_documents,
  COUNT(DISTINCT f.id) as total_filings,
  COUNT(DISTINCT sr.id) as total_service_requests,
  (SELECT COUNT(*) FROM documents d2
   LEFT JOIN document_versions dv ON d2.id = dv.document_id AND d2."latestVersionId" = dv.id
   WHERE d2."tenantId" = t.id 
   AND dv."expiryDate" BETWEEN NOW() AND NOW() + INTERVAL '30 days'
  ) as expiring_documents_30d,
  (SELECT COUNT(*) FROM filings f2
   WHERE f2."tenantId" = t.id
   AND f2.status IN ('draft', 'prepared')
   AND f2."periodEnd" < NOW()
  ) as overdue_filings,
  (SELECT COUNT(*) FROM service_requests sr2
   WHERE sr2."tenantId" = t.id
   AND sr2.status IN ('new', 'in_progress', 'awaiting_client')
  ) as active_service_requests
FROM tenants t
LEFT JOIN clients c ON t.id = c."tenantId"
LEFT JOIN documents d ON t.id = d."tenantId"
LEFT JOIN filings f ON t.id = f."tenantId"
LEFT JOIN service_requests sr ON t.id = sr."tenantId"
GROUP BY t.id;

CREATE INDEX idx_dashboard_stats_tenant_id ON dashboard_stats_by_tenant(tenant_id);
```

Then in router:
```typescript
// dashboard.ts
export const dashboardRouter = router({
  overview: rbacProcedure("analytics", "view").query(async ({ ctx }) => {
    const stats = await prisma.$queryRaw`
      SELECT * FROM dashboard_stats_by_tenant WHERE tenant_id = ${ctx.tenantId}
    `;
    
    return {
      counts: {
        clients: stats[0].total_clients,
        documents: stats[0].total_documents,
        filings: stats[0].total_filings,
        serviceRequests: stats[0].total_service_requests,
      },
      alerts: {
        expiringDocuments: stats[0].expiring_documents_30d,
        overdueFilings: stats[0].overdue_filings,
        activeServiceRequests: stats[0].active_service_requests,
      }
    };
  })
});
```

---

## DEPLOYMENT CHECKLIST

- [ ] Fix test database (Fix #1)
- [ ] Fix DocumentType delete policy (Fix #2) 
- [ ] Add deadline model (Fix #3)
- [ ] Run all database tests
- [ ] Test API endpoints with new models
- [ ] Update API documentation
- [ ] Create database seeding for default agencies
- [ ] Load test dashboard queries
- [ ] Run compliance workflows end-to-end

---

## TESTING VERIFICATION

After migrations, run:
```bash
# Test database
npm run db:migrate:status

# Run migrations
npm run db:migrate:deploy

# Reset test database
npm run db:reset

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e
```

---

## ROLLBACK STRATEGY

If issues occur:
```bash
# List recent migrations
npx prisma migrate status

# Rollback last migration
npx prisma migrate resolve --rolled-back "migration_name"

# Repair migration lock (if needed)
npx prisma migrate resolve --rolled-back
```

---

Generated: November 18, 2025
