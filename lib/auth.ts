import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  linkWithPopup,
  User as FirebaseUser,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserRole, User } from './types';

// Create user document in Firestore with default role
const createUserDocument = async (user: FirebaseUser, displayName?: string): Promise<void> => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Create new user document with default 'user' role
    await setDoc(userRef, {
      email: user.email,
      displayName: displayName || user.displayName || '',
      role: 'user' as UserRole,
      createdAt: serverTimestamp(),
    });
  }
};

// Helper to parsing Firebase Auth errors
const getAuthErrorMessage = (error: any): string => {
  const code = error.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email is already registered. Please sign in instead.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled.';
    default:
      return error.message || 'An authentication error occurred.';
  }
};

// Sign up with email and password
export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<void> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await createUserDocument(userCredential.user, displayName);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error));
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<void> => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error));
  }
};

// Sign in with Google (Redirect Mode to avoid COOP blocks)
export const signInWithGoogle = async (): Promise<void> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar');
    provider.addScope('https://www.googleapis.com/auth/tasks.readonly');
    provider.setCustomParameters({
      access_type: 'offline',
      prompt: 'consent',
    });
    // Using redirect instead of popup to avoid Cross-Origin-Opener-Policy issues
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error));
  }
};

// Handle redirect result (call this in your AuthContext or Login page on mount)
export const handleGoogleRedirect = async (): Promise<void> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      await syncUserAccount(result.user);

      // Auto-integrate Google Calendar if credential exists
      const credential = GoogleAuthProvider.credentialFromResult(result);
      // Try to extract refresh token from internal properties if available
      const tokenResponse = (result as any)._tokenResponse;

      if (credential) {
        try {
          const token = await result.user.getIdToken();
          await fetch('/api/integrations/google/auto', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              credential,
              refreshToken: tokenResponse?.refreshToken
            })
          });
        } catch (err) {
          console.error('Failed to auto-integrate Google Calendar:', err);
        }
      }
    }
  } catch (error: any) {
    console.error('Error handling Google redirect:', error);
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChanged = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

// Get user role from Firestore
export const getUserRole = async (userId: string): Promise<UserRole> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return (userData.role as UserRole) || 'user';
    }

    // Default to 'user' if document doesn't exist
    return 'user';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'user';
  }
};

// Set user role (Admin only - should be protected on backend)
export const setUserRole = async (userId: string, role: UserRole): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { role }, { merge: true });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update user role');
  }
};

// Get full user data including role
export const getUserData = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        uid: userId,
        email: data.email,
        displayName: data.displayName,
        role: (data.role as UserRole) || 'user',
        createdAt: data.createdAt?.toDate(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};


// Sync user profile data to Firestore
export const syncUserAccount = async (user: FirebaseUser): Promise<void> => {
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// Link Google Account
export const linkWithGoogleAccount = async (): Promise<void> => {
  if (!auth.currentUser) throw new Error('No user signed in');
  try {
    const provider = new GoogleAuthProvider();
    const result = await linkWithPopup(auth.currentUser, provider);
    await syncUserAccount(result.user);
    // Force refresh the user token/state
    await result.user.getIdToken(true);
  } catch (error: any) {
    if (error.code === 'auth/credential-already-in-use') {
      throw new Error('This Google account is already linked to another user.');
    }
    throw new Error(getAuthErrorMessage(error));
  }
};

