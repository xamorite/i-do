# Environment Variables Setup

This document lists all required environment variables for the application.

## Firebase Client Configuration (Required)

These are public keys and safe to expose in client-side code. Set these in Netlify's environment variables.

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Firebase Admin SDK (Server-side only - Keep secret!)

This should be a JSON string of your service account key. You can base64 encode it for easier storage in Netlify environment variables.

```
FIREBASE_SERVICE_ACCOUNT=your_service_account_json_string_or_base64
```

## Token Encryption (Optional but recommended for production)

```
TOKEN_ENCRYPTION_KEY=your_base64_encoded_32_byte_key
```

## Google OAuth Integration

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://dailyexpress.netlify.app/api/integrations/google/callback
```

## Notion Integration

```
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
NOTION_REDIRECT_URI=https://dailyexpress.netlify.app/api/integrations/notion/callback
```

## Slack Integration

```
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=https://dailyexpress.netlify.app/api/integrations/slack/callback
```

## Setting up in Netlify

1. Go to your Netlify site dashboard
2. Navigate to Site settings > Environment variables
3. Add each variable listed above
4. For `FIREBASE_SERVICE_ACCOUNT`, you can either:
   - Paste the entire JSON as a string (Netlify will handle it)
   - Or base64 encode it first for easier storage

## Current Firebase Config Values

Based on the code, your current Firebase project is:

- Project ID: `mopcare-2a00f`
- Auth Domain: `mopcare-2a00f.firebaseapp.com`
- Storage Bucket: `mopcare-2a00f.firebasestorage.app`

Make sure to set these values in Netlify environment variables.
