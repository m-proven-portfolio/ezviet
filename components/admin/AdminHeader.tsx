'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/UserMenu';

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { user, profile, isLoading, signOut } = useAuthContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showSkeleton = !mounted || isLoading;
  const showUserMenu = !showSkeleton && user && profile;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-40">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Spacer for desktop - pushes avatar to right */}
      <div className="hidden lg:block" />

      {/* Avatar Menu */}
      <div className="flex items-center">
        {showSkeleton ? (
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        ) : showUserMenu ? (
          <UserMenu profile={profile} onSignOut={signOut} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200" />
        )}
      </div>
    </header>
  );
}
