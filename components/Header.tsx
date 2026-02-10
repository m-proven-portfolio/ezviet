'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Mic2, Tags, Store, Settings } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { UserMenu } from './UserMenu';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const { user, profile, isLoading, signOut } = useAuthContext();

  // Prevent hydration mismatch by only rendering auth UI after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine what to show in the auth section
  // We show loading skeleton if:
  // 1. Component hasn't mounted yet (SSR/hydration phase)
  // 2. Auth is still loading
  const showSkeleton = !mounted || isLoading;

  // Show user menu if we have both user and profile data
  const showUserMenu = !showSkeleton && user && profile;

  // Show login button only if:
  // 1. We're done loading (mounted and not isLoading)
  // 2. We definitively don't have a user
  const showLoginButton = !showSkeleton && !user;

  return (
    <header className="px-4 py-4 flex justify-between items-center max-w-4xl mx-auto">
      <Link href="/" className="hover:opacity-90 transition-opacity">
        <Logo size={36} />
      </Link>

      <nav className="flex items-center gap-2 sm:gap-4">
        {/* Desktop navigation - hidden on mobile (shown in BottomNav) */}
        <div className="hidden sm:flex items-center gap-4">
          {/* Market link */}
          <Link
            href="/market"
            className="p-2 rounded-full text-(--text-tertiary) hover:text-(--text-secondary) hover:bg-(--surface-elevated) transition-all"
            aria-label="Market"
          >
            <Store className="w-5 h-5" />
          </Link>

          {/* Picture Quiz link */}
          <Link
            href="/labels"
            className="p-2 rounded-full text-(--text-tertiary) hover:text-(--text-secondary) hover:bg-(--surface-elevated) transition-all"
            aria-label="Picture Quiz"
          >
            <Tags className="w-5 h-5" />
          </Link>

          {/* Karaoke Hero link */}
          <Link
            href="/karaoke"
            className="p-2 rounded-full text-(--text-tertiary) hover:text-(--text-secondary) hover:bg-(--surface-elevated) transition-all"
            aria-label="Karaoke"
          >
            <Mic2 className="w-5 h-5" />
          </Link>

          {/* Settings link */}
          <Link
            href="/settings"
            className="p-2 rounded-full text-(--text-tertiary) hover:text-(--text-secondary) hover:bg-(--surface-elevated) transition-all"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>

        {/* Auth Section - only render after mount to prevent hydration mismatch */}
        {showSkeleton ? (
          // Loading skeleton (shown during SSR and initial hydration)
          <div className="w-8 h-8 rounded-full bg-(--border-default) animate-pulse" />
        ) : showUserMenu ? (
          // Logged in - show notifications and user menu
          <>
            <NotificationBell />
            <UserMenu profile={profile} onSignOut={signOut} />
          </>
        ) : showLoginButton ? (
          // Not logged in - show Sign in link
          <Link
            href="/login"
            className="text-(--text-secondary) hover:text-foreground text-sm"
          >
            Sign in
          </Link>
        ) : (
          // Edge case: user exists but profile is still loading - show skeleton
          <div className="w-8 h-8 rounded-full bg-(--border-default) animate-pulse" />
        )}
      </nav>
    </header>
  );
}
