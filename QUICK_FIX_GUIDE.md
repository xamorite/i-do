# Quick Fix Guide for Production Deployment

## 🚨 IMMEDIATE ACTION REQUIRED

### 1. Set Environment Variables in Netlify

Go to: **Netlify Dashboard → Your Site → Site Settings → Environment Variables**

Add these variables with your Firebase project values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDK_GZMU3m0CoulUx9ztgYnjiFO7iyD26g
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mopcare-2a00f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mopcare-2a00f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mopcare-2a00f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=955194586561
NEXT_PUBLIC_FIREBASE_APP_ID=1:955194586561:web:c63a401bcba981757b6b40
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-8M20N7SHZG
```

**Note**: These are your current values that were hardcoded. For better security, consider rotating these keys after deployment.

### 2. Set Firebase Service Account (Server-side)

You need to set `FIREBASE_SERVICE_ACCOUNT` in Netlify environment variables.

**Option A**: Paste the entire JSON from `service-account.json` as a string
**Option B**: Base64 encode it first for easier storage

### 3. Set OAuth Credentials (if using integrations)

If you're using Google, Notion, or Slack integrations, set:
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET`
- `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET`
- Set the redirect URIs to: `https://dailyexpress.netlify.app/api/integrations/{service}/callback`

### 4. Verify service-account.json is NOT in Git

Run this command to check:
```bash
git log --all --full-history -- service-account.json
```

If it shows commits, the file was committed and you need to:
1. Rotate your Firebase service account credentials
2. Remove it from git history (use `git filter-branch` or BFG Repo-Cleaner)

## ✅ What Was Fixed

1. ✅ **Firebase credentials** moved to environment variables
2. ✅ **Netlify configuration** created (`netlify.toml`)
3. ✅ **Error boundaries** added for React error handling
4. ✅ **Security headers** added to Next.js config
5. ✅ **API error handling** improved
6. ✅ **OAuth error handling** improved

## 📋 After Setting Environment Variables

1. **Redeploy** your site on Netlify (or push a new commit)
2. **Test** the live site:
   - Authentication (email/password and Google)
   - Task creation/editing/deletion
   - Integrations (if used)
3. **Check browser console** for any errors
4. **Monitor** for any React 19 compatibility issues

## ⚠️ Remaining Recommendations

1. **Console.log statements**: 69 instances found - consider removing debug logs
2. **React 19**: Monitor for compatibility issues with Next.js 16.0.7
3. **Error monitoring**: Set up Sentry or similar for production error tracking
4. **Firebase App Check**: Enable to protect backend resources

## 🔗 Useful Links

- Netlify Environment Variables: https://app.netlify.com/sites/[your-site]/configuration/env
- Firebase Console: https://console.firebase.google.com/project/mopcare-2a00f
- See `PRODUCTION_READINESS.md` for detailed information

