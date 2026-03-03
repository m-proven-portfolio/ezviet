'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isNetworkError } from '@/lib/utils';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

export interface LrcContributorStats {
  total_points: number;
  level: number;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  onboarding_completed: boolean;
  lrc_stats: LrcContributorStats | null;
  subscription_tier: 'plus' | 'pro' | null;
  vip_expires_at: string | null;
}

export interface UseAuthReturn {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Profile cache to prevent unnecessary refetches
const profileCache = new Map<string, { profile: UserProfile; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const VISIBILITY_REFRESH_INTERVAL = 30 * 1000; // Min 30 seconds between visibility refreshes
let lastVisibilityRefresh = 0;

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);

  // Get singleton Supabase client
  const supabase = createClient();

  // Fetch user profile with caching and retry
  const fetchProfile = useCallback(async (userId: string, userMetadata?: Record<string, unknown>): Promise<UserProfile> => {
    // Check cache first
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[useAuth] Using cached profile for', userId);
      return cached.profile;
    }

    // Create fallback profile from user metadata (always available as last resort)
    const fallbackProfile: UserProfile = {
      id: userId,
      display_name: (userMetadata?.full_name as string) ?? (userMetadata?.name as string) ?? null,
      username: null,
      avatar_url: (userMetadata?.avatar_url as string) ?? (userMetadata?.picture as string) ?? null,
      is_admin: false,
      onboarding_completed: false,
      lrc_stats: null,
      subscription_tier: null,
      vip_expires_at: null,
    };

    // Fetch from database with retry
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        // Fetch profile and LRC contributor stats in parallel
        const [profileRes, lrcRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url, is_admin, onboarding_completed, subscription_tier, vip_expires_at')
            .eq('id', userId)
            .single(),
          supabase
            .from('lrc_contributors')
            .select('total_points, level')
            .eq('user_id', userId)
            .maybeSingle(),
        ]);

        const { data: profileData, error: profileError } = profileRes;
        const { data: lrcData } = lrcRes; // LRC data is optional, ignore errors

