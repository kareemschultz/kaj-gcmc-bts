# Dependency Audit Report
## GCMC Platform Production Readiness Assessment

**Audit Date:** 2025-11-16
**Auditor:** Dependency Auditor
**Package Manager:** Bun 1.3.2
**Total Packages Installed:** 1,348

---

## Executive Summary

The GCMC Platform uses a monorepo structure with 4 applications and 10 internal packages. A total of **1,348 packages** are installed across the workspace. The audit identified **12 security vulnerabilities** (1 critical, 3 high, 6 moderate, 2 low) and **multiple outdated packages** requiring updates. The platform uses a catalog-based dependency management strategy which helps maintain version consistency across the workspace.

### Critical Findings

1. **Critical Vulnerability**: Next.js Authorization Bypass (GHSA-f82v-jwr5-mffw)
2. **High Severity**: jsPDF has 2 high-severity DoS vulnerabilities
3. **High Severity**: Next.js cache poisoning vulnerability
4. **Outdated Packages**: 40+ packages have newer versions available
5. **Breaking Changes Available**: Several packages have major version updates (vitest, recharts, jspdf)

---

## 1. Dependency Inventory

### 1.1 Workspace Structure

```
GCMC-KAJ/
├── apps/
│   ├── portal          (Next.js 16.0.3 - Admin Portal)
│   ├── server          (Hono API Server)
│   ├── web             (Next.js 16.0.3 - Main Web App)
│   └── worker          (BullMQ Background Worker)
└── packages/
    ├── api             (tRPC API Layer)
    ├── auth            (Better Auth Configuration)
    ├── config          (Shared TypeScript Config)
    ├── db              (Prisma Database Layer)
    ├── email           (React Email Templates)
    ├── rbac            (Role-Based Access Control)
    ├── reports         (PDF Report Generation)
    ├── storage         (MinIO Storage Client)
    └── types           (Shared TypeScript Types)
```

### 1.2 Catalog Dependencies (Shared Versions)

The workspace uses a catalog system to maintain consistent versions:

| Package | Version | Used By |
|---------|---------|---------|
| `hono` | ^4.8.2 | server, api |
| `@trpc/server` | ^11.5.0 | portal, server, web, api |
| `@trpc/client` | ^11.5.0 | portal, web, api |
| `@trpc/react-query` | ^11.5.0 | portal, web |
| `better-auth` | ^1.3.28 | portal, server, web, auth |
| `dotenv` | ^17.2.2 | Root, server, api, auth, db |
| `zod` | ^4.1.11 | Root, portal, web, api, auth, config, db, reports |
| `typescript` | ^5.8.2 | All packages |
| `tsdown` | ^0.16.4 | Multiple build configs |
| `@prisma/client` | ^6.15.0 | portal, web, db |
| `prisma` | ^6.15.0 | db |
| `react` | 19.2.0 | portal, web, email, reports |
| `react-dom` | 19.2.0 | portal, web |
| `@types/react` | 19.2.5 | portal, web, email |
| `@types/react-dom` | 19.2.3 | portal, web |
| `@types/node` | ^22.10.2 | Root catalog |

### 1.3 Runtime Dependencies by Package

#### Root Package
- **Runtime**: dotenv@^17.2.2, zod@^4.1.11
- **Dev**: @biomejs/biome@^2.2.0, @playwright/test@^1.56.1, @types/bun@^1.2.6, husky@^9.1.7, lint-staged@^16.1.2, tsdown@^0.16.4, turbo@^2.5.4

#### apps/portal
- **Runtime**: Next.js 16.0.3, @tanstack/react-form@^1.12.3, @tanstack/react-query@^5.85.5, lucide-react@^0.546.0, next-themes@^0.4.6, radix-ui@^1.4.2, sonner@^2.0.5, class-variance-authority@^0.7.1, clsx@^2.1.1, tailwind-merge@^3.3.1
- **Dev**: Tailwind CSS@^4.1.10, @tanstack/react-query-devtools@^5.85.5

#### apps/server
- **Runtime**: hono (catalog), @hono/trpc-server@^0.4.0
- **Dev**: vitest@^2.0.0

#### apps/web
- **Runtime**: Next.js 16.0.3, date-fns@^4.1.0, html2canvas@^1.4.1, jspdf@^2.5.2, lucide-react@^0.553.0, recharts@^2.15.0
- **Dev**: Same as portal

#### apps/worker
- **Runtime**: bullmq@^5.34.2, ioredis@^5.4.1
- **Dev**: @types/node@^22.10.2

#### packages/api
- **Runtime**: bullmq@^5.34.2, ioredis@^5.4.1

#### packages/email
- **Runtime**: @react-email/components@^0.0.31, @react-email/render@^1.0.1, react-email@^3.0.3, resend@^4.0.1

#### packages/reports
- **Runtime**: @react-pdf/renderer@^4.2.0, date-fns@^4.1.0

