import { createTheme, alpha } from '@mui/material/styles';

// Warm Beige/Gold Palette (matching auth-ui)
const palette = {
  light: {
    background: {
      default: '#F9F8F6',
      paper: '#FFFFFF',
      subtle: '#EFE9E3',
    },
    text: {
      primary: '#2D2D2D',
      secondary: '#5C5C5C',
    },
    primary: {
      main: '#C9B59C', // Warm Beige/Gold
      light: '#D9CFC7',
      dark: '#A8947D',
      contrastText: '#2D2D2D',
    },
    secondary: {
      main: '#5C5C5C', // Dark Grey for contrast
      light: '#858585',
      dark: '#333333',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#16a34a',
    },
    warning: {
      main: '#f59e0b',
    },
    error: {
      main: '#dc2626',
    },
    info: {
      main: '#0ea5e9',
    },
    divider: '#E0E0E0',
  },
  dark: {
    background: {
      default: '#1A1A1A',
      paper: '#242424',
      subtle: '#2D2D2D',
    },
    text: {
      primary: '#EFE9E3',
      secondary: '#B0B0B0',
    },
    primary: {
      main: '#D9CFC7',
      light: '#EFE9E3',
      dark: '#C9B59C',
      contrastText: '#1A1A1A',
    },
    secondary: {
      main: '#A0A0A0',
      light: '#C0C0C0',
      dark: '#808080',
      contrastText: '#1A1A1A',
    },
    success: {
      main: '#22c55e',
    },
    warning: {
      main: '#fbbf24',
    },
    error: {
      main: '#f87171',
    },
    info: {
      main: '#38bdf8',
    },
    divider: '#333333',
  },
};

export const createAppTheme = (mode = 'light') => {
  const colors = palette[mode];
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      ...colors,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 600 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600, letterSpacing: '-0.01em' },
      h5: { fontWeight: 500 },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 500 },
      body1: { fontSize: 14 },
      body2: { fontSize: 13 },
      caption: { fontSize: 12 },
      button: { textTransform: 'none', fontWeight: 500 },
    },
    shape: {
      borderRadius: 12, // Medium radius
    },
    spacing: 8,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: 'none',
            minHeight: '100vh',
          },
          '::selection': {
            backgroundColor: alpha(colors.primary.main, 0.25),
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '0.01em',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            '&:hover': {
              backgroundColor: isDark ? '#EFE9E3' : '#B8A48B',
            },
          },
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDark
              ? '0px 4px 20px rgba(0, 0, 0, 0.2)'
              : '0px 4px 20px rgba(0, 0, 0, 0.05)',
            border: `1px solid ${colors.divider}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none', // Remove default gradient in dark mode
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.background.paper,
            borderRight: `1px solid ${colors.divider}`,
          },
        },
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: colors.background.paper,
            color: colors.text.primary,
            boxShadow: 'none',
            borderBottom: `1px solid ${colors.divider}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '4px 8px',
            '&.Mui-selected': {
              backgroundColor: alpha(colors.primary.main, 0.15),
              '&:hover': {
                backgroundColor: alpha(colors.primary.main, 0.25),
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 500,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? alpha('#2D2D2D', 0.9) : colors.background.subtle,
            '& .MuiTableCell-head': {
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: 12,
            },
          },
        },
      },
      MuiTooltip: {
        defaultProps: {
          arrow: true,
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
    },
  });
};

export default createAppTheme;
