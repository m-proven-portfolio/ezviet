'use client';

import { useEffect } from 'react';

const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/7289c88e-7538-4ad4-81fe-c274a1e6ac68';

/**
 * Logs unhandled promise rejections (e.g. "Load failed") to debug endpoint
 * so we can identify which fetch or dynamic import failed.
 * Remove after debugging.
 */
export function LoadFailedDebug() {
  useEffect(() => {
    // #region agent log
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = reason?.message ?? String(reason);
      if (msg.includes('Load failed') || msg.includes('Failed to fetch') || msg.includes('Importing a module script failed')) {
        fetch(DEBUG_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'LoadFailedDebug.tsx:unhandledrejection',
            message: 'Load failed source',
            data: { errorMessage: msg, stack: reason?.stack ?? null },
            timestamp: Date.now(),
            hypothesisId: 'load_failed_source',
          }),
        }).catch(() => {});
      }
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
    // #endregion
  }, []);
  return null;
}
