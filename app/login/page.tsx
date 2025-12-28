"use client";

import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { Calendar } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  // Explicitly handle redirect at the top level
  React.useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <img
              src="https://img.icons8.com/nolan/64/reminders.png"
              alt="Task Manager Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp
              ? 'Join us to manage your schedule'
              : 'Welcome back! Please sign in to continue'}
          </p>
        </div>

        <div className="mt-8">
          {isSignUp ? <SignUpForm /> : <LoginForm />}
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-purple-600 hover:text-purple-500 text-sm font-medium"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}





