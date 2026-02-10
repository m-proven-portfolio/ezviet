'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useThemePreferences } from '@/hooks/useThemePreferences';
import type { ThemePreferences, ThemeMode, ThemeStyle } from '@/lib/theme-preferences';

interface ThemeContextValue {
  preferences: ThemePreferences;
  resolvedTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  setStyle: (style: ThemeStyle) => void;
  setAllPreferences: (prefs: ThemePreferences) => void;
  toggleTheme: () => void;
  hasMounted: boolean;
  isDark: boolean;
}

// Create context with undefined default (will throw if used outside provider)
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemePreferences();

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