        if (profileError) {
          console.warn(`[useAuth] Profile fetch attempt ${attempts + 1} failed:`, profileError.message);
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500 * attempts));
            continue;
          }
          // All retries exhausted, use fallback
          console.log('[useAuth] Using fallback profile after retries:', fallbackProfile);
          return fallbackProfile;
        }

        if (profileData) {
          // Combine profile with LRC stats
          const fullProfile: UserProfile = {
            ...profileData,
            onboarding_completed: profileData.onboarding_completed ?? false,
            lrc_stats: lrcData ? { total_points: lrcData.total_points, level: lrcData.level } : null,
            subscription_tier: (profileData.subscription_tier as 'plus' | 'pro' | null) ?? null,
            vip_expires_at: profileData.vip_expires_at ?? null,
          };
          // Cache the profile
          profileCache.set(userId, { profile: fullProfile, timestamp: Date.now() });
          console.log('[useAuth] Profile fetched successfully:', fullProfile);
          return fullProfile;
        }

        // profileData is null but no error - shouldn't happen with .single(), but handle it
        console.warn('[useAuth] Profile data is null, using fallback');
        return fallbackProfile;
      } catch (err) {
        console.error(`[useAuth] Profile fetch error:`, err);
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempts));
        }
      }
    }

    // All retries exhausted due to exceptions, use fallback
    console.log('[useAuth] Using fallback profile after exceptions:', fallbackProfile);
    return fallbackProfile;
  }, [supabase]);

  // Update auth state - optimized for fast initial render
  const updateAuthState = useCallback(async (currentUser: User | null) => {
    if (!mountedRef.current) return;

    if (currentUser) {
      // FAST PATH: Set user and immediate profile from metadata (no DB round-trip)
      // This shows the avatar instantly using Google OAuth metadata
      const immediateProfile: UserProfile = {
        id: currentUser.id,
        display_name: (currentUser.user_metadata?.full_name as string) ?? (currentUser.user_metadata?.name as string) ?? null,
        username: null,
        avatar_url: (currentUser.user_metadata?.avatar_url as string) ?? (currentUser.user_metadata?.picture as string) ?? null,
        is_admin: false,
        onboarding_completed: false,
        lrc_stats: null,
        subscription_tier: null,
        vip_expires_at: null,
      };

      // Check cache - if we have a cached profile, use it immediately
      const cached = profileCache.get(currentUser.id);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setUser(currentUser);
        setProfile(cached.profile);
        return;
      }

      // Set immediate profile so UI can render instantly
      setUser(currentUser);
      setProfile(immediateProfile);

      // BACKGROUND: Fetch full profile from DB (has username, is_admin, etc.)
      // This upgrades the profile without blocking initial render
      fetchProfile(currentUser.id, currentUser.user_metadata).then(fullProfile => {
        if (mountedRef.current) {
          setProfile(fullProfile);
        }
      });
    } else {
      setUser(null);
      setProfile(null);
    }
  }, [fetchProfile]);

  // Refresh session - can be called manually or on visibility change
  const refreshSession = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      // getUser() validates the session against the Supabase server
      // This is the authoritative source of truth (not getSession())
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();

      if (error) {
        // Don't log network hiccups (device sleep, offline, etc.)
        if (!isNetworkError(error)) {
          console.warn('[useAuth] Session refresh warning:', error.message);
        }
        // Don't clear existing auth state on transient errors
        return;
      }

      // Only update if we got a valid response
      if (currentUser) {
        await updateAuthState(currentUser);
      }
    } catch (err) {
      if (!isNetworkError(err)) {
        console.error('[useAuth] Error refreshing session:', err);
      }
    }
  }, [supabase, updateAuthState]);

  // Initialize auth state
  useEffect(() => {
    mountedRef.current = true;

    // Prevent double initialization
    if (initializingRef.current) return;
    initializingRef.current = true;

    // Listen for auth state changes (sign in, sign out, token refresh)
    // IMPORTANT: We rely on INITIAL_SESSION event for initial state instead of
    // calling getUser() directly, because getUser() can race and return "session missing"
    // before Supabase has finished reading cookies
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('[useAuth] Auth state changed:', event, session?.user?.id ? 'user:' + session.user.id : 'no user');

        if (!mountedRef.current) return;

        // Handle specific events
        switch (event) {
          case 'INITIAL_SESSION':
            // This is the reliable way to get initial session - Supabase has finished
            // reading cookies by the time this fires
            await updateAuthState(session?.user ?? null);
            if (mountedRef.current) {
              setIsLoading(false);
              initializingRef.current = false;
            }
            break;

          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            await updateAuthState(session?.user ?? null);
            break;

          case 'SIGNED_OUT':
            setUser(null);
            setProfile(null);
            profileCache.clear();
            break;

          default:
            // For any other events, update state based on session
            await updateAuthState(session?.user ?? null);
        }
      }
    );

    // Safety timeout - if INITIAL_SESSION never fires (edge case), stop loading
    // Use initializingRef to check if we're still waiting (avoids stale closure)
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && initializingRef.current) {
        console.warn('[useAuth] INITIAL_SESSION timeout - forcing loading complete');
        setIsLoading(false);
        initializingRef.current = false;
      }
    }, 5000);

    // Refresh session when tab becomes visible again (debounced to reduce spam)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastVisibilityRefresh < VISIBILITY_REFRESH_INTERVAL) {
          // Skip refresh if we've refreshed recently
          return;
        }
        lastVisibilityRefresh = now;
        console.log('[useAuth] Tab became visible, refreshing session');
        refreshSession();
      }
    };

    // Listen for storage events (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      // Supabase stores auth in localStorage with keys starting with 'sb-'
      if (e.key?.startsWith('sb-') && e.key?.includes('auth')) {
        console.log('[useAuth] Auth storage changed in another tab');
        refreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [supabase, updateAuthState, refreshSession]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      profileCache.clear();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('[useAuth] Sign out error:', err);
    }
  }, [supabase]);

  return {
    user,
    profile,
    isLoading,
    isAdmin: profile?.is_admin ?? false,
    signOut,
    refreshSession,
  };
}
