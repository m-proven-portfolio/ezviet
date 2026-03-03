import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cookie max age: 365 days in seconds
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

// Base URL the browser can reach. Use request origin when it's already local (localhost or
// 127.0.0.1) so both work without config. Otherwise use NEXT_PUBLIC_APP_URL when the app
// runs in a container and request has an unreachable hostname (e.g. container hostname).
function getBaseUrl(requestOrigin: string): string {
  try {
    const hostname = new URL(requestOrigin).hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return requestOrigin;
  } catch {
    // invalid origin, fall through
  }
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || requestOrigin;
}

export async function GET(request: Request) {
  console.log('[auth/callback] === AUTH CALLBACK STARTED ===');
  const { searchParams, origin } = new URL(request.url);
  const baseUrl = getBaseUrl(origin);
  const code = searchParams.get('code');
  const error_description = searchParams.get('error_description');
  const redirectTo = searchParams.get('redirectTo') || '/';
  console.log('[auth/callback] Params:', { hasCode: !!code, error_description, redirectTo, baseUrl });

  // If Supabase returned an error, show it
  if (error_description) {
    console.error('OAuth error from Supabase:', error_description);
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error_description)}`);
  }

  if (code) {
    const cookieStore = await cookies();

    // Track cookies that need to be set on the response
    const cookiesToSetOnResponse: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const allCookies = cookieStore.getAll();
            // Debug: Log all cookies to see what's available
            const verifierCookies = allCookies.filter(c => c.name.includes('verifier') || c.name.includes('code'));
            if (verifierCookies.length > 0) {
              console.log('[auth/callback] Found verifier-related cookies:', verifierCookies.map(c => c.name));
            } else {
              console.log('[auth/callback] No verifier cookies found. All cookies:', allCookies.map(c => c.name));
            }
            return allCookies;
          },
          setAll(cookiesToSet) {
            // Store cookies to set on response later
            cookiesToSet.forEach(({ name, value, options }) => {
              cookiesToSetOnResponse.push({ name, value, options });
              // Also try to set via cookieStore (may work in some contexts)
              try {
                cookieStore.set(name, value, { ...options, maxAge: COOKIE_MAX_AGE });
              } catch {
                // Will set on response instead
              }
            });
          },
        },
      }
    );

    // Helper to create redirect with cookies
    const redirectWithCookies = (url: string) => {
      console.log('[auth/callback] redirectWithCookies called:', {
        url,
        cookieCount: cookiesToSetOnResponse.length,
        cookieNames: cookiesToSetOnResponse.map(c => c.name)
      });
      const response = NextResponse.redirect(url);
      cookiesToSetOnResponse.forEach(({ name, value, options }) => {
        console.log('[auth/callback] Setting cookie:', name);
        response.cookies.set(name, value, {
          ...options,
          maxAge: COOKIE_MAX_AGE,
        } as Record<string, unknown>);
      });
      console.log('[auth/callback] Response cookies set, redirecting to:', url);
      return response;
    };

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    console.log('[auth/callback] exchangeCodeForSession completed', {
      error: error?.message,
      cookiesQueued: cookiesToSetOnResponse.length,
      cookieNames: cookiesToSetOnResponse.map(c => c.name),
    });

    if (error) {
      console.error('Code exchange error:', error.message);
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error.message)}`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    console.log('[auth/callback] getUser result:', { userId: user?.id, hasUser: !!user });

    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login?error=no_user`);
    }

    // Check if user has completed onboarding
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed, is_admin')
      .eq('id', user.id)
      .single();

    console.log('[auth/callback] Profile query:', {
      hasProfile: !!profile,
      profileError: profileError?.message,
      onboardingCompleted: profile?.onboarding_completed,
      isAdmin: profile?.is_admin
    });

    // If no profile or onboarding not completed, redirect to onboarding
    // Use redirectWithCookies to ensure session cookies are set
    if (!profile || !profile.onboarding_completed) {
      const onboardingUrl = new URL('/onboarding', baseUrl);
      onboardingUrl.searchParams.set('redirectTo', redirectTo);
      return redirectWithCookies(onboardingUrl.toString());
    }

    // Check if trying to access admin and verify admin status
    if (redirectTo.startsWith('/admin')) {
      if (profile.is_admin !== true) {
        return redirectWithCookies(`${baseUrl}/unauthorized`);
      }
    }

    // User is authenticated and onboarded, redirect to destination
    return redirectWithCookies(`${baseUrl}${redirectTo}`);
  }

  // No code provided
  return NextResponse.redirect(`${baseUrl}/login?error=no_code`);
}
