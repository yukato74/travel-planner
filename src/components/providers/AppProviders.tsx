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
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
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
