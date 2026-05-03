import { createTheme } from '@mui/material/styles';

/**
 * QMS Admin 浅色主题
 * 清爽的蓝紫配色方案
 */
export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5c6bc0',
      light: '#8e99a4',
      dark: '#3949ab',
    },
    secondary: {
      main: '#26a69a',
      light: '#64d8cb',
      dark: '#00796b',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#5c6bc0',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: '0 2px 8px rgba(92, 107, 192, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(92, 107, 192, 0.4)',
          },
        },
      },
    },
  },
});
