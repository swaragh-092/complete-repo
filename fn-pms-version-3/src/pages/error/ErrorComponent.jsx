// Author: Gururaj
// Created: 23rd May 2025
// Description: this is error component which is added error page.
// Version: 1.0.0
// pages/error/ErrorComponent.jsx
// Modified:

import { Link } from "react-router-dom";
import { Box, Typography, Button, useTheme } from "@mui/material";
import logo from "../../assets/logo.png"; // adjust path if needed
import darkModeLogo from "../../assets/whitelogo.png";
import { colorCodes } from "../../theme";
import { paths } from "../../util/urls";

export default function ErrorComponent({ error }) {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);


  const statusCode = error?.status || "500";
  const statusText = error?.statusText || "Internal Server Error";
  const message = error?.message || "An unexpected error has occurred.";

  return (
    <Box
      sx={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: colors.primary.dark,
        textAlign: "center",
      }}
    >
      {/* Logo */}
      <Box
        component="img"
        src={theme.palette.mode === "light" ? logo : darkModeLogo}
        alt="Logo"
        sx={{
          height: 70,
          mb: 4,
        }}
      />

      {/* Error Code */}
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: "26px", sm: "50px" },
          fontWeight: 900,
          mb: 1,
          letterSpacing: "4px",
        }}
      >
        {statusCode}
      </Typography>

      {/* Error Title */}
      <Typography
        variant="h4"
        sx={{
          fontSize: { xs: "20px", sm: "30px" },
          fontWeight: 700,
          mb: 2,
        }}
      >
        {statusText}
      </Typography>

      {/* Error Message */}
      <Typography
        variant="body1"
        sx={{
          maxWidth: 600,
          mb: 3,
          // color: "#e0e0e0",
        }}
      >
        {message}
      </Typography>

      {/* Extra Instruction */}
      <Typography
        variant="body2"
        sx={{
          maxWidth: 500,
          mb: 4,
          // color: "#cfcfcf",
        }}
      >
        Please check the URL or return to the homepage. If the problem continues, contact support.
      </Typography>

      {/* Button */}
      <Link
        to={paths.dashboard}
        style={{
          textDecoration: "none",
          color: colors.primary.dark,
        }}
      >
        <Box
          variant="contained"
          sx={{
            padding: "12px 28px",
            fontSize: "16px",
            borderRadius: "28px",
            backgroundColor: colors.background.light,
            color: colors.primary.dark,
            fontWeight: "bold",
            boxShadow: "0px 6px 20px rgba(0, 0, 0, 0.2)",
            "&:hover": {
              backgroundColor: colors.background.modrate,
            },
          }}
        >
          Go to Homepage
        </Box>
      </Link>

      {/* Fade-in animation keyframe */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </Box>
  );
}
