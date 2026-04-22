'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type OfflineStatusContextValue = {
  isOffline: boolean;
};

const OfflineStatusContext = createContext<OfflineStatusContextValue>({
  isOffline: false,
});

export function OfflineStatusProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const OFFLINE_INDICATOR_DELAY_MS = 600;
    let offlineTimer: ReturnType<typeof window.setTimeout> | null = null;

    const clearOfflineTimer = () => {
      if (offlineTimer !== null) {
        window.clearTimeout(offlineTimer);
        offlineTimer = null;
      }
    };

    const handleOnline = () => {
      clearOfflineTimer();
      setIsOffline(false);
    };

    const handleOffline = () => {
      clearOfflineTimer();
      offlineTimer = window.setTimeout(() => {
        setIsOffline(true);
        offlineTimer = null;
      }, OFFLINE_INDICATOR_DELAY_MS);
    };

    if (navigator.onLine) {
      handleOnline();
    } else {
      handleOffline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearOfflineTimer();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value = useMemo(() => ({ isOffline }), [isOffline]);

  return <OfflineStatusContext.Provider value={value}>{children}</OfflineStatusContext.Provider>;
}

export function useOfflineStatus(): OfflineStatusContextValue {
  return useContext(OfflineStatusContext);
}
