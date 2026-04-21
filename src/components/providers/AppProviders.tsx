'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ReactNode } from 'react';
import ThemeRegistry from '@/components/providers/ThemeRegistry';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0770E3',
      light: '#3A8BEA',
      dark: '#055BB8',
    },
    background: {
      default: '#F5F7FA',
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
            backgroundColor: '#055BB8',
          },
          '&:active': {
            backgroundColor: '#044A95',
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
