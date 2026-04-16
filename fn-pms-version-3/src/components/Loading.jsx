// Author: Gururaj
// Created: 18th June 2025
// Description: Component for Loading spinner.
// Version: 1.0.0
// components/Loading.jsx
// Modified:

import { Box, CircularProgress, useTheme } from "@mui/material";
import { colorCodes } from "../theme";

const Loading = () => {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode); // usage: colors.primary[500]

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1300, // higher than most MUI components
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(255, 255, 255, 0.3)", // semi-transparent overlay
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(2px)", // optional: slight blur effect
      }}
    >
      <CircularProgress
        size={60}
        thickness={5}
        sx={{
          color: colors.primary.light,
        }}
      />
    </Box>
  );
};

export default Loading;
