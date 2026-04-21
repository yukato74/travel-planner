'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ReactNode } from 'react';
import ThemeRegistry from '@/components/providers/ThemeRegistry';

const theme = createTheme({
  palette: {
    primary: {
      main: '#f26b5b',
      light: '#ff9e91',
      dark: '#d75445',
    },
    background: {
      default: '#fff8f6',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          color: '#fff',
          '&:hover': {
            backgroundColor: '#d75445',
          },
          '&:active': {
            backgroundColor: '#c54b3d',
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
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'linear-gradient(to bottom, #ffffff 0, #ffffff env(safe-area-inset-top), #fff8f6 env(safe-area-inset-top), #fff8f6 100%)',
        },
      },
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeRegistry>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeRegistry>
  );
}
