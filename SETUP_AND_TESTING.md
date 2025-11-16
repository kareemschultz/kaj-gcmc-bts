# GCMC Platform - Setup & Testing Guide

**Date:** 2025-11-16
**Status:** Role Assignment Fix Implemented - Ready for Testing

---

## 🎯 What Was Fixed

### Issue: Users Could Register But Had No Access
- Users could create accounts but were not assigned to any tenant
- No role was assigned, preventing access to dashboard
- TenantUser linking record was never created

### Solution: Better-Auth Lifecycle Hooks
- Implemented automatic tenant and role assignment on user sign-up
- Users are automatically assigned to "Default Organization" with "MEMBER" role
- Works for all authentication methods (email/password, OAuth, etc.)

---

## 📋 Setup Steps

### 1. Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, MinIO
docker compose up -d postgres redis minio

# Verify services are running
docker ps
```

### 2. Set Up Environment Variables

Create `.env` file in project root:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gcmc_kaj"

# Redis
REDIS_URL="redis://localhost:6379"

# Better-Auth
BETTER_AUTH_SECRET="your-secret-key-minimum-32-characters-long-here"
BETTER_AUTH_URL="http://localhost:3000"

# CORS
CORS_ORIGIN="http://localhost:3001"

# Next.js Public URLs
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# MinIO (S3-compatible storage)
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_USE_SSL="false"
MINIO_REGION="us-east-1"

# Environment
NODE_ENV="development"
```

### 3. Initialize Database

```bash
# Generate Prisma Client
cd packages/db
bun run db:generate

# Push schema to database
bun run db:push

# Go back to root
cd ../..
```

### 4. Seed Default Tenant and Roles

```bash
# Create default organization and roles (ADMIN, MANAGER, MEMBER, VIEWER)
bun scripts/seed-default-tenant.ts
```

Expected output:
```
🌱 Seeding default tenant and roles...

✅ Default tenant: Default Organization (default-organization)
   ✓ Role: ADMIN
   ✓ Role: MANAGER
   ✓ Role: MEMBER
   ✓ Role: VIEWER

🎉 Default tenant and roles seeded successfully!
```

### 5. Migrate Existing Users (if any)

```bash
# Assign existing users to default tenant
bun scripts/migrate-existing-users.ts
```

### 6. Start Application Services

```bash
# Terminal 1: Start API Server
bun run dev:server

# Terminal 2: Start Web Frontend
bun run dev:web
```

---

## 🧪 Testing the Fix

### Test 1: New User Registration

1. **Navigate to sign-up page:**
   ```
   http://localhost:3001/signup
   ```

2. **Register a new user:**
   - Name: Test User
   - Email: testuser@example.com
   - Password: SecurePassword123!

3. **Expected behavior:**
   - User is created successfully
   - Automatically redirected to `/dashboard`
   - Dashboard loads without errors
   - User can see dashboard content

4. **Verify in database:**
   ```sql
   -- Check user was created
   SELECT id, email, name FROM "user" WHERE email = 'testuser@example.com';

   -- Check tenant assignment
   SELECT
     u.email,
     t.name as tenant_name,
     r.name as role_name
   FROM "user" u
   JOIN tenant_users tu ON u.id = tu."userId"
   JOIN tenants t ON tu."tenantId" = t.id
   JOIN roles r ON tu."roleId" = r.id
   WHERE u.email = 'testuser@example.com';
   ```

   Should show:
   ```
   email                   | tenant_name           | role_name
   ------------------------|-----------------------|----------
   testuser@example.com    | Default Organization  | MEMBER
   ```

### Test 2: Check Server Logs

When user signs up, you should see in API server logs:
```
📝 Creating default tenant...
✅ Default tenant: Default Organization (default-organization)
📝 Creating MEMBER role...
✅ Assigned user <user-id> to tenant "default-organization" with MEMBER role
```

### Test 3: Dashboard Access

After logging in:
1. **Verify dashboard loads:**
   - No errors in browser console
   - Stats cards display
   - Navigation works

2. **Test permissions:**
   - MEMBER role should be able to:
     - ✅ View dashboard
     - ✅ View own profile
     - ✅ Edit own profile
     - ✅ View clients (read-only)
     - ❌ Cannot create/edit/delete clients
     - ❌ Cannot access admin settings

### Test 4: Multiple Users

Register 3 users with different scenarios:

**User 1:** Standard registration
- Should be assigned to Default Organization as MEMBER

**User 2:** Register immediately after User 1
- Should reuse existing Default Organization
- Should reuse existing MEMBER role
- No duplicate tenants or roles created

**User 3:** Close browser, clear cookies, then register
- Fresh session, should still work correctly

### Test 5: Existing Users Migration

If you have existing users in database:

1. **Check users without tenant:**
   ```sql
   SELECT u.email
   FROM "user" u
   LEFT JOIN tenant_users tu ON u.id = tu."userId"
   WHERE tu.id IS NULL;
   ```

2. **Run migration:**
   ```bash
   bun scripts/migrate-existing-users.ts
   ```

3. **Verify all assigned:**
   ```sql
   -- Should return 0 rows
   SELECT u.email
   FROM "user" u
   LEFT JOIN tenant_users tu ON u.id = tu."userId"
   WHERE tu.id IS NULL;
   ```

---

## 🔍 Troubleshooting

### Issue: User created but still no dashboard access

**Check:**
1. Server logs - did the hook run?
2. Database - is TenantUser record present?
3. Browser console - any errors?

**Solution:**
```bash
# Manually assign user to tenant
bun scripts/migrate-existing-users.ts
```

### Issue: "Default tenant not found" error

**Cause:** Seed script not run

**Solution:**
```bash
bun scripts/seed-default-tenant.ts
```

