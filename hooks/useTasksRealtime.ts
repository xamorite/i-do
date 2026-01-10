"use client";

import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    Timestamp,
    doc,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/lib/types';

/**
 * Hook for real-time task management.
 * Fetches all of a user's tasks and allows the UI to group/filter them.
 */
export function useTasksRealtime() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setTasks([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        // Keep local state for both queries to merge them
        let ownedTasks: Task[] = [];
        let partnerTasks: Task[] = [];

        const updateMergedTasks = () => {
            const merged = new Map<string, Task>();
            [...ownedTasks, ...partnerTasks].forEach(t => merged.set(t.id, t));

            // Sort by createdAt desc in memory
            const sorted = Array.from(merged.values()).sort((a, b) => {
                const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return tB - tA;
            });

            setTasks(sorted);
            setLoading(false);
        };

        const processSnapshot = (snapshot: any): Task[] => {
            return snapshot.docs.map((doc: any) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                } as Task;
            });
        };

        // 1. Fetch Requesting Tasks (Owned)
        const qOwned = query(
            collection(db, 'tasks'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubOwned = onSnapshot(qOwned, (snapshot) => {
            ownedTasks = processSnapshot(snapshot);
            updateMergedTasks();
        }, (err) => {
            console.error('[useTasksRealtime] Owned listener error:', err);
            setError(err.message);
            setLoading(false);
        });

        // 2. Fetch Partner Tasks (Assigned to me as accountability partner)
        // No orderBy to avoid complex index requirements; sorting is done in memory.
        const qPartner = query(
            collection(db, 'tasks'),
            where('accountabilityPartnerId', '==', user.uid)
        );

        const unsubPartner = onSnapshot(qPartner, (snapshot) => {
            partnerTasks = processSnapshot(snapshot);
            updateMergedTasks();
        }, (err) => {
            console.error('[useTasksRealtime] Partner listener error:', err);
            // We don't block the UI if this fails (e.g. missing index, which shouldn't happen for single field)
        });

        return () => {
            unsubOwned();
            unsubPartner();
        };
    }, [user]);

    const createTask = async (task: Partial<Task>) => {
        if (!user) throw new Error('Not authenticated');
        const newTask = {
            ...task,
            userId: user.uid,
            ownerId: user.uid,
            createdBy: user.uid,
            status: task.status || 'inbox',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'tasks'), newTask);
        return { id: docRef.id, ...newTask };
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        const taskRef = doc(db, 'tasks', id);
        await updateDoc(taskRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    };

    const deleteTask = async (id: string) => {
        const taskRef = doc(db, 'tasks', id);
        await deleteDoc(taskRef);
    };

    return {
        tasks,
        loading,
        error,
        createTask,
        updateTask,
        deleteTask
    };
}
