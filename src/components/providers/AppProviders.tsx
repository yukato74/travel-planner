'use client';

import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, alpha, createTheme } from '@mui/material/styles';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ModalScrollLockGuard } from '@/components/providers/ModalScrollLockGuard';
import { OfflineStatusProvider } from '@/components/providers/OfflineStatusProvider';
import { PwaInitializer } from '@/components/providers/PwaInitializer';
import ThemeRegistry from '@/components/providers/ThemeRegistry';

export function AppProviders({ children }: { children: ReactNode }) {
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const syncMode = () => setPrefersDarkMode(mediaQuery.matches);
    syncMode();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMode);
    } else {
      mediaQuery.addListener(syncMode);
    }
    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', syncMode);
      } else {
        mediaQuery.removeListener(syncMode);
      }
    };
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          primary: {
            main: '#0770E3',
            light: '#3A8BEA',
            dark: '#055BB8',
          },
          background: prefersDarkMode
            ? {
                default: '#121212',
                paper: '#1E1E1E',
              }
            : {
                default: '#F5F7FA',
                paper: '#FFFFFF',
              },
        },
        shape: {
          borderRadius: 10,
        },
        components: {
          MuiButton: {
            defaultProps: {
              disableElevation: true,
            },
            styleOverrides: {
              root: {
                boxShadow: 'none',
                textTransform: 'none',
                '&:hover': {
                  boxShadow: 'none',
                },
                '&:active': {
                  boxShadow: 'none',
                },
              },
              containedPrimary: {
                color: '#fff',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#055BB8',
                  boxShadow: 'none',
                },
                '&:active': {
                  backgroundColor: '#044A95',
                  boxShadow: 'none',
                },
              },
            },
          },
          MuiDialogTitle: {
            styleOverrides: {
              root: {
                fontWeight: 700,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                textTransform: 'none',
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundImage: 'none',
                backgroundColor: prefersDarkMode ? '#1E1E1E' : '#FFFFFF',
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: ({ theme: muiTheme }) => ({
                '&.Mui-selected': {
                  backgroundColor: alpha(muiTheme.palette.primary.main, muiTheme.palette.mode === 'dark' ? 0.24 : 0.12),
                },
                '&.Mui-selected:hover': {
                  backgroundColor: alpha(muiTheme.palette.primary.main, muiTheme.palette.mode === 'dark' ? 0.32 : 0.18),
                },
              }),
            },
          },
        },
      }),
    [prefersDarkMode],
  );

  return (
    <ThemeRegistry>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <OfflineStatusProvider>
          <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', color: 'text.primary' }}>
            <ModalScrollLockGuard />
            <PwaInitializer />
            {children}
          </Box>
        </OfflineStatusProvider>
      </ThemeProvider>
    </ThemeRegistry>
  );
}
