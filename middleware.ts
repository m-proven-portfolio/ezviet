import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// UUID regex pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Cookie max age: 365 days in seconds
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

// Check if user is admin by querying the database
async function isAdminUser(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  return profile?.is_admin === true;
}

// Check if user is moderator or admin by querying the database
async function isModeratorOrAdmin(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_moderator')
    .eq('id', userId)
    .single();

  return profile?.is_admin === true || profile?.is_moderator === true;
}

// Create Supabase client for middleware (handles session refresh)
function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            // Extend cookie expiry to 365 days
            response.cookies.set(name, value, {
              ...options,
              maxAge: COOKIE_MAX_AGE,
            })
          );
        },
      },
    }
  );

  return { supabase, response };
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hasOAuthCallbackParams =
    searchParams.has('code') &&
    searchParams.has('state');

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // CRITICAL: Skip middleware for auth callback routes entirely
  // The OAuth flow stores PKCE code_verifier in cookies during sign-in initiation.
  // If we call getUser() or touch cookies before the callback route processes
  // the OAuth code exchange, we corrupt the state and get "bad_oauth_state" error.
  if (pathname.startsWith('/auth/') || hasOAuthCallbackParams) {
    return NextResponse.next();
  }

  // Always refresh session on every request to keep user logged in
  // This is the Supabase recommended approach for session persistence
  const { supabase, response } = createMiddlewareClient(request);

  // Refresh the session - this ensures cookies are updated on every request
  await supabase.auth.getUser();

  // Profile URL handling: /@username → /profile/username (internal rewrite)
  if (pathname.startsWith('/@')) {
    const username = pathname.slice(2); // Remove the /@
    if (username && !username.includes('/')) {
      // Rewrite to internal profile path (URL stays as /@username)
      const rewriteResponse = NextResponse.rewrite(new URL(`/profile/${username}`, request.url));
      // Copy session cookies to the rewrite response
      response.cookies.getAll().forEach(cookie => {
        rewriteResponse.cookies.set(cookie.name, cookie.value, {
          maxAge: COOKIE_MAX_AGE,
        });
      });
      return rewriteResponse;
    }
  }

  // Redirect old /u/username URLs to /@username
  if (pathname.startsWith('/u/')) {
    const username = pathname.slice(3); // Remove the /u/
    if (username && !username.includes('/')) {
      const redirectResponse = NextResponse.redirect(new URL(`/@${username}`, request.url), 301);
      // Copy session cookies to the redirect response
      response.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, {
          maxAge: COOKIE_MAX_AGE,
        });
      });
      return redirectResponse;
    }
  }

  // Redirect /profile/username to /@username (don't expose internal route)
  if (pathname.startsWith('/profile/')) {
    const username = pathname.slice(9); // Remove the /profile/
    if (username && !username.includes('/')) {
      const redirectResponse = NextResponse.redirect(new URL(`/@${username}`, request.url), 301);
      // Copy session cookies to the redirect response
      response.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, {
          maxAge: COOKIE_MAX_AGE,
        });
      });
      return redirectResponse;
    }
  }

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    const { data: { user } } = await supabase.auth.getUser();

    // Not logged in - redirect to login
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Logged in but not admin - redirect to unauthorized
    const isAdmin = await isAdminUser(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // User is authenticated and is admin - allow access
    return response;
  }

  // Moderator route protection
  if (pathname.startsWith('/moderator')) {
    const { data: { user } } = await supabase.auth.getUser();

    // Not logged in - redirect to login
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Logged in but not moderator/admin - redirect to unauthorized
    const isMod = await isModeratorOrAdmin(supabase, user.id);
    if (!isMod) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // User is authenticated and is moderator/admin - allow access
    return response;
  }

  // Classroom route protection (must be logged in)
  if (pathname.startsWith('/classroom')) {
    const { data: { user } } = await supabase.auth.getUser();

    // Not logged in - redirect to login
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated - allow access (API handles authorization)
    return response;
  }

  // Check if this is a song page URL with a UUID
  const songUrlMatch = pathname.match(/^\/learn\/([^/]+)\/songs\/([^/]+)$/);

  if (songUrlMatch) {
    const [, cardSlug, songIdOrSlug] = songUrlMatch;

    // If it looks like a UUID, redirect to the slug-based URL
    if (UUID_PATTERN.test(songIdOrSlug)) {
      try {
        // Look up the song by ID to get its slug
        const { data: song } = await supabase
          .from('card_songs')
          .select('slug')
          .eq('id', songIdOrSlug)
          .single();

        if (song?.slug) {
          // 301 permanent redirect to the new slug-based URL
          const newUrl = new URL(`/learn/${cardSlug}/songs/${song.slug}`, request.url);
          return NextResponse.redirect(newUrl, 301);
        }
      } catch {
        // If lookup fails, let the page handle the 404
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
