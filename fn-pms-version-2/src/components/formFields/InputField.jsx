// Author: Gururaj
// Created: 23rd May 2025
// Description: component for input field for types text, email, hidden,  .
// Version: 1.0.0
// components/formFields/InputField.jsx
// Modified: 

import { Stack, TextField, InputAdornment, useTheme } from "@mui/material";
import { colorCodes } from "../../theme";

export default function InputField({
  type,
  name,
  label = name ? name.charAt(0).toUpperCase() + name.slice(1) : "",
  iconTag = null,
  placeholder = null,
  errorMessage = null,
  hideError = false,
  extraParameters = {},
  onChange = () => {},
  value = "",
  rows = 3,
}) {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);
  const isTextArea = type === "textarea";
  const formattedValue =
    type === "date" && value
      ? new Date(value).toISOString().split("T")[0]
      : value || "";

  return (
    <Stack spacing={2} direction="row">
      <TextField
        {...extraParameters}
        value={formattedValue}
        fullWidth
        placeholder = {placeholder}
        multiline={isTextArea}
        minRows={isTextArea ? rows : undefined}
        type={isTextArea ? "text" : type}
        id={name}
        name={name}
        label={label}
        variant="filled"
        InputLabelProps={type === "date" ? { shrink: true } : {}}
        error={!!errorMessage}
        helperText={!hideError ? errorMessage : null}
        slotProps={{
          input: {
            endAdornment:
            !isTextArea && iconTag ? (
              <InputAdornment position="end">{iconTag}</InputAdornment>
            ) : undefined,
          },
        }}
        onChange={onChange}
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
            color: colors.text.light,
            "&.Mui-focused": { color: colors.text.modrate },
            "&.Mui-error": { color: colors.error.modrate },
          },
        }}
      />
    </Stack>
  );
}
