"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { PartnerRelationship } from '@/lib/types';

export function usePartnersRealtime() {
    const { user } = useAuth();
    const [partners, setPartners] = useState<PartnerRelationship[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setPartners([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        // Queries for relationships where user is requester OR recipient
        // Note: Firestore OR queries can be tricky, so we might need two listeners or one compound query if indexes allow.
        // Simpler approach: Two listeners, merge unique results.

        const partnersRef = collection(db, 'partners');

        // Listener 1: User is Requester
        const q1 = query(partnersRef, where('requesterId', '==', user.uid));

        // Listener 2: User is Recipient
        const q2 = query(partnersRef, where('recipientId', '==', user.uid));

        const unsubscribe1 = onSnapshot(q1, (snapshot) => {
            const items1 = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PartnerRelationship));

            // Update state by merging with current q2 results (which we define in scope)
            // Actually, cleaner to manage two separate state buckets and merge them.
            // But inside this callback, we only know about q1 updates.
            // Let's us a refs or simply two independent states in the hook?
            // Better: Two listeners updating a single map to avoid duplicates?
            // React state updates might be frequent. Let's do two separate internal states.
        });

        // Re-thinking: Managing two listeners and merging is creating complexity.
        // Let's use a simpler approach: Just two states.

        return () => {
            // Cleanup will be handled below
        }
    }, [user]);

    // Refined implementation below:
    const [asRequester, setAsRequester] = useState<PartnerRelationship[]>([]);
    const [asRecipient, setAsRecipient] = useState<PartnerRelationship[]>([]);

    useEffect(() => {
        if (!user) {
            setAsRequester([]);
            setAsRecipient([]);
            setLoading(false);
            return;
        }

        const partnersRef = collection(db, 'partners');
        const q1 = query(partnersRef, where('requesterId', '==', user.uid));
        const q2 = query(partnersRef, where('recipientId', '==', user.uid));

        const unsub1 = onSnapshot(q1, (snap) => {
            setAsRequester(snap.docs.map(d => ({ id: d.id, ...d.data() } as PartnerRelationship)));
        });

        const unsub2 = onSnapshot(q2, (snap) => {
            setAsRecipient(snap.docs.map(d => ({ id: d.id, ...d.data() } as PartnerRelationship)));
            setLoading(false); // Assume initial load done when at least one returns (or just set false immediately after setting listeners)
        });

        return () => {
            unsub1();
            unsub2();
        };
    }, [user]);

    // Combined list
    const allPartners = [...asRequester, ...asRecipient];
    // Filter out duplicates just in case (though logic shouldn't allow same requester/recipient pair twice)
    const uniquePartners = Array.from(new Map(allPartners.map(p => [p.id, p])).values());

    const sendRequest = async (recipientUsername: string) => {
        if (!user) throw new Error('Not authenticated');

        // 1. Resolve username to UID via API
        const res = await fetch('/api/partners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await user.getIdToken()}` },
            body: JSON.stringify({ recipientUsername })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to send request');
        }
    };

    const updateStatus = async (partnerId: string, status: 'active' | 'declined' | 'blocked') => {
        if (!user) return;
        await updateDoc(doc(db, 'partners', partnerId), {
            status,
            updatedAt: new Date().toISOString()
        });
    };

    const cancelRequest = async (partnerId: string) => {
        // Allow deleting if pending
        await deleteDoc(doc(db, 'partners', partnerId));
    }

    return {
        partners: uniquePartners,
        loading,
        sendRequest,
        acceptRequest: (id: string) => updateStatus(id, 'active'),
        declineRequest: (id: string) => updateStatus(id, 'declined'),
        cancelRequest
    };
}
