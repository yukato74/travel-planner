'use client';

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type OfflineStatusContextValue = {
  isOffline: boolean;
};

const OfflineStatusContext = createContext<OfflineStatusContextValue>({
  isOffline: false,
});

export function OfflineStatusProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [showBackOnlineToast, setShowBackOnlineToast] = useState(false);

  useEffect(() => {
    const OFFLINE_INDICATOR_DELAY_MS = 600;
    let offlineTimer: ReturnType<typeof setTimeout> | null = null;
    let currentlyOffline = false;

    const clearOfflineTimer = () => {
      if (offlineTimer !== null) {
        clearTimeout(offlineTimer);
        offlineTimer = null;
      }
    };

    const handleOnline = () => {
      const wasOffline = currentlyOffline;
      clearOfflineTimer();
      currentlyOffline = false;
      setIsOffline(false);
      if (wasOffline) {
        setShowBackOnlineToast(true);
      }
    };

    const handleOffline = () => {
      clearOfflineTimer();
      offlineTimer = setTimeout(() => {
        currentlyOffline = true;
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

  return (
    <OfflineStatusContext.Provider value={value}>
      {children}
      <Snackbar
        open={showBackOnlineToast}
        autoHideDuration={3000}
        onClose={() => setShowBackOnlineToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowBackOnlineToast(false)} severity="success" variant="filled" sx={{ width: '100%' }}>
          Back online.
        </Alert>
      </Snackbar>
    </OfflineStatusContext.Provider>
  );
}

export function useOfflineStatus(): OfflineStatusContextValue {
  return useContext(OfflineStatusContext);
}
