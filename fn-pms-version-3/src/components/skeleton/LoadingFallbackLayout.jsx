// Author: Gururaj
// Created: 19th Jun 2025
// Description: Full-layout skeleton displayed as the React Suspense fallback for lazy-loaded pages.
// Version: 1.0.0
// Modified:



import { Box, CircularProgress } from "@mui/material";

import { styled } from "@mui/material/styles";

const LogoImage = styled("img")(() => ({
  maxWidth: "65%",
  height: "auto",
}));

export default function LoadingFallbackLayout() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      sx={{
        textAlign: "center",
      }}
    >
      <CircularProgress size={32} />
    </Box>
  );
}
