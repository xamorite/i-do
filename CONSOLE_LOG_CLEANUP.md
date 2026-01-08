# Console.log Cleanup Guide

## Overview

Found 69 instances of `console.log`, `console.error`, and `console.warn` throughout the codebase.

## Strategy

### Keep (Error Logging)

- `console.error()` in API routes - These are important for debugging production issues
- `console.error()` in error boundaries - Critical for error tracking
- `console.warn()` for important warnings

### Replace with Logger Utility

- `console.log()` for debugging - Replace with `logger.log()` or `logger.debug()`
- `console.info()` - Replace with `logger.info()`

### Remove

- Debug `console.log()` statements that are no longer needed
- Temporary logging added during development

## Logger Utility

A production-safe logger has been created at `lib/logger.ts`:

```typescript
import { logger } from "@/lib/logger";

// In development: logs to console
// In production: silently ignored
logger.log("Debug message");
logger.info("Info message");

// Always logged (dev and production)
logger.warn("Warning message");
logger.error("Error message");
```

## Migration Steps

1. **Import the logger**:

   ```typescript
   import { logger } from "@/lib/logger";
   ```

2. **Replace console.log with logger.log**:

   ```typescript
   // Before
   console.log("Debug info");

   // After
   logger.log("Debug info");
   ```

3. **Keep console.error for API routes** (or replace with logger.error):

   ```typescript
   // Keep as-is (important for production debugging)
   console.error("[API] Error:", error);

   // Or use logger
   logger.error("[API] Error:", error);
   ```

## Priority Areas

### High Priority (API Routes)

- `app/api/**/*.ts` - Keep error logging, replace debug logs

### Medium Priority (Components)

- `components/**/*.tsx` - Replace with logger or remove
- `contexts/**/*.tsx` - Replace with logger

### Low Priority (Hooks & Services)

- `hooks/**/*.ts` - Replace with logger
- `lib/services/**/*.ts` - Keep error logging, replace debug logs

## Example Replacements

### API Routes

```typescript
// Before
console.log("Processing request");
console.error("Error:", err);

// After
logger.log("Processing request"); // Only in dev
logger.error("Error:", err); // Always logged
```

### Components

```typescript
// Before
console.log("Component mounted");
console.warn("Deprecated prop used");

// After
logger.debug("Component mounted"); // Only in dev
logger.warn("Deprecated prop used"); // Always logged
```

## Automated Cleanup (Optional)

You can use find/replace:

1. Search for: `console.log(`
2. Replace with: `logger.log(`
3. Add import: `import { logger } from '@/lib/logger';`

**Note**: Review each replacement to ensure it makes sense in context.

## Production Considerations

- Error logs (`console.error`, `logger.error`) should be kept for production debugging
- Consider integrating with error tracking service (Sentry, LogRocket, etc.)
- Debug logs should not expose sensitive information
- Remove any logs that expose API keys, tokens, or user data

## Status

- ✅ Logger utility created (`lib/logger.ts`)
- ⏳ Manual cleanup needed (69 instances)
- ⏳ Consider error tracking service integration