### Issue: Hook not triggering

**Check Better-Auth configuration:**
```typescript
// packages/auth/src/index.ts
hooks: {
  after: [
    {
      matcher: () => true,
      handler: async (context) => {
        // Should see this in logs
        console.log('Hook triggered:', context.request?.url);
      }
    }
  ]
}
```

### Issue: Permission denied errors

**Check role permissions:**
```sql
SELECT r.name, p.module, p.action, p.allowed
FROM roles r
JOIN permissions p ON r.id = p."roleId"
WHERE r.name = 'MEMBER';
```

---

## 📊 E2E Testing with Playwright

### Run E2E Tests

```bash
# Install Playwright browsers (first time only)
bunx playwright install --with-deps

# Run all E2E tests
bun run test:e2e

# Run specific auth tests
bunx playwright test tests/e2e/auth --headed

# Run with UI
bunx playwright test --ui
```

### Create New Test for Role Assignment

```typescript
// tests/e2e/auth/registration-with-role.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@GCMC-KAJ/db/generated';

test.describe('User Registration with Role Assignment', () => {
  const prisma = new PrismaClient();
  const testEmail = `test-${Date.now()}@example.com`;

  test('should automatically assign new user to default tenant with MEMBER role', async ({ page }) => {
    // 1. Navigate to sign-up page
    await page.goto('http://localhost:3001/signup');

    // 2. Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'SecurePassword123!');

    // 3. Submit form
    await page.click('button[type="submit"]');

    // 4. Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // 5. Verify user in database
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        tenantUsers: {
          include: {
            tenant: true,
            role: true
          }
        }
      }
    });

    // 6. Assertions
    expect(user).toBeTruthy();
    expect(user?.tenantUsers).toHaveLength(1);
    expect(user?.tenantUsers[0].tenant.code).toBe('default-organization');
    expect(user?.tenantUsers[0].role.name).toBe('MEMBER');

    // Cleanup
    await prisma.user.delete({ where: { email: testEmail } });
  });

  test('should allow MEMBER to view dashboard but not admin pages', async ({ page }) => {
    // Test MEMBER permissions
    await page.goto('http://localhost:3001/dashboard');
    await expect(page).toHaveTitle(/Dashboard/);

    // Try to access admin page (should be restricted)
    await page.goto('http://localhost:3001/admin/settings');
    await expect(page).toHaveURL(/.*unauthorized|.*403/);
  });
});
```

---

## 🎨 Frontend Design Audit

### Current State

**Implemented:**
- ✅ Professional design system with OKLCH colors
- ✅ Blue-Gray brand color (#486581)
- ✅ Trust Green accent (#16a34a)
- ✅ Inter font family
- ✅ Dark mode support
- ✅ Responsive components

**Needs Review:**
- Sign-up/Login forms styling consistency
- Dashboard layout improvements
- Mobile responsiveness verification
- Accessibility compliance check

### Design Improvements To Test

1. **Sign-Up Form:**
   - Verify brand colors are applied
   - Check form validation UI
   - Test error message styling

2. **Dashboard:**
   - Stats cards should use colored icons
   - Hover effects on interactive elements
   - Loading states

3. **Navigation:**
   - Header with brand colors
   - Active link indicators
   - Mobile menu functionality

---

## 📝 Changes Made

### Files Modified

1. **`packages/auth/src/index.ts`**
   - Added `ensureUserHasTenantAndRole()` function
   - Implemented Better-Auth lifecycle hooks
   - Auto-creates default tenant and MEMBER role if needed
   - Assigns new users automatically

2. **`scripts/seed-default-tenant.ts`** (NEW)
   - Creates "Default Organization" tenant
   - Creates 4 standard roles: ADMIN, MANAGER, MEMBER, VIEWER
   - Sets up permissions for each role

3. **`scripts/migrate-existing-users.ts`** (NEW)
   - Migrates existing users without tenant assignment
   - Assigns them to default tenant with MEMBER role
   - Idempotent (safe to run multiple times)

4. **`analysis/ROLE_ASSIGNMENT_ISSUE.md`** (NEW)
   - Comprehensive analysis of the problem
   - Database schema documentation
   - Solution approaches comparison
   - Implementation details

---

## ✅ Success Criteria

- [ ] Default tenant exists in database
- [ ] All 4 roles exist (ADMIN, MANAGER, MEMBER, VIEWER)
- [ ] MEMBER role has basic permissions
- [ ] New user sign-up creates TenantUser record
- [ ] User can access dashboard immediately after sign-up
- [ ] User has correct permissions (can view, cannot edit admin features)
- [ ] No errors in server logs
- [ ] No errors in browser console
- [ ] All existing users have been migrated
- [ ] E2E tests pass

---

## 🚀 Next Steps After Testing

1. **If tests pass:**
   - Commit changes
   - Update documentation
   - Deploy to staging
   - Create multi-tenant sign-up flow (advanced feature)

2. **If tests fail:**
   - Review server logs for hook execution
   - Check database for TenantUser records
   - Verify Better-Auth configuration
   - Run migration script manually

3. **Future enhancements:**
   - Invite-based sign-up (assign to specific tenant)
   - Organization creation during sign-up
   - Domain-based auto-assignment
   - Admin panel for role management

---

## 📖 Related Documentation

- `analysis/ROLE_ASSIGNMENT_ISSUE.md` - Detailed problem analysis
- `docs/DATABASE_SCHEMA.md` - Database structure
- `docs/API_DOCUMENTATION.md` - API endpoints
- `packages/db/prisma/schema/schema.prisma` - Prisma schema

---

**Status:** ✅ Implementation Complete - Ready for Testing
**Last Updated:** 2025-11-16
**Tested:** ⏳ Pending (requires Docker environment)
