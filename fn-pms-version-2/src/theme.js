// Author: Gururaj
// Created: 23rd May 2025
// Description: Entire colors for the project will be maintained here.
// Version: 1.0.0
// Modified: 
// file : src/theme.js

import { createContext, useState, useMemo } from "react";
import { useEffect } from "react";
import { createTheme } from "@mui/material/styles";


export const colorCodes = (mode) => ({
  ...(mode === "dark"
    ? {
        primary: {
          dark: "#A6D6D6",   // icy blue
          modrate: "#5e8a8a", // cool teal
          light: "#283d3d",    // deep navy
        },
        secondary: {
          light: "#FFB703",   // warm gold
          modrate: "#FB8500", // bright orange
          dark: "#9A3412",    // burnt sienna
        },
        background: {
          light: "#1C1C1E",   // card / surface
          modrate: "#121212", // full background
          dark: "#0A0A0A",    // absolute dark
        },
        mainBackground: {
          light: "#1C1C1E",
          modrate: "#121212",
          dark: "#0A0A0A",
        },
        text: {
          light: "#A1A1AA",   // soft gray
          modrate: "#E4E4E7", // regular whiteish
          dark: "#F9FAFB",    // strong white
        },
        success: {
          light: "#3F6212",   // lime
          modrate: "#84CC16", // moss
          dark: "#A3E635",    // deep moss
        },
        error: {
          light: "#7F1D1D",   // salmon
          modrate: "#DC2626", // cherry red
          dark: "#F87171",    // maroon
        },
        warning: {
          light: "#FCD34D",   // pastel yellow
          modrate: "#ecb017", // amber
          dark: "#78350F",    // dark gold
        },
        info: {
          light: "#164E63",   // cyan
          modrate: "#22D3EE", // aqua
          dark: "#67E8F9",    // steel blue
        },
      }
    : {
        primary: {
          light: "#A6D6D6",   // icy blue
          modrate: "#5e8a8a", // cool teal
          dark: "#283d3d",    // deep navy
        },
        secondary: {
          light: "#FB8500",   // bright orange
          modrate: "#E76F00", // burnt orange
          dark: "#B45309",    // rust
        },
        background: {
          light: "#F8F9FA",   // soft off-white
          modrate: "#EDF2F7", // light gray
          dark: "#E2E8F0",    // cooler gray
        },
        mainBackground: {
          light: "#FFFFFF",
          modrate: "#F8FAFC",
          dark: "#F1F5F9",
        },
        text: {
          light: "#1F2937",   // near-black
          modrate: "#4B5563", // soft black
          dark: "#111827",    // darkest
        },
        success: {
          light: "#84CC16",   // moss
          modrate: "#65A30D", // olive
          dark: "#365314",    // forest
        },
        error: {
          light: "#F87171",   // soft red
          modrate: "#DC2626", // hard red
          dark: "#7F1D1D",    // blood
        },
        warning: {
          light: "#78350F",   // amber
          modrate: "#ecb017", // mustard
          dark: "#FCD34D",    // brown yellow
        },
        info: {
          light: "#22D3EE",   // bright cyan
          modrate: "#06B6D4", // dark aqua
          dark: "#0E7490",    // blue gray
        },
      }),
});



// mui theme settings
export const themeSettings = (mode) => {
  const colors = colorCodes(mode);
  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            // palette values for dark mode
            primary: {
              main: colors.primary['dark'],
            },
            secondary: {
              main: colors.secondary['dark'],
            },
            neutral: {
              dark: colors.primary['dark'],
              main: colors.primary['modrate'],
              light: colors.secondary['light'],
            },
            background: {
              default: colors.background['light'],
            },
          }
        : {
            // palette values for light mode
            primary: {
              main: colors.primary['light'],
            },
            secondary: {
              main: colors.secondary['light'],
            },
            neutral: {
              dark: colors.primary['light'],
              main: colors.primary['modrate'],
              light: colors.secondary['dark'],
            },
            background: {
              default: "#fcfcfc",
            },
          }),
    },
    typography: {
      fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
      fontSize: 12,
      h1: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 40,
      },
      h2: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 32,
      },
      h3: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 24,
      },
      h4: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 20,
      },
      h5: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 16,
      },
      h6: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 14,
      },
    },
  };
};


// Context
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export const useMode = () => {
  const getInitialMode = () => {
    const stored = localStorage.getItem("colorMode");
    if (stored === "light" || stored === "dark") return stored;

    // Check system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  };

  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    // Save mode in localStorage whenever it changes
    localStorage.setItem("colorMode", mode);
  }, [mode]);

  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prev) => (prev === "light" ? "dark" : "light"));
    },
  }), []);

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

  return [theme, colorMode];
};
