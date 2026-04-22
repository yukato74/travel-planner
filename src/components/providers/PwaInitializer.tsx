'use client';

import { useEffect } from 'react';

export function PwaInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Ignore registration errors for non-supporting environments.
    });
  }, []);

  return null;
}
