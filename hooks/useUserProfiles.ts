"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface PublicProfile {
    uid: string;
    displayName: string;
    photoURL?: string;
    username?: string;
}

/**
 * Hook to manage real-time user profiles for a set of UIDs.
 * This ensures we have avatars and names for partners/owners on TaskCards.
 */
export function useUserProfiles(uids: string[]) {
    const [profiles, setProfiles] = useState<Record<string, PublicProfile>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const uniqueUids = Array.from(new Set(uids.filter(id => !!id)));
        if (uniqueUids.length === 0) {
            setProfiles({});
            return;
        }

        setLoading(true);

        const unsubscribes = uniqueUids.map(uid => {
            const userRef = doc(db, 'users', uid);
            return onSnapshot(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setProfiles(prev => ({
                        ...prev,
                        [uid]: {
                            uid,
                            displayName: data.displayName || data.username || 'User',
                            photoURL: data.photoURL || '',
                            username: data.username || '',
                        }
                    }));
                }
            }, (err) => {
                console.error(`Error fetching profile for ${uid}:`, err);
            });
        });

        setLoading(false);

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [JSON.stringify(uids)]);

    return { profiles, loading };
}
