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

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const syncStandaloneDataset = () => {
      const standalone = isStandaloneDisplayMode();
      document.documentElement.dataset.standalone = standalone ? 'true' : 'false';
      return standalone;
    };
    const standalone = syncStandaloneDataset();
    const handleDisplayModeChange = () => {
      syncStandaloneDataset();
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);
    window.addEventListener('pageshow', handleDisplayModeChange);

    if (!('serviceWorker' in navigator)) {
      return () => {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
        window.removeEventListener('pageshow', handleDisplayModeChange);
      };
    }

    if (!standalone) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });
    } else {
      void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Ignore registration errors for non-supporting environments.
      });
    }

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('pageshow', handleDisplayModeChange);
    };
  }, []);

  return null;
}
