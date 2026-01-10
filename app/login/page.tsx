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
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-left px-2"> {/* Changed to text-left to match image style usually, or center if preferred. Image shows left aligned 'Sign up' relative to form? Actually let's keep it clean centered or left. Let's go Left aligned title as per typical modern designs like the image seemed to imply, or centered if unsure. Image has "Sign up" big on top left of the form content? Let's stick to Centered for safety unless sure. Wait, image shows "Sign up" left aligned. Let's try Centered for symmetry with the centered form, but maybe text-left look better. Let's stick to existing center but update font size. */}
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <img src="https://img.icons8.com/nolan/64/reminders.png" alt="logo" className="w-8 h-8" />
              <span className="font-bold text-lg tracking-tight text-gray-700 dark:text-gray-200">DailyExpress</span>
            </div>
          </div>

          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight text-center">
            {isSignUp ? 'Sign up' : 'Login'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
            {isSignUp
              ? "Let's get you all set up so you can access your personal account."
              : 'Welcome back! Please enter your details.'}
          </p>
        </div>

        <div className="mt-8">
          {isSignUp ? <SignUpForm /> : <LoginForm />}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-purple-600 hover:text-purple-500 font-semibold hover:underline transition-all"
            >
              {isSignUp ? 'Login' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}





