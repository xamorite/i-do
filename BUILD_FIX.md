# Build Error Fix

## Issue
Build was failing with error:
```
Error: Failed to collect page data for /api/calendar/events
```

## Root Cause
Next.js tries to statically analyze API routes during build time. When it imports modules that initialize Firebase Admin at module load time, it can fail if environment variables aren't available during build.

## Solution

### 1. Lazy Firebase Admin Initialization
Modified `lib/firebaseAdmin.ts` to use lazy initialization:
- Firebase Admin only initializes when actually accessed (at runtime)
- During build time, initialization is skipped gracefully
- Uses Proxy pattern to maintain backward compatibility with existing imports

### 2. Route Segment Config
Added to `app/api/calendar/events/route.ts`:
```typescript
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

This tells Next.js:
- `dynamic = 'force-dynamic'`: Don't try to statically analyze this route
- `runtime = 'nodejs'`: This is a Node.js runtime route (not edge)

## Additional Improvements
- Improved error handling in calendar events route
- Added proper Content-Type headers
- Better error messages for debugging

## Testing
After these changes:
1. Build should complete successfully: `npm run build`
2. API routes will initialize Firebase Admin at runtime (when actually called)
3. No build-time errors from Firebase Admin initialization

## Note
If you see similar build errors for other API routes, add the same route segment config:
```typescript
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

