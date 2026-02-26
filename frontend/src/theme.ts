import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#ce6c49',
      dark: '#b85d3f',
      light: '#e28f71',
      contrastText: '#fff9f4',
    },
    secondary: {
      main: '#8f867d',
    },
    background: {
      default: '#f5f1ea',
      paper: '#fcf9f5',
    },
    text: {
      primary: '#2c2926',
      secondary: '#7b736b',
    },
    divider: '#e7ded3',
    success: {
      main: '#7a8f62',
    },
    error: {
      main: '#b55a4e',
    },
    action: {
      hover: '#f8efe5',
      selected: '#f2e2d6',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Avenir Next", "Avenir", "Segoe UI", sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 800,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 800,
    },
    subtitle1: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: '100vh',
          background:
            'linear-gradient(110deg, #f6f1e9 0%, #f6f0e8 48%, #eff1f8 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 12px 30px rgba(62, 44, 28, 0.08)',
        }),
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 16,
        },
        contained: ({ theme }) => ({
          background: `linear-gradient(180deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          '&:hover': {
            background: theme.palette.primary.dark,
          },
        }),
        outlined: ({ theme }) => ({
          borderColor: theme.palette.divider,
          backgroundColor: '#fbf7f2',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: '#f7eee5',
          },
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          background:
            'linear-gradient(90deg, rgba(246,241,233,0.95) 0%, rgba(245,239,232,0.92) 42%, rgba(236,238,247,0.9) 100%)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(8px)',
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 999,
          backgroundColor: '#f0e8df',
          color: theme.palette.text.secondary,
          border: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 14,
          '&.Mui-selected': {
            backgroundColor: theme.palette.action.selected,
          },
          '&.Mui-selected:hover': {
            backgroundColor: theme.palette.action.selected,
          },
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: '#fbf8f4',
          '& fieldset': {
            borderColor: theme.palette.divider,
          },
          '&:hover fieldset': {
            borderColor: theme.palette.primary.light,
          },
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: '#fefcf9',
          borderLeft: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
  },
})
