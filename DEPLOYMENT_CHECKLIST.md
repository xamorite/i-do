# Deployment Checklist

Use this checklist before deploying to production on Netlify.

## 🔐 Environment Variables (CRITICAL)

### Firebase Client Configuration

- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### Firebase Admin (Server-side)

- [ ] `FIREBASE_SERVICE_ACCOUNT` (JSON string or base64 encoded)

### OAuth Integrations (if used)

- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_REDIRECT_URI` (should be: `https://dailyexpress.netlify.app/api/integrations/google/callback`)
- [ ] `NOTION_CLIENT_ID`
- [ ] `NOTION_CLIENT_SECRET`
- [ ] `NOTION_REDIRECT_URI` (should be: `https://dailyexpress.netlify.app/api/integrations/notion/callback`)
- [ ] `SLACK_CLIENT_ID`
- [ ] `SLACK_CLIENT_SECRET`
- [ ] `SLACK_REDIRECT_URI` (should be: `https://dailyexpress.netlify.app/api/integrations/slack/callback`)

### Optional

- [ ] `TOKEN_ENCRYPTION_KEY` (for encrypting tokens at rest)

## 🔒 Security Checks

- [ ] Verify `service-account.json` is NOT in git history
- [ ] Check that `.gitignore` includes `service-account.json`
- [ ] Review Firebase Security Rules in Firestore console
- [ ] Verify OAuth redirect URIs match exactly in service configurations
- [ ] Consider rotating Firebase API keys (they were previously hardcoded)

## 🧪 Pre-Deployment Testing

### Local Testing

- [ ] Run `npm run build` successfully
- [ ] Test authentication (email/password)
- [ ] Test Google OAuth sign-in
- [ ] Test task creation
- [ ] Test task update
- [ ] Test task deletion
- [ ] Test integrations (if used)

### Build Verification

- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build completes without warnings

## 🚀 Deployment Steps

1. [ ] Set all environment variables in Netlify dashboard
2. [ ] Push changes to repository (or trigger manual deploy)
3. [ ] Monitor build logs in Netlify
4. [ ] Wait for deployment to complete

## ✅ Post-Deployment Verification

### Functionality Tests

- [ ] Visit `https://dailyexpress.netlify.app`
- [ ] Test user registration
- [ ] Test user login
- [ ] Test Google OAuth
- [ ] Test task creation
- [ ] Test task editing
- [ ] Test task deletion
- [ ] Test calendar view
- [ ] Test integrations (if used)

### Error Checking

- [ ] Open browser console - check for errors
- [ ] Check Netlify function logs for API errors
- [ ] Test error boundary (should show friendly error page)
- [ ] Verify 404 pages work correctly

### Performance

- [ ] Check page load times
- [ ] Verify images/assets load correctly
- [ ] Test on mobile device
- [ ] Test in different browsers (Chrome, Firefox, Safari)

### Security Headers

- [ ] Visit `https://securityheaders.com` and check your site
- [ ] Verify HTTPS is enforced
- [ ] Check that sensitive headers are not exposed

## 📊 Monitoring Setup (Recommended)

- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure Firebase Analytics (if not already)
- [ ] Set up uptime monitoring
- [ ] Configure alerts for build failures

## 📝 Documentation

- [ ] Update README with deployment instructions
- [ ] Document any custom environment variables
- [ ] Note any known issues or limitations

## 🐛 Troubleshooting

If deployment fails:

1. Check Netlify build logs
2. Verify all environment variables are set
3. Check Firebase configuration
4. Review error messages in browser console
5. Check Netlify function logs

If site loads but features don't work:

1. Check browser console for errors
2. Verify Firebase environment variables are correct
3. Check network tab for failed API requests
4. Verify Firebase Security Rules allow access
5. Check that service account has proper permissions

## 📞 Support Resources

- Netlify Docs: https://docs.netlify.com
- Firebase Docs: https://firebase.google.com/docs
- Next.js Docs: https://nextjs.org/docs