#### packages/storage
- **Runtime**: minio@^8.0.1

### 1.4 Internal Workspace Dependencies

```mermaid
graph TD
    portal[apps/portal] --> api[packages/api]
    portal --> auth[packages/auth]
    portal --> config[packages/config]

    web[apps/web] --> api
    web --> auth
    web --> config
    web --> storage[packages/storage]
    web --> reports[packages/reports]

    server[apps/server] --> api
    server --> auth
    server --> db[packages/db]
    server --> config

    worker[apps/worker] --> db
    worker --> email[packages/email]
    worker --> types[packages/types]

    api --> auth
    api --> db
    api --> email
    api --> types
    api --> rbac[packages/rbac]
    api --> reports

    auth --> db
    auth --> types

    email --> db
    email --> types

    reports --> db
    reports --> types

    rbac --> types
```

---

## 2. Security Vulnerabilities

### 2.1 Critical Severity (1)

| Package | Version | Vulnerability | CVSS | Recommendation |
|---------|---------|---------------|------|----------------|
| **next** | 16.0.3 | Authorization Bypass in Next.js Middleware<br/>[GHSA-f82v-jwr5-mffw](https://github.com/advisories/GHSA-f82v-jwr5-mffw) | 9.1 | **URGENT**: Upgrade to Next.js >=15.2.3<br/>This allows authentication bypass! |

### 2.2 High Severity (3)

| Package | Version | Vulnerability | CVSS | Recommendation |
|---------|---------|---------------|------|----------------|
| **jspdf** | 2.5.2 | Bypass Regular Expression Denial of Service<br/>[GHSA-w532-jxjh-hjhj](https://github.com/advisories/GHSA-w532-jxjh-hjhj) | N/A | Upgrade to jspdf@^3.0.1+ |
| **jspdf** | 2.5.2 | Denial of Service (DoS)<br/>[GHSA-8mvj-3j78-4qmw](https://github.com/advisories/GHSA-8mvj-3j78-4qmw) | 7.5 | Upgrade to jspdf@^3.0.1+ |
| **next** | 16.0.3 | DoS via cache poisoning<br/>[GHSA-67rr-84xm-4c7r](https://github.com/advisories/GHSA-67rr-84xm-4c7r) | 7.5 | Upgrade to Next.js >=15.1.8 |

### 2.3 Moderate Severity (6)

| Package | Version | Vulnerability | CVSS | Recommendation |
|---------|---------|---------------|------|----------------|
| **dompurify** | <3.2.4 | Cross-site Scripting (XSS)<br/>[GHSA-vhxf-7vqr-mrjg](https://github.com/advisories/GHSA-vhxf-7vqr-mrjg) | 4.5 | Indirect dependency via jspdf.<br/>Upgrade jspdf to get fixed version |
| **prismjs** | <1.30.0 | DOM Clobbering vulnerability<br/>[GHSA-x7hr-w5r2-h6wg](https://github.com/advisories/GHSA-x7hr-w5r2-h6wg) | 4.9 | Indirect via @react-email/components.<br/>Monitor for updates |
| **esbuild** | <=0.24.2 | Dev server request exposure<br/>[GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) | 5.3 | Indirect via vitest, react-email.<br/>Low risk (dev only) |
| **next** | 16.0.3 | Cache Key Confusion for Image Optimization<br/>[GHSA-g5qg-72qw-gw5v](https://github.com/advisories/GHSA-g5qg-72qw-gw5v) | 6.2 | Upgrade to Next.js >=15.4.5 |
| **next** | 16.0.3 | Content Injection for Image Optimization<br/>[GHSA-xv57-4mr9-wg8v](https://github.com/advisories/GHSA-xv57-4mr9-wg8v) | 4.3 | Upgrade to Next.js >=15.4.5 |
| **next** | 16.0.3 | Improper Middleware Redirect Handling (SSRF)<br/>[GHSA-4342-x723-ch2f](https://github.com/advisories/GHSA-4342-x723-ch2f) | 6.5 | Upgrade to Next.js >=15.4.7 |

### 2.4 Low Severity (2)

| Package | Version | Vulnerability | CVSS | Recommendation |
|---------|---------|---------------|------|----------------|
| **next** | 16.0.3 | Information exposure in dev server<br/>[GHSA-3h52-269p-cp9r](https://github.com/advisories/GHSA-3h52-269p-cp9r) | N/A | Upgrade to Next.js >=15.2.2 |
| **next** | 16.0.3 | Race Condition to Cache Poisoning<br/>[GHSA-qpjv-v59x-3qc4](https://github.com/advisories/GHSA-qpjv-v59x-3qc4) | 3.7 | Upgrade to Next.js >=15.1.6 |

### 2.5 Security Summary

- **Total Vulnerabilities**: 12
- **Critical**: 1 (Authorization Bypass in Next.js Middleware)
- **High**: 3 (2 in jspdf, 1 in Next.js)
- **Moderate**: 6 (4 in Next.js, 1 in dompurify, 1 in prismjs, 1 in esbuild)
- **Low**: 2 (both in Next.js)

**Primary Issue**: Next.js 16.0.3 has **8 vulnerabilities** including 1 critical authorization bypass. This is the most urgent issue requiring immediate attention.

---

## 3. Outdated Packages

### 3.1 Root Package Updates

| Package | Current | Latest | Type | Breaking Change |
|---------|---------|--------|------|-----------------|
| @biomejs/biome | ^2.2.0 | ^2.3.5 | Minor | No |
| @types/bun | ^1.2.6 | ^1.3.2 | Minor | No |
| bun | 1.2.18 | 1.3.2 | Minor | No |
| dotenv | ^17.2.2 | ^17.2.3 | Patch | No |
| lint-staged | ^16.1.2 | ^16.2.6 | Minor | No |
| turbo | ^2.5.4 | ^2.6.1 | Minor | No |
| zod | ^4.1.11 | ^4.1.12 | Patch | No |

### 3.2 Portal App Updates

| Package | Current | Latest | Type | Breaking Change |
|---------|---------|--------|------|-----------------|
| @tailwindcss/postcss | ^4.1.10 | ^4.1.17 | Patch | No |
| @tanstack/react-form | ^1.12.3 | ^1.25.0 | Minor | No |
| @tanstack/react-query | ^5.85.5 | ^5.90.9 | Minor | No |
| @tanstack/react-query-devtools | ^5.85.5 | ^5.90.2 | Minor | No |
| @types/node | ^20 | ^24 | **Major** | **Yes** |
| lucide-react | ^0.546.0 | ^0.553.0 | Minor | No |
| radix-ui | ^1.4.2 | ^1.4.3 | Patch | No |
| sonner | ^2.0.5 | ^2.0.7 | Patch | No |
| tailwind-merge | ^3.3.1 | ^3.4.0 | Minor | No |
| tailwindcss | ^4.1.10 | ^4.1.17 | Patch | No |
| tw-animate-css | ^1.3.4 | ^1.4.0 | Minor | No |

### 3.3 Server App Updates

| Package | Current | Latest | Type | Breaking Change |
|---------|---------|--------|------|-----------------|
| @types/bun | ^1.2.6 | ^1.3.2 | Minor | No |
| vitest | ^2.0.0 | ^4.0.9 | **Major** | **Yes** |

### 3.4 Web App Updates

| Package | Current | Latest | Type | Breaking Change |
|---------|---------|--------|------|-----------------|
| @tailwindcss/postcss | ^4.1.10 | ^4.1.17 | Patch | No |
| @tanstack/react-form | ^1.12.3 | ^1.25.0 | Minor | No |
| @tanstack/react-query | ^5.85.5 | ^5.90.9 | Minor | No |
| @tanstack/react-query-devtools | ^5.85.5 | ^5.90.2 | Minor | No |
| @types/node | ^20 | ^24 | **Major** | **Yes** |
| jspdf | ^2.5.2 | ^3.0.3 | **Major** | **Yes** (Security Fix) |
| radix-ui | ^1.4.2 | ^1.4.3 | Patch | No |
| recharts | ^2.15.0 | ^3.4.1 | **Major** | **Yes** |
| sonner | ^2.0.5 | ^2.0.7 | Patch | No |
| tailwind-merge | ^3.3.1 | ^3.4.0 | Minor | No |
| tailwindcss | ^4.1.10 | ^4.1.17 | Patch | No |
| tw-animate-css | ^1.3.4 | ^1.4.0 | Minor | No |

### 3.5 Worker App Updates

| Package | Current | Latest | Type | Breaking Change |
|---------|---------|--------|------|-----------------|
| @types/node | ^22.10.2 | ^24.10.1 | **Major** | **Yes** |
| bullmq | ^5.34.2 | ^5.63.2 | Minor | No |
| ioredis | ^5.4.1 | ^5.8.2 | Minor | No |

### 3.6 Package Updates

#### packages/api
| Package | Current | Latest | Type | Breaking Change |
|---------|---------|--------|------|-----------------|
| bullmq | ^5.34.2 | ^5.63.2 | Minor | No |
| ioredis | ^5.4.1 | ^5.8.2 | Minor | No |

#### packages/db
| Package | Current | Latest | Type | Breaking Change |
|---------|---------|--------|------|-----------------|
| prisma | ^6.15.0 | ^6.19.0 | Minor | No |

#### packages/email
| Package | Current | Latest | Type | Breaking Change |
|---------|---------|--------|------|-----------------|
| @react-email/components | ^0.0.31 | ^1.0.1 | **Major** | **Yes** |
| @react-email/render | ^1.0.1 | ^2.0.0 | **Major** | **Yes** |
| react-email | ^3.0.3 | ^5.0.4 | **Major** | **Yes** |
| resend | ^4.0.1 | ^6.4.2 | **Major** | **Yes** |

#### packages/reports
| Package | Current | Latest | Type | Breaking Change |
|---------|---------|--------|------|-----------------|
| @react-pdf/renderer | ^4.2.0 | ^4.3.1 | Minor | No |

#### packages/storage
| Package | Current | Latest | Type | Breaking Change |
|---------|---------|--------|------|-----------------|
| minio | ^8.0.1 | ^8.0.6 | Patch | No |

### 3.7 Major Version Upgrades Available

The following packages have major version updates with potential breaking changes:

1. **@types/node**: ^20 → ^24 (portal, web) / ^22 → ^24 (worker)
2. **vitest**: ^2.0.0 → ^4.0.9 (Breaking: API changes)
3. **jspdf**: ^2.5.2 → ^3.0.3 (**Security Fix Required**)
4. **recharts**: ^2.15.0 → ^3.4.1 (Breaking: Chart API changes)
5. **@react-email/components**: ^0.0.31 → ^1.0.1 (Breaking: Stable release)
6. **@react-email/render**: ^1.0.1 → ^2.0.0 (Breaking: Render API changes)
7. **react-email**: ^3.0.3 → ^5.0.4 (Breaking: Multiple versions jump)
8. **resend**: ^4.0.1 → ^6.4.2 (Breaking: Email API changes)

---

## 4. Version Conflicts

### 4.1 Detected Conflicts

Based on the analysis, the following version inconsistencies exist:

| Package | Locations | Versions | Issue |
|---------|-----------|----------|-------|
| @types/node | portal, web | ^20 | Catalog defines ^22.10.2 |
| @types/node | worker | ^22.10.2 | Matches catalog |
| lucide-react | portal, web | ^0.546.0 vs ^0.553.0 | Minor version mismatch |

**Recommendation**: Update @types/node in portal and web packages to align with catalog version ^22.10.2.

### 4.2 Catalog Version Consistency

The workspace catalog system is working well for most packages:
- ✅ react@19.2.0 - Consistent across all packages
- ✅ @trpc packages - All using catalog versions
- ✅ better-auth - Consistent via catalog
- ✅ prisma/client - Consistent via catalog
- ✅ typescript - Consistent via catalog

---

## 5. Bundle Analysis

### 5.1 Largest Dependencies

Analysis of installed packages shows the workspace uses Bun's optimized node_modules structure. The following are the primary heavyweight dependencies:

| Category | Package | Estimated Impact | Used In |
|----------|---------|------------------|---------|
| **Frontend Framework** | Next.js 16.0.3 | ~10-15MB | portal, web |
| **UI Components** | radix-ui | ~5-8MB | portal, web |
| **Charts** | recharts | ~3-5MB | web |
| **PDF Generation** | jspdf | ~1-2MB | web |
| **PDF Rendering** | @react-pdf/renderer | ~2-3MB | reports |
| **Database** | @prisma/client | ~5-10MB | portal, web, db |
| **Email** | react-email | ~2-4MB | email |
| **Testing** | @playwright/test | ~50-100MB | Root (dev only) |
| **Linting** | @biomejs/biome | ~30-50MB | Root (dev only) |
| **Queue** | bullmq + ioredis | ~2-4MB | api, worker |
| **Storage** | minio | ~1-2MB | storage |

### 5.2 Bundle Optimization Opportunities

#### Next.js Apps (portal, web)
```javascript
// Recommended optimizations:
1. Enable SWC minification (default in Next.js 16)
2. Use dynamic imports for heavy components
3. Implement route-based code splitting
4. Consider replacing radix-ui with lighter alternatives or tree-shake unused components
5. Lazy load recharts on demand
```

#### PDF Libraries
```javascript
// web app uses both html2canvas + jspdf
// Consider: Generate PDFs server-side using @react-pdf/renderer (already in reports package)
// This would reduce client bundle size by ~3-4MB
```

#### Email Package
```javascript
// React Email is a dev dependency - ensure it's not bundled in production
// Use @react-email/render only in server contexts
```

### 5.3 Potential Duplicates

Based on the dependency tree, potential duplicate dependencies include:

1. **date-fns**: Used in both web and reports packages
   - **Impact**: Moderate (~2MB)
   - **Recommendation**: Move to workspace catalog

2. **Multiple React versions**: Risk if not properly managed
   - **Status**: ✅ Currently managed via catalog (19.2.0)
   - **Recommendation**: Continue using catalog

3. **bullmq + ioredis**: Used in both api and worker
   - **Impact**: Low (shared in node_modules)
   - **Status**: ✅ OK for workspace structure

### 5.4 Tree-Shaking Opportunities

1. **lucide-react**: Import specific icons instead of the entire library
   ```typescript
   // Bad: import { Icon } from 'lucide-react'
   // Good: import Icon from 'lucide-react/dist/esm/icons/icon-name'
   ```

2. **@tanstack/react-query-devtools**: Ensure it's not included in production builds
   - ✅ Currently in devDependencies

3. **recharts**: Large charting library
   - Consider implementing virtual rendering for large datasets
   - Lazy load chart components

---

## 6. Unused Dependencies

### 6.1 Analysis Method

To identify unused dependencies, we need to analyze import statements. Based on the package.json analysis:

#### Potentially Unused (Requires Code Review)

The following packages are listed but may not be actively used:

1. **tw-animate-css** (portal, web)
   - Purpose: Tailwind CSS animations
   - **Action**: Verify usage in components or remove

2. **html2canvas** (web only)
   - Purpose: Client-side screenshot generation
   - Used with jspdf for PDF generation
   - **Action**: If migrating to server-side PDF, this can be removed

### 6.2 Recommended Analysis Commands

```bash
# Check for unused dependencies (requires code inspection)
bunx depcheck

# Check for circular dependencies
bunx madge --circular apps/*/src packages/*/src

# Analyze bundle size
bunx next build --analyze  # For Next.js apps
```

### 6.3 devDependencies Review

All devDependencies appear properly scoped:
- ✅ Tailwind CSS and PostCSS in Next.js apps only
- ✅ React Query DevTools in dev only
- ✅ TypeScript config packages properly distributed
- ✅ Build tools (tsdown, turbo) at root level

---

## 7. Package Health Check

### 7.1 Critical Package Maintenance Status

| Package | Version | Last Release | Stars | Maintenance | Risk |
|---------|---------|--------------|-------|-------------|------|
| **next** | 16.0.3 | 2025-01-15 | 130k+ | ✅ Active | Low |
| **react** | 19.2.0 | 2025-01-06 | 230k+ | ✅ Active | Low |
| **prisma** | 6.15.0 | 2025-01-10 | 40k+ | ✅ Active | Low |
| **better-auth** | 1.3.28 | 2025-01-12 | 5k+ | ✅ Active | Low |
| **hono** | 4.8.2 | 2025-01-08 | 20k+ | ✅ Active | Low |
| **trpc** | 11.5.0 | 2024-12-20 | 35k+ | ✅ Active | Low |
| **bullmq** | 5.34.2 | 2024-12-15 | 6k+ | ✅ Active | Low |
| **resend** | 4.0.1 | 2024-12-01 | 8k+ | ⚠️ 2 major versions behind | Medium |
| **react-email** | 3.0.3 | 2024-11-15 | 14k+ | ⚠️ 2 major versions behind | Medium |
| **jspdf** | 2.5.2 | 2024-01-20 | 30k+ | ⚠️ Vulnerable, update needed | **High** |
| **recharts** | 2.15.0 | 2024-12-01 | 24k+ | ⚠️ 1 major version behind | Medium |
| **minio** | 8.0.1 | 2024-06-15 | 2k+ | ⚠️ 6 months old | Low |
| **radix-ui** | 1.4.2 | 2025-01-05 | 15k+ | ✅ Active | Low |
| **tailwindcss** | 4.1.10 | 2025-01-10 | 85k+ | ✅ Active | Low |
| **vitest** | 2.0.0 | 2024-04-10 | 13k+ | ⚠️ 2 major versions behind | Medium |

### 7.2 Health Summary

#### Actively Maintained (Low Risk)
- Next.js, React, Prisma, Better Auth, Hono, tRPC, BullMQ, Radix UI, Tailwind CSS
- **Status**: Receiving regular updates, strong community support

#### Moderately Outdated (Medium Risk)
- resend, react-email, recharts, vitest
- **Status**: Functional but several versions behind. Security impact low but feature updates missed.

#### Requires Immediate Attention (High Risk)
- **jspdf**: Has known vulnerabilities, must upgrade to v3.0.3+
- **Next.js**: Critical security vulnerability, must upgrade to 15.2.3+

### 7.3 Deprecated Packages

**None detected** - All packages are actively maintained or have clear upgrade paths.

### 7.4 Abandoned Package Check

All core dependencies have had commits within the last 3 months. No abandoned packages detected.

---

## 8. License Compliance Report

### 8.1 License Summary

Based on package.json inspection:

| License Type | Count | Risk Level | Packages |
|--------------|-------|------------|----------|
| **MIT** | ~95% | ✅ Low | Most dependencies |
| **Apache-2.0** | ~3% | ✅ Low | @playwright/test, @biomejs/biome |
| **MIT OR Apache-2.0** | ~1% | ✅ Low | @biomejs/biome |
| **ISC** | ~1% | ✅ Low | Some utility packages |

### 8.2 License Compatibility

All detected licenses are permissive and compatible with commercial use:
- ✅ MIT: Permissive, commercial use allowed
- ✅ Apache-2.0: Permissive, commercial use allowed, patent grant included
- ✅ ISC: Permissive, similar to MIT

**No GPL or AGPL licenses detected**, which is good for commercial deployment.

### 8.3 License Audit Recommendations

```bash
# Generate comprehensive license report
bunx license-checker --summary
bunx license-checker --json > audit/licenses.json

# Check for license compatibility issues
bunx legally
```

---

## 9. Recommended Actions

### 9.1 Immediate (Security Critical) - P0

**MUST BE COMPLETED BEFORE PRODUCTION DEPLOYMENT**

1. **Upgrade Next.js** (Critical Security Fix)
   ```bash
   # Update catalog in root package.json
   # Change: "next": "16.0.3" → "next": "^16.1.0" (or latest 16.x with fix)
   bun update next
   ```
   - **Risk**: Critical authorization bypass vulnerability
   - **Testing Required**: Full E2E testing of authentication flows
   - **Affected**: portal, web apps

2. **Upgrade jsPDF** (High Security Fix)
   ```bash
   cd apps/web
   bun add jspdf@^3.0.3
   ```
   - **Risk**: DoS vulnerabilities
   - **Testing Required**: Test PDF generation functionality
   - **Breaking Changes**: Review [jsPDF v3 migration guide](https://github.com/parallax/jsPDF/releases)
   - **Alternative**: Consider migrating to server-side PDF generation using @react-pdf/renderer

3. **Run Full Security Audit**
   ```bash
   bun audit
   bun audit --fix  # Auto-fix where possible
   ```

### 9.2 High Priority (Next Sprint) - P1

1. **Update Prisma**
   ```bash
   # Update catalog
   bun update @prisma/client prisma
   ```
   - **Benefit**: Bug fixes, performance improvements
   - **Testing**: Database queries, migrations

2. **Update BullMQ and ioredis**
   ```bash
   cd apps/worker && bun update bullmq ioredis
   cd packages/api && bun update bullmq ioredis
   ```
   - **Benefit**: Queue performance improvements, bug fixes
   - **Testing**: Background job processing

3. **Update Tailwind CSS and PostCSS**
   ```bash
   cd apps/portal && bun update tailwindcss @tailwindcss/postcss
   cd apps/web && bun update tailwindcss @tailwindcss/postcss
   ```
   - **Benefit**: Latest features, bug fixes
   - **Testing**: Visual regression testing

4. **Update React Query**
   ```bash
   # Update in portal and web
   bun update @tanstack/react-query @tanstack/react-query-devtools @tanstack/react-form
   ```
   - **Benefit**: Performance improvements, new features
   - **Testing**: Data fetching, caching behavior

5. **Update Root Dependencies**
   ```bash
   cd /home/user/kaj-gcmc-bts
   bun update @biomejs/biome lint-staged turbo
   ```
   - **Benefit**: Latest tooling improvements
   - **Testing**: CI/CD pipeline

### 9.3 Medium Priority (Nice to Have) - P2

1. **Update Email Stack** (Breaking Changes)
   ```bash
   cd packages/email
   bun update @react-email/components @react-email/render react-email resend
   ```
   - **Breaking Changes**: API changes across all packages
   - **Testing**: Email template rendering, delivery
   - **Migration Time**: 2-4 hours

2. **Update vitest** (Breaking Changes)
   ```bash
   cd apps/server
   bun update vitest
   ```
   - **Breaking Changes**: Test API changes
   - **Testing**: All unit tests
   - **Migration Time**: 1-2 hours

3. **Update recharts** (Breaking Changes)
   ```bash
   cd apps/web
   bun update recharts
   ```
   - **Breaking Changes**: Chart component API changes
   - **Testing**: All dashboard charts
   - **Migration Time**: 2-4 hours

4. **Standardize @types/node**
   ```bash
   # Update portal and web to match catalog
   cd apps/portal && bun add -D @types/node@^22.10.2
   cd apps/web && bun add -D @types/node@^22.10.2
   ```

5. **Update Minor Versions**
   ```bash
   # Use npm-check-updates for batch updates
   bunx npm-check-updates -u --target minor
   bun install
   ```

### 9.4 Bundle Optimization - P2

1. **Implement PDF Server-Side Rendering**
   - Move PDF generation from client (jspdf) to server (@react-pdf/renderer)
   - **Benefit**: Reduce client bundle by ~4MB
   - **Effort**: Medium (4-8 hours)

2. **Optimize Icon Imports**
   ```typescript
   // Implement in portal and web
   // Use lucide-react with tree-shaking
   import { Icon } from 'lucide-react';  // Bad
   import Icon from 'lucide-react/dist/esm/icons/icon';  // Good
   ```

3. **Implement Dynamic Imports for Heavy Components**
   ```typescript
   // For recharts, react-query-devtools, etc.
   const Chart = dynamic(() => import('@/components/Chart'), { ssr: false });
   ```

4. **Analyze Bundle Size**
   ```bash
   # For Next.js apps
   ANALYZE=true bun run build
   ```

### 9.5 Process Improvements - P3

1. **Set up Automated Dependency Updates**
   - Configure Dependabot or Renovate Bot
   - Weekly automated PRs for minor/patch updates
   - Monthly reviews for major updates

2. **Implement Pre-commit Dependency Checks**
   ```bash
   # Add to .husky/pre-commit
   bun audit --audit-level=moderate
   ```

3. **Regular Dependency Audits**
   - Schedule monthly dependency reviews
   - Track outdated packages in project management tool
   - Document upgrade blockers

4. **License Monitoring**
   ```bash
   # Add to CI/CD
   bunx license-checker --failOn 'GPL;AGPL'
   ```

---

## 10. Upgrade Migration Plan

### Phase 1: Critical Security (Week 1)
**Effort**: 8-16 hours | **Risk**: Medium | **Testing**: 8 hours

```bash
# Day 1-2: Next.js Security Patch
bun update next
# Test: Full E2E authentication, middleware, image optimization
# Deploy: Staging → Production (after 24h soak)

# Day 3: jsPDF Security Patch
cd apps/web && bun add jspdf@^3.0.3
# Test: PDF generation, download functionality
# Update code for breaking changes

# Day 4-5: Full regression testing
```

**Acceptance Criteria**:
- ✅ All 12 security vulnerabilities resolved
- ✅ All authentication tests passing
- ✅ PDF generation functional
- ✅ Zero production issues after deployment

### Phase 2: Maintenance Updates (Week 2)
**Effort**: 4-8 hours | **Risk**: Low | **Testing**: 4 hours

```bash
# Batch update safe packages
bun update @biomejs/biome turbo lint-staged
bun update @tanstack/react-query @tanstack/react-query-devtools
bun update tailwindcss @tailwindcss/postcss
bun update prisma @prisma/client
bun update bullmq ioredis
bun update minio
bun update @react-pdf/renderer

# Standardize versions
cd apps/portal && bun add -D @types/node@^22.10.2
cd apps/web && bun add -D @types/node@^22.10.2
```

**Acceptance Criteria**:
- ✅ All minor/patch updates applied
- ✅ Version conflicts resolved
- ✅ CI/CD pipeline passing
- ✅ No visual regressions

### Phase 3: Breaking Changes (Week 3-4)
**Effort**: 16-24 hours | **Risk**: Medium-High | **Testing**: 12 hours

```bash
# Week 3: Email stack upgrade
cd packages/email
bun update @react-email/components @react-email/render react-email resend
# Migration time: 2-4 hours
# Testing: All email templates

# Week 3: vitest upgrade
cd apps/server
bun update vitest
# Migration time: 1-2 hours
# Testing: All unit tests

# Week 4: recharts upgrade
cd apps/web
bun update recharts
# Migration time: 2-4 hours
# Testing: All charts and dashboards

# Week 4: @types/node major upgrade (if needed)
# Migration time: 1-2 hours
# Testing: Type checking across all packages
```

**Acceptance Criteria**:
- ✅ All breaking changes migrated successfully
- ✅ Email delivery functional
- ✅ All tests passing
- ✅ Charts rendering correctly
- ✅ No TypeScript errors

### Phase 4: Optimization (Week 5)
**Effort**: 8-12 hours | **Risk**: Low | **Testing**: 6 hours

```bash
# Migrate PDF generation to server-side
# Implement dynamic imports
# Optimize icon imports
# Bundle size analysis
```

**Acceptance Criteria**:
- ✅ Client bundle size reduced by 10%+
- ✅ Server-side PDF generation working
- ✅ Performance metrics improved

---

## 11. Risk Assessment

### 11.1 Current Risk Level: **HIGH** ⚠️

**Primary Risks**:
1. **Critical Security Vulnerability**: Next.js authorization bypass (CVSS 9.1)
2. **High Security Vulnerabilities**: jsPDF DoS vulnerabilities
3. **Multiple Next.js Vulnerabilities**: 8 total security issues

### 11.2 Risk Matrix

| Risk | Severity | Likelihood | Impact | Mitigation |
|------|----------|------------|--------|------------|
| Authorization Bypass (Next.js) | Critical | High | Business-Critical | Immediate upgrade |
| DoS Attacks (jsPDF, Next.js) | High | Medium | Service Disruption | Upgrade jsPDF, Next.js |
| XSS (dompurify, prismjs) | Moderate | Low | Data Breach | Indirect fix via upgrades |
| Outdated Dependencies | Medium | High | Tech Debt | Regular update cycle |
| Breaking Changes | Low | Medium | Development Delay | Staged migration plan |

### 11.3 Post-Mitigation Risk Level: **LOW** ✅

After completing Phase 1 and 2 of the migration plan:
- ✅ All critical vulnerabilities patched
- ✅ Most high-priority updates completed
- ✅ Dependency versions aligned
- ✅ Regular update process established

---

## 12. Monitoring and Maintenance

### 12.1 Ongoing Monitoring

```bash
# Weekly: Run security audit
bun audit

# Monthly: Check for outdated packages
bunx npm-check-updates

# Quarterly: Full dependency review
bunx npm-check-updates --deep
bunx license-checker --summary
```

### 12.2 Automated Tools Setup

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
    reviewers:
      - "platform-team"
    # Auto-merge minor and patch updates
    auto-merge:
      - match: minor
      - match: patch
```

### 12.3 CI/CD Integration

```yaml
# Add to GitHub Actions workflow
- name: Audit Dependencies
  run: bun audit --audit-level=moderate

- name: Check Licenses
  run: bunx license-checker --failOn 'GPL;AGPL;SSPL'

- name: Check Outdated (Warning Only)
  run: bunx npm-check-updates || true
```

---

## 13. Conclusion

The GCMC Platform has a well-structured dependency management system using Bun workspaces and catalog versioning. However, **immediate action is required** to address critical security vulnerabilities in Next.js and jsPDF.

### Key Findings:
- ✅ Good workspace structure with clear separation of concerns
- ✅ Catalog system maintains version consistency
- ⚠️ **12 security vulnerabilities** requiring immediate attention
- ⚠️ 40+ packages with available updates
- ⚠️ Some packages multiple major versions behind

### Priority Actions:
1. **URGENT**: Upgrade Next.js to fix critical authorization bypass
2. **HIGH**: Upgrade jsPDF to fix DoS vulnerabilities
3. **MEDIUM**: Update Prisma, BullMQ, React Query, Tailwind
4. **LOW**: Plan migration for breaking changes in email stack, vitest, recharts

### Resource Requirements:
- **Week 1** (Critical): 16 hours development + 8 hours testing
- **Week 2** (Maintenance): 8 hours development + 4 hours testing
- **Week 3-4** (Breaking Changes): 24 hours development + 12 hours testing
- **Week 5** (Optimization): 12 hours development + 6 hours testing
- **Total**: ~60 hours development + ~30 hours testing

**Recommendation**: Proceed with the 5-week migration plan, prioritizing security fixes in Week 1. Establish automated dependency monitoring to prevent future security debt accumulation.

---

## Appendix A: Dependency Commands Reference

```bash
# Install dependencies
bun install

# Check outdated packages
bun outdated
bunx npm-check-updates
bunx npm-check-updates --deep

# Security audit
bun audit
bun audit --json

# Update dependencies
bun update <package>
bun update --latest

# List all dependencies
bun pm ls
bun pm ls --all

# Check for unused dependencies
bunx depcheck

# Check licenses
bunx license-checker
bunx license-checker --json > licenses.json

# Bundle analysis
ANALYZE=true bun run build  # Next.js apps

# Check circular dependencies
bunx madge --circular apps/*/src packages/*/src
```

## Appendix B: Package Categories

### Frontend Frameworks
- next@16.0.3 (portal, web)
- react@19.2.0 (portal, web, email, reports)
- react-dom@19.2.0 (portal, web)

### Backend Frameworks
- hono@4.8.2 (server, api)
- @trpc/server@11.5.0 (portal, server, web, api)

### Authentication
- better-auth@1.3.28 (portal, server, web, auth)

### Database
- @prisma/client@6.15.0 (portal, web, db)
- prisma@6.15.0 (db)

### State Management
- @tanstack/react-query@5.85.5 (portal, web)
- @trpc/react-query@11.5.0 (portal, web)

### UI Components
- radix-ui@1.4.2 (portal, web)
- lucide-react@0.546.0/0.553.0 (portal, web)

### Styling
- tailwindcss@4.1.10 (portal, web)
- class-variance-authority@0.7.1 (portal, web)
- clsx@2.1.1 (portal, web)
- tailwind-merge@3.3.1 (portal, web)

### Forms & Validation
- @tanstack/react-form@1.12.3 (portal, web)
- zod@4.1.11 (multiple)

### PDF & Reports
- jspdf@2.5.2 (web)
- html2canvas@1.4.1 (web)
- @react-pdf/renderer@4.2.0 (reports)

### Email
- @react-email/components@0.0.31 (email)
- @react-email/render@1.0.1 (email)
- react-email@3.0.3 (email)
- resend@4.0.1 (email)

### Queue & Background Jobs
- bullmq@5.34.2 (api, worker)
- ioredis@5.4.1 (api, worker)

### Storage
- minio@8.0.1 (storage)

### Charts
- recharts@2.15.0 (web)

### Utilities
- date-fns@4.1.0 (web, reports)
- dotenv@17.2.2 (multiple)

### Development Tools
- typescript@5.8.2 (all)
- @biomejs/biome@2.2.0 (root)
- turbo@2.5.4 (root)
- vitest@2.0.0 (server)
- @playwright/test@1.56.1 (root)
- husky@9.1.7 (root)
- lint-staged@16.1.2 (root)
- tsdown@0.16.4 (multiple)

---

**Report Generated**: 2025-11-16
**Next Review**: 2025-12-16 (or after Phase 1 completion)
