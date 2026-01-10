"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

import { TermsModal } from './TermsModal';

import { InputField } from './InputField';

export const SignUpForm: React.FC = () => {
  // ... state ...
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { signUp, signInWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard when auth is fully loaded
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!displayName.trim()) {
      setError('Display Name is required');
      return;
    }

    if (!username.trim() || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-z0-9]+$/i.test(username)) {
      setError('Username can only contain letters and numbers');
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms and Privacy Policies');
      return;
    }

    setIsAuthenticating(true);

    try {
      await signUp(email, password, displayName, username.toLowerCase().trim());
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setIsAuthenticating(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsAuthenticating(true);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Row 1: Display Name */}
        <InputField
          label="Display Name"
          value={displayName}
          onChange={(e: any) => setDisplayName(e.target.value)}
          placeholder="John Doe"
          required
        />

        {/* Row 2: Username */}
        <div className="relative group">
          <label className="absolute -top-2.5 left-3 bg-white dark:bg-neutral-900 px-1 text-xs font-semibold text-gray-700 dark:text-gray-300 z-10 transition-colors">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-bold select-none">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
              required
              className="w-full pl-9 pr-4 py-3 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all outline-none"
              placeholder="johndoe"
            />
          </div>
        </div>


        {/* Row 3: Email */}
        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
          placeholder="john.doe@gmail.com"
          required
        />

        {/* Row 4: Password */}
        <InputField
          label="Password"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
          placeholder="••••••••••••••••"
          required
          showPasswordToggle
          isPasswordVisible={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />

        {/* Row 5: Confirm Password */}
        <InputField
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e: any) => setConfirmPassword(e.target.value)}
          placeholder="••••••••••••••••"
          required
          showPasswordToggle
          isPasswordVisible={showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
        />

        {/* Terms Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-600 transition-all cursor-pointer"
          />
          <label htmlFor="terms" className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none cursor-pointer">
            I agree to all the <button type="button" onClick={() => setShowTerms(true)} className="text-purple-600 hover:underline">Terms</button> and <button type="button" onClick={() => setShowTerms(true)} className="text-purple-600 hover:underline">Privacy Policies</button>
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isAuthenticating || loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 px-4 rounded-xl font-semibold focus:outline-none focus:ring-4 focus:ring-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 active:scale-[0.99]"
        >
          {(isAuthenticating || loading) ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-900/0 text-gray-500 dark:text-gray-400 font-medium bg-[#FAF9F6]">Or Sign up with</span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center h-12 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-750 transition-all gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

