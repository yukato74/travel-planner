'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type OfflineStatusContextValue = {
  isOffline: boolean;
};

const OfflineStatusContext = createContext<OfflineStatusContextValue>({
  isOffline: false,
});

export function OfflineStatusProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }
    return !navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
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
