import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDK_GZMU3m0CoulUx9ztgYnjiFO7iyD26g",
  authDomain: "mopcare-2a00f.firebaseapp.com",
  projectId: "mopcare-2a00f",
  storageBucket: "mopcare-2a00f.firebasestorage.app",
  messagingSenderId: "955194586561",
  appId: "1:955194586561:web:c63a401bcba981757b6b40",
  measurementId: "G-8M20N7SHZG"
};

// Initialize Firebase app (singleton pattern)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export default app;


