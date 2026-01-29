import { createTheme, alpha } from '@mui/material/styles';

// Earthy/Warm Palette
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
        divider: '#333333',
    },
};

export const getTheme = (mode) => {
    const colors = palette[mode];

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
            h4: { fontWeight: 600 },
            h5: { fontWeight: 500 },
            h6: { fontWeight: 500 },
            button: { textTransform: 'none', fontWeight: 500 },
        },
        shape: {
            borderRadius: 12, // Medium radius
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: 'none',
                        },
                    },
                    contained: {
                        '&:hover': {
                            backgroundColor: mode === 'light' ? '#B8A48B' : '#EFE9E3',
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        boxShadow: mode === 'light'
                            ? '0px 4px 20px rgba(0, 0, 0, 0.05)'
                            : '0px 4px 20px rgba(0, 0, 0, 0.2)',
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
                        backgroundColor: mode === 'light' ? '#FFFFFF' : '#242424',
                        borderRight: `1px solid ${colors.divider}`,
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: mode === 'light' ? '#FFFFFF' : '#242424',
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
        },
    });
};
