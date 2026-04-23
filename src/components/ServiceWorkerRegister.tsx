'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) return;
      } catch {
        // Capacitor not available — proceed with web registration.
      }

      if (cancelled) return;

      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch {
        // Registration failures are non-fatal; the app still works online.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
