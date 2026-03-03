import { createClient } from './client';

// Initiate Google OAuth sign-in (client-side). Redirects to Google when Supabase returns the OAuth URL.
export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }
  if (data?.url) {
    window.location.href = data.url;
  }
}

// Sign out the current user (client-side)
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
