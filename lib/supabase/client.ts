import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Cookie max age: 365 days in seconds (matches server-side)
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

// Singleton instance - ensures consistent auth state across the entire app
let supabaseClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  // Return existing instance if available (singleton pattern)
  if (supabaseClient) {
    return supabaseClient;
  }

  // Create new instance with cookie storage (must match server-side configuration)
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Guard: Only access document in browser environment
          if (typeof document === 'undefined') {
            return [];
          }
          // Parse all cookies from document.cookie
          return document.cookie.split('; ').map(cookie => {
            const [name, ...rest] = cookie.split('=');
            return { name, value: rest.join('=') };
          }).filter(c => c.name); // Filter out empty cookies
        },
        setAll(cookiesToSet) {
          // Guard: Only set cookies in browser environment
          if (typeof document === 'undefined' || typeof window === 'undefined') {
            return;
          }
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set cookie with explicit attributes
            // For localhost development, we need SameSite=Lax (not None) and no secure flag
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            // Debug: Log PKCE code verifier cookies
            if (name.includes('code-verifier') || name.includes('verifier')) {
              console.log('[Supabase Client] Setting PKCE cookie:', name, 'value length:', value?.length);
            }
            
            const cookieOptions = [
              `${name}=${value}`,
              'path=/',
              `max-age=${options?.maxAge || COOKIE_MAX_AGE}`,
              options?.domain && `domain=${options.domain}`,
              // Use Lax for localhost, otherwise use provided sameSite or default to Lax
              `samesite=${isLocalhost ? 'Lax' : (options?.sameSite || 'Lax')}`,
              // Only set secure flag for HTTPS (not localhost)
              !isLocalhost && window.location.protocol === 'https:' && 'secure',
            ].filter(Boolean).join('; ');
            
            document.cookie = cookieOptions;
            
            // Verify cookie was set
            if (name.includes('code-verifier') || name.includes('verifier')) {
              const verifyCookie = document.cookie.split('; ').find(c => c.startsWith(name + '='));
              console.log('[Supabase Client] Cookie verification:', verifyCookie ? 'SET' : 'NOT SET', name);
            }
          });
        },
      },
    }
  );

  return supabaseClient;
}

// Get the singleton instance (alias for clarity)
export function getSupabaseClient(): SupabaseClient {
  return createClient();
}
