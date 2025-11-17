# React Hydration Fixes Documentation

This document outlines the hydration issues that were identified and fixed in the KAJ-GCMC BTS Platform Next.js application.

## Issues Identified and Fixed

### 1. Browser API Usage During SSR

**Problem:** Components were using `document`, `window`, and other browser APIs during server-side rendering.

**Files Fixed:**
- `/src/components/ui/command-palette.tsx` - Added `typeof window !== 'undefined'` checks
- `/src/components/reports/ReportDownloadButton.tsx` - Added client-side checks for download functionality
- `/src/components/mode-toggle.tsx` - Added client-side rendering check

**Solution:**
```typescript
// Before (causes hydration mismatch)
document.addEventListener("keydown", down);

// After (hydration-safe)
if (typeof window === 'undefined') return;
document.addEventListener("keydown", down);
```

### 2. Date Formatting Inconsistencies

**Problem:** Date formatting with `toLocaleDateString()` without explicit locale options could produce different results between server and client.

**Files Fixed:**
- `/src/components/documents/client-documents-with-export.tsx`
- `/src/components/admin/users-list.tsx`

**Solution:**
- Created `/src/utils/date-utils.ts` with consistent date formatting functions
- Replaced `toLocaleDateString()` with `formatDate()` utility that uses explicit locale options

```typescript
// Before (potential hydration mismatch)
new Date(date).toLocaleDateString()

// After (hydration-safe)
formatDate(date) // Uses explicit 'en-US' locale
```

### 3. Authentication State Hydration

**Problem:** User authentication state could differ between server and client rendering.

**Files Fixed:**
- `/src/components/user-menu.tsx` - Added client-side mounting check

**Solution:**
```typescript
const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);

// Show loading state during hydration
if (!isClient || isPending) {
  return <Skeleton className="h-9 w-24" />;
}
```

### 4. Theme Toggle Hydration

**Problem:** Theme toggle component could show different states during SSR vs client rendering.

**Files Fixed:**
- `/src/components/mode-toggle.tsx` - Added client-side check

### 5. Date/Time Picker Components

**Problem:** Date creation with `new Date()` could produce different timestamps between server and client.

**Files Fixed:**
- `/src/components/ui/date-picker.tsx` - Made date handling more predictable

## Utilities Created

### 1. Date Utils (`/src/utils/date-utils.ts`)

Provides hydration-safe date formatting functions:
- `formatDate()` - Consistent date formatting with explicit locale
- `formatDateTime()` - Date and time formatting
- `formatTime()` - Time-only formatting
- `formatRelativeTime()` - Relative time (e.g., "2 days ago")
- `isClientSide()` - Check if code is running on client
- `getCurrentDate()` - Get current date in hydration-safe way

### 2. Client-Only Component (`/src/components/client-only.tsx`)

Prevents hydration mismatches by only rendering children on client-side:
- `<ClientOnly>` component wrapper
- `useIsClient()` hook for conditional rendering

## Best Practices Implemented

### 1. Browser API Safety
```typescript
// Always check for client-side before using browser APIs
if (typeof window !== 'undefined') {
  // Use window, document, localStorage, etc.
}
```

### 2. Consistent Date Formatting
```typescript
// Use utility functions instead of direct Date methods
import { formatDate } from '@/utils/date-utils';

// Instead of: new Date().toLocaleDateString()
// Use: formatDate(new Date())
```

### 3. Authentication State Management
```typescript
// Handle loading states during hydration
const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);

if (!isClient || isPending) {
  return <LoadingComponent />;
}
```

### 4. Client-Only Components
```typescript
import { ClientOnly } from '@/components/client-only';

// Wrap components that must run only on client
<ClientOnly fallback={<Loading />}>
  <ComponentWithBrowserAPIs />
</ClientOnly>
```

## Files Modified

1. `/src/components/ui/command-palette.tsx` - Browser API safety
2. `/src/components/reports/ReportDownloadButton.tsx` - Browser API safety
3. `/src/components/documents/client-documents-with-export.tsx` - Date formatting
4. `/src/components/ui/date-picker.tsx` - Date handling consistency
5. `/src/components/user-menu.tsx` - Auth state hydration
6. `/src/components/mode-toggle.tsx` - Theme toggle hydration
7. `/src/components/admin/users-list.tsx` - Date formatting

## Files Created

1. `/src/utils/date-utils.ts` - Date formatting utilities
2. `/src/components/client-only.tsx` - Client-only wrapper component
3. `/HYDRATION_FIXES.md` - This documentation

## Testing Recommendations

1. **SSR Testing**: Test with JavaScript disabled to verify SSR output
2. **Hydration Testing**: Use React DevTools to check for hydration warnings
3. **Date Testing**: Test in different timezones and locales
4. **Theme Testing**: Test theme switching without hydration issues
5. **Authentication Testing**: Test login/logout flows for hydration consistency

## Monitoring

To prevent future hydration issues:
1. Enable React's strict mode in development
2. Use ESLint rules to catch hydration issues
3. Monitor browser console for hydration warnings
4. Test across different browsers and timezones

## Next Steps

1. Apply similar fixes to any remaining components with date formatting
2. Consider implementing a global error boundary for hydration errors
3. Add automated testing for hydration consistency
4. Document patterns for future development