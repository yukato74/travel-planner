'use client';

import { useEffect } from 'react';

function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // iOS Safari exposes standalone mode via navigator.standalone.
  return Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export function PwaInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const standalone = isStandaloneDisplayMode();
    document.documentElement.dataset.standalone = standalone ? 'true' : 'false';

    if (!('serviceWorker' in navigator)) {
      return;
    }

    if (!standalone) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });
      return;
    }

    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Ignore registration errors for non-supporting environments.
    });
  }, []);

  return null;
}
