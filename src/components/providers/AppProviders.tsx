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
      default: '#ffffff',
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
