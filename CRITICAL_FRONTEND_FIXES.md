# CRITICAL FRONTEND FIXES - ACTION REQUIRED

## Issue 1: Service Request Form useState Bug
**File:** `/home/user/kaj-gcmc-bts/apps/web/src/components/service-requests/service-request-form.tsx`
**Line:** 100
**Current Code:**
```typescript
useState(() => {
    if (serviceRequest) {
        setFormData({
            // ... form data ...
        });
    }
});
```
**Fix:** Change to `useEffect`:
```typescript
useEffect(() => {
    if (serviceRequest) {
        setFormData({
            // ... form data ...
        });
    }
}, [serviceRequest]);
```

---

## Issue 2: Document Upload Not Implemented
**File:** `/home/user/kaj-gcmc-bts/apps/web/src/components/documents/document-upload-dialog.tsx`
**Line:** 59
**Current Code:**
```typescript
// TODO: Implement actual file upload using tRPC documentUpload.createUploadUrl
// This is a placeholder for the upload logic
await new Promise((resolve) => setTimeout(resolve, 2000));
```
**Status:** This is just a mock/placeholder

**Required Fix:** Connect to backend upload service:
```typescript
try {
    // Get upload URL from backend
    const uploadUrl = await trpc.documents.getUploadUrl.mutate({
        filename: file.name,
        size: file.size,
    });
    
    // Upload to storage service
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
    });
    
    if (!response.ok) throw new Error('Upload failed');
    
    // Create document record in database
    await trpc.documents.create.mutate({
        title: file.name,
        documentType: 'uploaded',
        // ... other fields ...
    });
} catch (error) {
    toast.error("Failed to upload document");
}
```

---

## High Priority Fixes

### Missing Error Boundaries
**Location:** `/home/user/kaj-gcmc-bts/apps/web/src/app/`
**Create:** `error.tsx` at root level
```typescript
'use client';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Something went wrong!</h1>
                <button onClick={() => reset()}>Try again</button>
            </div>
        </div>
    );
}
```

### Missing Not Found Handler
**Location:** `/home/user/kaj-gcmc-bts/apps/web/src/app/`
**Create:** `not-found.tsx`
```typescript
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="text-muted-foreground mb-6">Page not found</p>
                <Link href="/dashboard" className="text-primary">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}
```

### Missing Loading State
**Location:** `/home/user/kaj-gcmc-bts/apps/web/src/app/`
**Create:** `loading.tsx`
```typescript
import { Loader } from '@/components/loader';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader />
        </div>
    );
}
```

---

## File Path Reference

**Critical Issue Files:**
- Service Request Form: `/home/user/kaj-gcmc-bts/apps/web/src/components/service-requests/service-request-form.tsx`
- Document Upload: `/home/user/kaj-gcmc-bts/apps/web/src/components/documents/document-upload-dialog.tsx`

**Related Components to Update:**
- Client Detail Page: `/home/user/kaj-gcmc-bts/apps/web/src/app/(dashboard)/clients/[id]/page.tsx`
- Header (Navigation): `/home/user/kaj-gcmc-bts/apps/web/src/components/header.tsx`
- Admin Page: `/home/user/kaj-gcmc-bts/apps/web/src/app/(dashboard)/admin/page.tsx`

**Root App Files to Create/Update:**
- Layout: `/home/user/kaj-gcmc-bts/apps/web/src/app/layout.tsx`
- New: `/home/user/kaj-gcmc-bts/apps/web/src/app/error.tsx`
- New: `/home/user/kaj-gcmc-bts/apps/web/src/app/not-found.tsx`
- New: `/home/user/kaj-gcmc-bts/apps/web/src/app/loading.tsx`

