import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a73e8',
      dark: '#185abc',
      light: '#7fb4ff',
    },
    secondary: {
      main: '#106c5a',
    },
    background: {
      default: '#f4f7fc',
      paper: '#ffffff',
    },
    text: {
      primary: '#13233a',
      secondary: '#4a5d7a',
    },
    divider: '#d7deea',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Public Sans", "Segoe UI", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 700,
    },
    subtitle1: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #d7deea',
        },
      },
    },
  },
})
