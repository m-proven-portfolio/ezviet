import { createClient } from './client';

// Initiate Google OAuth sign-in (client-side)
export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw error;
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
