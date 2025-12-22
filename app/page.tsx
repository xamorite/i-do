"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [mounted, user, loading, router]);

  // Always show loading on initial render to prevent hydration mismatch
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-neutral-950">
        <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">Loading...</div>
      </div>
    );
  }

  // This will rarely be seen as the useEffect will redirect
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-neutral-950">
      <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">Redirecting...</div>
    </div>
  );
}