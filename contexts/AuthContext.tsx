'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth, type UseAuthReturn } from '@/hooks/useAuth';

// Create context with undefined default (will throw if used outside provider)
const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();
  const pathname = usePathname();

  // Refresh session on route changes (client-side navigation)
  // This ensures session is validated when navigating between pages
  useEffect(() => {
    // Skip initial mount and only refresh on subsequent navigations
    // The initial session is already loaded by useAuth
    const isInitialLoad = auth.isLoading;
    if (!isInitialLoad && auth.user) {
      // Silently refresh session on navigation
      auth.refreshSession();
    }
  }, [pathname]); // Only depend on pathname to detect navigation

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuthContext(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
