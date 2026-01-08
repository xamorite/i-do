# Environment Variable Verification

## Quick Check

To verify all environment variables are set correctly, you can:

### Option 1: Manual Check
Review the list in `ENV_SETUP.md` and verify each variable is set in Netlify.

### Option 2: Use the Verification Script
```bash
# Install tsx if not already installed
npm install -g tsx

# Run the verification script
npx tsx scripts/verify-env.ts
```

Or add to package.json:
```json
{
  "scripts": {
    "verify-env": "tsx scripts/verify-env.ts"
  }
}
```

Then run: `npm run verify-env`

## Required Variables Checklist

### Firebase Client (All Required)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional but recommended)

### Firebase Admin (Required)
- [ ] `FIREBASE_SERVICE_ACCOUNT` (or `FIREBASE_SERVICE_ACCOUNT_JSON`)

### OAuth Integrations (Optional - only if using)
- [ ] `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` (for Google Calendar)
- [ ] `NOTION_CLIENT_ID` & `NOTION_CLIENT_SECRET` (for Notion)
- [ ] `SLACK_CLIENT_ID` & `SLACK_CLIENT_SECRET` (for Slack)

### Security (Optional but Recommended)
- [ ] `TOKEN_ENCRYPTION_KEY` (for encrypting tokens at rest)

## Netlify Setup

1. Go to: **Netlify Dashboard → Your Site → Site Settings → Environment Variables**
2. Add each variable
3. For `FIREBASE_SERVICE_ACCOUNT`, paste the entire JSON as a string
4. Redeploy after adding variables

## Verification After Deployment

After deployment, check:
1. Browser console for Firebase initialization errors
2. Network tab for failed API requests
3. Test authentication flow
4. Test task creation/editing

If you see errors about missing environment variables, double-check they're set in Netlify and that you've redeployed after adding them.

