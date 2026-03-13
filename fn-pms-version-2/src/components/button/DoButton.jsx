// Author: Gururaj
// Created: 14th June 2025
// Description: This is Button component for all do actions, like submit, save, etc.
// Version: 1.0.0
// components/button/DoButton.jsx
// Modified:

// Mui imports
import { Box, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

export default function DoButton({ onclick, children, extraStyles = {}, responsiveIcon = null, isDisable=false, variant="contained" }) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm")); // sm = <600px
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        px: 1,
        
      }}
    >
      <Button
        disabled={isDisable}
        variant={variant}
        onClick={onclick}
        sx={{
          ...(!responsiveIcon && {
            width: {
              xs: "100%",
              sm: "auto",
            },
          }),
          height: "30px",
          ...extraStyles,
          
          
        }}
      >
        {isSmallScreen && responsiveIcon ? responsiveIcon : children}
      </Button>
    </Box>
  );
}
