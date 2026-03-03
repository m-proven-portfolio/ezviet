'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { signInWithGoogle } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get('redirectTo') || '/';
  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (errorParam === 'unauthorized') {
      setError('Your account is not authorized to access the admin area.');
    }
  }, [errorParam]);

  // Check if already logged in (time-boxed so slow Supabase doesn't block the form)
  useEffect(() => {
    let cancelled = false;
    const timeoutMs = 4000;
    const checkSession = async () => {
      const supabase = createClient();
      const userPromise = supabase.auth.getUser().then(({ data: { user } }) => user);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
      const user = await Promise.race([userPromise, timeoutPromise]);
      if (!cancelled && user) router.push(redirectTo);
    };
    checkSession();
    return () => { cancelled = true; };
  }, [router, redirectTo]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    // Use NEXT_PUBLIC_APP_URL when set (e.g. Podman) so Supabase redirects to a URL the browser can reach
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || window.location.origin;
    try {
      await signInWithGoogle(`${baseUrl}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Simple Header - centered logo */}
      <header className="px-4 py-6 flex justify-center items-center w-full">
        <Link href="/" className="text-4xl font-bold text-(--interactive)">
          EZViet
        </Link>
      </header>

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="bg-(--surface-card) rounded-3xl shadow-xl p-8 sm:p-12 w-full max-w-md border border-(--border-default)">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🇻🇳</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Start Learning Vietnamese</h1>
            <p className="text-(--text-tertiary) text-sm">
              Track your progress and pick up where you left off
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-(--feedback-error-subtle) border border-(--feedback-error) rounded-xl text-(--feedback-error) text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-(--surface-card) border-2 border-(--border-default) rounded-xl text-foreground font-semibold hover:bg-(--surface-elevated) hover:border-(--border-strong) transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <p className="mt-8 text-center text-xs text-(--text-disabled)">
            Free forever. Your progress syncs across devices.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-(--interactive) border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
