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

        // Fetch all tasks for the user. 
        // In a production app with thousands of tasks, you'd add a date range here.
        const q = query(
            collection(db, 'tasks'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const taskList: Task[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                taskList.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                } as Task);
            });
            setTasks(taskList);
            setLoading(false);
        }, (err) => {
            console.error('[useTasksRealtime] Listener error:', err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
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
