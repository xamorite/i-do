#!/usr/bin/env node
/**
 * Environment Variable Verification Script
 * 
 * This script checks if all required environment variables are set.
 * Run with: npx tsx scripts/verify-env.ts
 * Or: node --loader ts-node/esm scripts/verify-env.ts
 */

const requiredEnvVars: Record<string, string> = {
  // Firebase Client (Public - safe to expose)
  NEXT_PUBLIC_FIREBASE_API_KEY: 'Firebase API Key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'Firebase Auth Domain',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'Firebase Project ID',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'Firebase Storage Bucket',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'Firebase Messaging Sender ID',
  NEXT_PUBLIC_FIREBASE_APP_ID: 'Firebase App ID',
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: 'Firebase Measurement ID (optional)',

  // Firebase Admin (Server-side - keep secret!)
  FIREBASE_SERVICE_ACCOUNT: 'Firebase Service Account JSON (or use FIREBASE_SERVICE_ACCOUNT_JSON)',

  // OAuth Integrations (Optional - only if using integrations)
  GOOGLE_CLIENT_ID: 'Google OAuth Client ID (optional)',
  GOOGLE_CLIENT_SECRET: 'Google OAuth Client Secret (optional)',
  GOOGLE_REDIRECT_URI: 'Google OAuth Redirect URI (optional)',

  NOTION_CLIENT_ID: 'Notion OAuth Client ID (optional)',
  NOTION_CLIENT_SECRET: 'Notion OAuth Client Secret (optional)',
  NOTION_REDIRECT_URI: 'Notion OAuth Redirect URI (optional)',

  SLACK_CLIENT_ID: 'Slack OAuth Client ID (optional)',
  SLACK_CLIENT_SECRET: 'Slack OAuth Client Secret (optional)',
  SLACK_REDIRECT_URI: 'Slack OAuth Redirect URI (optional)',

  // Optional
  TOKEN_ENCRYPTION_KEY: 'Token Encryption Key (optional but recommended)',
};

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'FIREBASE_SERVICE_ACCOUNT',
];

const optionalVars = Object.keys(requiredEnvVars).filter(
  key => !requiredVars.includes(key)
);

function checkEnvVars() {
  console.log('🔍 Checking environment variables...\n');

  let hasErrors = false;
  let hasWarnings = false;

  // Check required variables
  console.log('📋 Required Variables:');
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      console.log(`  ❌ ${varName}: MISSING - ${requiredEnvVars[varName]}`);
      hasErrors = true;
    } else {
      // Mask sensitive values
      const displayValue = varName.includes('SECRET') || varName.includes('SERVICE_ACCOUNT') || varName.includes('KEY')
        ? '***' + value.slice(-4)
        : value;
      console.log(`  ✅ ${varName}: Set (${displayValue})`);
    }
  }

  console.log('\n📋 Optional Variables:');
  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      console.log(`  ⚠️  ${varName}: Not set - ${requiredEnvVars[varName]}`);
      hasWarnings = true;
    } else {
      const displayValue = varName.includes('SECRET') || varName.includes('KEY')
        ? '***' + value.slice(-4)
        : value;
      console.log(`  ✅ ${varName}: Set (${displayValue})`);
    }
  }

  console.log('\n' + '='.repeat(60));

  if (hasErrors) {
    console.log('❌ ERRORS FOUND: Some required environment variables are missing!');
    console.log('   Please set all required variables before deploying.\n');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  WARNINGS: Some optional variables are not set.');
    console.log('   The app will work, but some features may not be available.\n');
    process.exit(0);
  } else {
    console.log('✅ All environment variables are set correctly!\n');
    process.exit(0);
  }
}

// Run the check
checkEnvVars();

