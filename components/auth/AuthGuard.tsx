"use client";

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRole,
  redirectTo = '/login',
}) => {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo);
        return;
      }

      if (requiredRole && userRole !== requiredRole) {
        // User doesn't have required role
        router.push('/');
        return;
      }
    }
  }, [user, userRole, loading, requiredRole, redirectTo, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (requiredRole && userRole !== requiredRole) {
    return null; // Will redirect
  }

  return <>{children}</>;
};





