import { auth } from './firebase';

export async function getIdTokenHeader(): Promise<Record<string, string>> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('[getIdTokenHeader] No authenticated user');
      return {};
    }

    // Force refresh to ensure token is valid (handles expiration)
    const token = await user.getIdToken(true);

    if (!token) {
      console.error('[getIdTokenHeader] Failed to get token');
      return {};
    }

    return { Authorization: `Bearer ${token}` };
  } catch (err) {
    console.error('[getIdTokenHeader] Error getting token:', err);
    return {};
  }
}
