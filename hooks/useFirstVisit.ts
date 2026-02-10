'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'ezviet_first_visit_complete';

// Subscribe to storage changes (for cross-tab sync)
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

// Get the current state from localStorage
function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}

// Server snapshot - always false (no hints during SSR)
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Hook to track first-time visitors.
 * Returns isFirstVisit (true if user has never interacted)
 * and markComplete() to dismiss first-visit hints.
 *
 * Uses useSyncExternalStore for proper hydration handling.
 */
export function useFirstVisit() {
  const isFirstVisit = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  // Mark first visit as complete
  const markComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    // Trigger re-render by dispatching storage event
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  }, []);

  return {
    isFirstVisit,
    markComplete,
  };
}
