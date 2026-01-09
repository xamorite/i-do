import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import fs from 'fs';
import path from 'path';

let _adminAuth: admin.auth.Auth | null = null;
let _adminDb: admin.firestore.Firestore | null = null;
let _initialized = false;

function initializeFirebaseAdmin() {
  if (_initialized) return;

  // Log environment state for debugging
  const hasServiceAccount = !!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const hasMinimalCreds = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
  const hasGoogleCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  console.log(`[Firebase Admin] Init check - hasServiceAccount: ${hasServiceAccount}, hasMinimalCreds: ${hasMinimalCreds}, hasGoogleCreds: ${hasGoogleCreds}, NODE_ENV: ${process.env.NODE_ENV}`);

  // During Next.js build phase, skip initialization to avoid build errors
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('[Firebase Admin] Skipping init during build phase');
    _initialized = true;
    return;
  }

  if (!getApps().length) {
    try {
      // Option 1: Individual env vars (recommended for Netlify to avoid 4KB limit)
      if (hasMinimalCreds) {
        console.log('[Firebase Admin] Using minimal credentials (individual env vars)');
        const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID!,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
            privateKey: privateKey,
          }),
        });
        console.log(`[Firebase Admin] Initialized with project: ${process.env.FIREBASE_PROJECT_ID}`);
        _initialized = true;
        return;
      }

      // Option 2: Full JSON service account
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

      if (serviceAccountJson) {
        console.log('[Firebase Admin] Found service account env var');
        let sanitizedJson = serviceAccountJson;

        // Check if base64 encoded
        if (!serviceAccountJson.trim().startsWith('{')) {
          try {
            sanitizedJson = Buffer.from(serviceAccountJson, 'base64').toString('utf8');
            console.log('[Firebase Admin] Decoded base64 service account');
          } catch (e) {
            console.log('[Firebase Admin] Not base64, using raw JSON');
          }
        }

        // Fix newlines
        sanitizedJson = sanitizedJson.replace(/\\\\n/g, '\\n').replace(/\\n/g, '\n');

        try {
          const serviceAccount = JSON.parse(sanitizedJson);
          console.log(`[Firebase Admin] Parsed service account for project: ${serviceAccount.project_id}`);

          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          console.log('[Firebase Admin] Initialized successfully with service account');
        } catch (parseError: any) {
          console.error('[Firebase Admin] Failed to parse service account JSON:', parseError.message);
          throw parseError;
        }
      } else if (hasGoogleCreds) {
        console.log('[Firebase Admin] Using GOOGLE_APPLICATION_CREDENTIALS');
        admin.initializeApp();
      } else {
        // Check for local service-account.json (only in development)
        if (process.env.NODE_ENV !== 'production') {
          const localServiceAccountPath = path.join(process.cwd(), 'service-account.json');
          if (fs.existsSync(localServiceAccountPath)) {
            console.log('[Firebase Admin] Using local service-account.json');
            const serviceAccount = JSON.parse(fs.readFileSync(localServiceAccountPath, 'utf8'));
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });
          } else {
            try {
              admin.initializeApp();
              console.log('[Firebase Admin] Initialized with default credentials');
            } catch (e) {
              console.warn('[Firebase Admin] Default init failed');
            }
          }
        } else {
          console.error('[Firebase Admin] PRODUCTION: No service account credentials found!');
          console.error('[Firebase Admin] Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY env vars');
        }
      }
    } catch (error: any) {
      console.error('[Firebase Admin] Initialization error:', error.message);
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return;
      }
      try {
        if (!getApps().length) {
          admin.initializeApp();
        }
      } catch (e) {
        console.error('[Firebase Admin] Fallback init also failed');
      }
    }
  } else {
    console.log('[Firebase Admin] Already initialized');
  }

  _initialized = true;
}

// Lazy initialization - only initialize when actually accessed
function getAdminAuth(): admin.auth.Auth {
  if (!_adminAuth) {
    initializeFirebaseAdmin();
    // If still not initialized (build time), create a dummy that will fail gracefully
    if (!getApps().length) {
      // This should not happen at runtime, but handle it gracefully
      throw new Error('Firebase Admin not initialized. Please set FIREBASE_SERVICE_ACCOUNT environment variable.');
    }
    _adminAuth = admin.auth();
  }
  return _adminAuth;
}

function getAdminDb(): admin.firestore.Firestore {
  if (!_adminDb) {
    initializeFirebaseAdmin();
    // If still not initialized (build time), create a dummy that will fail gracefully
    if (!getApps().length) {
      // This should not happen at runtime, but handle it gracefully
      throw new Error('Firebase Admin not initialized. Please set FIREBASE_SERVICE_ACCOUNT environment variable.');
    }
    _adminDb = admin.firestore();
  }
  return _adminDb;
}

// Export with lazy initialization using getters
export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_target, prop) {
    const auth = getAdminAuth();
    const value = (auth as any)[prop];
    if (typeof value === 'function') {
      return value.bind(auth);
    }
    return value;
  }
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    const db = getAdminDb();
    const value = (db as any)[prop];
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  }
});

export default admin;
