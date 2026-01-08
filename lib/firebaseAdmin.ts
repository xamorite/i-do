import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import fs from 'fs';
import path from 'path';

let _adminAuth: admin.auth.Auth | null = null;
let _adminDb: admin.firestore.Firestore | null = null;
let _initialized = false;

function initializeFirebaseAdmin() {
  if (_initialized) return;
  
  // During Next.js build phase, skip initialization to avoid build errors
  // The app will be initialized at runtime when actually needed
  if (process.env.NEXT_PHASE === 'phase-production-build' || 
      (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    // Silently skip during build - will initialize at runtime
    _initialized = true;
    return;
  }
  
  if (!getApps().length) {
    try {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

      if (serviceAccountJson) {
        let sanitizedJson = serviceAccountJson;
        // Check if base64 encoded (starts with '{' in base64 is 'ew')
        if (!serviceAccountJson.trim().startsWith('{')) {
          try {
            sanitizedJson = Buffer.from(serviceAccountJson, 'base64').toString('utf8');
          } catch (e) {
            // ignore, assume raw json
          }
        }

        // Netlify/Vercel often mess up newlines in raw env vars, so we fix them manually
        sanitizedJson = sanitizedJson.replace(/\\n/g, '\n');
        const serviceAccount = JSON.parse(sanitizedJson);

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp();
      } else {
        // Check for local service-account.json (only in development)
        if (process.env.NODE_ENV !== 'production') {
          const localServiceAccountPath = path.join(process.cwd(), 'service-account.json');
          if (fs.existsSync(localServiceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(localServiceAccountPath, 'utf8'));
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });
          } else {
            // Try default initialization
            try {
              admin.initializeApp();
            } catch (e) {
              // Silently fail - will be initialized at runtime
            }
          }
        } else {
          // In production without credentials, skip initialization during build
          // Will be initialized at runtime when environment variables are available
        }
      }
    } catch (error: any) {
      // During build time, don't crash - will be initialized at runtime
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return;
      }
      // In runtime, try to initialize with default credentials
      try {
        if (!getApps().length) {
          admin.initializeApp();
        }
      } catch (e) {
        // If this fails, it will be retried on first use
      }
    }
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
