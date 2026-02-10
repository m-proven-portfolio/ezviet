'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Store, Tags, Mic2, User } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/market', icon: Store, label: 'Market' },
  { href: '/labels', icon: Tags, label: 'Quiz' },
  { href: '/karaoke', icon: Mic2, label: 'Karaoke' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, profile } = useAuthContext();

  // Don't show bottom nav on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname.startsWith('/learn/');
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const profileHref = profile?.username ? `/@${profile.username}` : '/login';
  const isProfileActive = pathname.startsWith('/@') || pathname === '/login' || pathname === '/settings';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-(--surface-card) border-t border-(--border-default) sm:hidden z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active
                  ? 'text-emerald-600'
                  : 'text-(--text-tertiary) active:text-(--text-secondary)'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{label}</span>
            </Link>
          );
        })}

        {/* Profile/Login */}
        <Link
          href={profileHref}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isProfileActive
              ? 'text-emerald-600'
              : 'text-(--text-tertiary) active:text-(--text-secondary)'
          }`}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className={`w-6 h-6 rounded-full object-cover ${
                isProfileActive ? 'ring-2 ring-emerald-500' : ''
              }`}
            />
          ) : (
            <User className="w-5 h-5" strokeWidth={isProfileActive ? 2.5 : 2} />
          )}
          <span className="text-[10px] mt-1 font-medium">
            {user ? 'Profile' : 'Login'}
          </span>
        </Link>
      </div>
    </nav>
  );
}
