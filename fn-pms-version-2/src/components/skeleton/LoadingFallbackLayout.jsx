

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
