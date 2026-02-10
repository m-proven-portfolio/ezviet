'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/lib/supabase/auth';

export default function UnauthorizedPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      window.location.href = '/login';
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
        <Link href="/" className="text-2xl font-bold text-emerald-600">
          EZViet
        </Link>
        <nav className="flex gap-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">
            Learn
          </Link>
          <Link href="/about" className="text-gray-600 hover:text-gray-900 font-medium">
            About
          </Link>
        </nav>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 w-full max-w-md border border-gray-100 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h1>

          <p className="text-gray-600 mb-2">
            You&apos;re signed in as:
          </p>
          <p className="text-gray-900 font-medium mb-6">
            {email || 'Loading...'}
          </p>

          <p className="text-gray-600 mb-8">
            This account is not authorized to access the admin area. Contact the site administrator if you believe this is an error.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Signing out...' : 'Sign out'}
            </button>

            <Link
              href="/"
              className="w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-center"
            >
              Go to homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
