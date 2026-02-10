'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Handles OAuth codes that land on the wrong page.
 *
 * Sometimes Supabase redirects to the site root (/) instead of /auth/callback
 * due to redirect URL configuration issues. This component catches those cases
 * and redirects to the proper callback route to complete the OAuth flow.
 */
export function AuthCodeHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');

    // If there's an OAuth code in the URL and we're not on the callback page,
    // redirect to the callback to properly exchange it for a session
    if (code && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;

      // Only redirect if we're NOT already on the auth callback
      if (!currentPath.startsWith('/auth/')) {
        console.log('[AuthCodeHandler] Found OAuth code on wrong page, redirecting to callback');

        // Preserve any other query params (like error, error_description)
        const params = new URLSearchParams(searchParams.toString());

        // IMPORTANT: Use window.location.href for direct navigation, NOT router.replace()
        // The /auth/callback is a Route Handler (route.ts), not a page (page.tsx).
        // Client-side router navigation doesn't work for Route Handlers - it causes
        // the app to freeze because Next.js tries to render a non-existent page.
        window.location.href = `/auth/callback?${params.toString()}`;
      }
    }
  }, [searchParams]);

  return null; // This component renders nothing
}
