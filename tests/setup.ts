import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
    }),
    useSearchParams: () => ({
        get: vi.fn(),
    }),
    usePathname: () => '',
}));

// Mock Firebase
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({ name: 'mock-app' })),
    getApps: vi.fn(() => [{ name: 'mock-app' }]),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    GoogleAuthProvider: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({ type: 'firestore' })),
    initializeFirestore: vi.fn(() => ({ type: 'firestore' })),
    persistentLocalCache: vi.fn((config: any) => ({ type: 'cache', config })),
    persistentMultipleTabManager: vi.fn(() => ({ type: 'tab-manager' })),
    collection: vi.fn(() => ({ id: 'mock-collection' })),
    doc: vi.fn(() => ({ id: 'mock-doc' })),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn((q, cb) => {
        return () => { };
    }),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    orderBy: vi.fn(),
    serverTimestamp: vi.fn(() => 'mock-timestamp'),
    Timestamp: vi.fn().mockImplementation(() => ({
        toDate: () => new Date(),
    })),
}));
