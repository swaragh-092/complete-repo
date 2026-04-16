// Author: Gururaj
// Created: 23rd May 2025
// Description: component for dynamic heading.
// Version: 1.0.0
// components/Header.jsx
// Modified:

import { Typography, Box, useTheme } from "@mui/material";
import { colorCodes } from "../theme";

const fontSizes = {
  1: { xs: "2rem", sm: "2.5rem", md: "3rem" },      // h1
  2: { xs: "1.75rem", sm: "2rem", md: "2.5rem" },   // h2
  3: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },   // h3
  4: { xs: "1.25rem", sm: "1.4rem", md: "1.6rem" }, // h4
  5: { xs: "1.1rem", sm: "1.25rem", md: "1.4rem" }, // h5
  6: { xs: "1rem", sm: "1.1rem", md: "1.2rem" },    // h6
};

const Heading = ({ title, subtitle = "", giveMarginBottom = true, level = 1 }) => {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);
  const accentColor = theme.palette.primary.main;

  return (
    <Box sx={{ mb: giveMarginBottom ? "20px" : "0" }}>
      <Typography
        variant={`h${level}`}
        fontWeight={600}
        sx={{
          fontSize: fontSizes[level],
          lineHeight: 1.2,
          display: "inline-block",
          position: "relative",
          pb: 1,
          color: colors.primary.dark,
          "&::after": {
            content: '""',
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "48px",
            height: "3px",
            borderRadius: "2px",
            backgroundColor: accentColor,
          },
        }}
      >
        {(title || "").charAt(0).toUpperCase() + (title || "").slice(1)}
      </Typography>

      {subtitle && (
        <Typography
          variant="subtitle1"
          sx={{
            mt: 1,
            color: colors.primary.modrate,
            fontSize: {
              xs: "0.95rem",
              sm: "1.05rem",
            },
            maxWidth: "80ch",
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default Heading;
