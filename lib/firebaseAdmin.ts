import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import fs from 'fs';
import path from 'path';

if (!getApps().length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson) {
      console.log('Initialize Firebase Admin with FIREBASE_SERVICE_ACCOUNT variable');
      // Netlify/Vercel often mess up newlines in env vars, so we fix them manually
      // We check if it contains actual newline characters or literal "\n" string
      const sanitizedJson = serviceAccountJson.replace(/\\n/g, '\n');
      const serviceAccount = JSON.parse(sanitizedJson);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Initialize Firebase Admin with GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
      admin.initializeApp();
    } else {
      // Check for local service-account.json
      const localServiceAccountPath = path.join(process.cwd(), 'service-account.json');
      if (fs.existsSync(localServiceAccountPath)) {
        console.log('Initialize Firebase Admin with local service-account.json');
        const serviceAccount = JSON.parse(fs.readFileSync(localServiceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        console.log('Attempting Firebase Admin with ADC (Application Default Credentials)...');
        admin.initializeApp();
      }
    }
  } catch (error: any) {
    console.error('Firebase Admin Initialization Error:', error);
    // Ensure we initialize a default app even if credentials fail,
    // so that admin.auth() and admin.firestore() calls below don't crash the build immediately.
    // Use try-catch here just in case customized logic fails again.
    try {
      if (!getApps().length) {
        admin.initializeApp();
      }
    } catch (e) {
      console.error('Failed to initialize fallback Firebase Admin app', e);
    }
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;
