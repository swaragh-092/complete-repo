// Author: Gururaj
// Created: 05th June 2025
// Description: This is for only select input field with single select only only.
// Version: 1.0.0
// components/formFields/InputField.jsx
// Modified:

import { Box, Button, Stack, TextField, InputAdornment, useTheme, MenuItem, } from "@mui/material";
import { useState, useEffect } from "react";
import Validator from "../../util/validation";
import { colorCodes } from "../../theme";

export default function SelectField({
  name,
  label = name ? name.charAt(0).toUpperCase() + name.slice(1) : "",
  iconTag = null,
  errorMessage = null,
  validationName = "required",
  extraParameters = {},
  onChange = null,
  value = undefined,
  options = [], // Array of { label, value }
}) {
  const [error, setError] = useState(errorMessage);
  const [isHideError, setHideError] = useState(false);
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);
  useEffect(() => {
    setError(errorMessage?.replace(/\d+/g, ""));
  }, [errorMessage]);

  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e);
    }
    if (name != "confirm_password") {
      setError(Validator(validationName, e.target.value));
      setHideError(false);
    }
  };
  return (
    <Stack spacing={2} direction="row">
      <TextField
        {...extraParameters}
        value={value ?? ""}
        fullWidth
        select
        id={name}
        name={name}
        label={label}
        variant="filled"
        error={!!error}
        helperText={error && !isHideError ? error : null}
        slotProps={{
          input: {
            endAdornment: iconTag ? <InputAdornment position="end">{iconTag}</InputAdornment> : undefined,
          },
        }}
        onChange={(e) => handleInputChange(e)}
        sx={{
          borderRadius: 1,
          fontSize: "1rem",
          "& .MuiFilledInput-root": {
            backgroundColor: colors.background.light, // Normal background
            borderRadius: 1,
            color: colors.text.dark, // Input text color
            "&:hover": {
              backgroundColor: colors.background.modrate, // Hover background
            },
            "&.Mui-focused": {
              backgroundColor: colors.background.modrate, // Focused background
              color: colors.text.dark, // Focused text color
            },
          },
          "& .MuiFilledInput-input": {
            [(theme) => theme.breakpoints.down("sm")]: {
              fontSize: "0.9rem",
            },
          },
          "& .MuiFormHelperText-root": {
            [(theme) => theme.breakpoints.down("sm")]: {
              fontSize: "0.75rem",
            },
          },
          "& .MuiInputLabel-root": {
            color: colors.text.light, // Normal label color
            "&.Mui-focused": {
              color: colors.text.modrate, // Focused label color (primary)
            },
            "&.Mui-error": {
              color: colors.error.modrate, // Error label color (optional)
            },
          },
        }}
      >
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}
