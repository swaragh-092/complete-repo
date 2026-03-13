// Author: Gururaj
// Created: 06th June 2025
// Description: This is for only select input field with multiple select only.
// Version: 1.0.0
// components/formFields/MultiSelectField.jsx
// Modified:

import { Autocomplete, TextField, Stack, useTheme, InputAdornment } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { colorCodes } from "../../theme";

export default function MultiSelectField({
  name,
  label,
  iconTag = null,
  errorMessage = null,
  extraParameters = {},
  isLoading = false,
  onChange = null,
  value = [], // expect array for multi-select
  options = [], // Array of { label, value }
  onSearchInputChange = null, 
  defaultSearchText = "", // For search input
}) {
  const [error, setError] = useState(errorMessage);
  const [isHideError, setHideError] = useState(false);
  const [searchText, setSearchText] = useState(defaultSearchText); 
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);
  const debounceTimer = useRef(null);
  useEffect(() => {
    setError(errorMessage?.replace(/\d+/g, ""));
  }, [errorMessage]);

  const handleSearchInputChange = (e, inputValue, reason) => {
    if (reason !== "input") return;
    setSearchText(inputValue);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (onSearchInputChange) onSearchInputChange(inputValue);
    }, 500);
  };

  const handleInputChange = (_, newValue) => {
    // if (onChange) {
    //   // Return just values instead of full objects
    //   const values = newValue.map((v) => v.value);
    //   onChange({ target: { name, value: values } });
    // }

    if (onChange) {
      onChange({ target: { name, value: newValue } }); // send full objects now
    }

    setHideError(false);
  };


   // Keep selected values even if not in options
    const getSelectedObjects = () => {
      const merged = [...value];
      return merged;
    };


  return (
    <Stack spacing={2} direction="row" width="100%">
      <Autocomplete
        multiple
        fullWidth
        id={name}
        filterOptions={(x) => x}
        loading={isLoading}
        options={options}
        inputValue={searchText} 
        value={getSelectedObjects()}
        onChange={handleInputChange}
        onInputChange={handleSearchInputChange}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, val) => option.value === val.value}
        renderInput={(params) => (
          <TextField
            {...params}
            {...extraParameters}
            required
            label={label}
            error={!!error}
            
            helperText={!isHideError && error}
            variant="filled"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {iconTag && <InputAdornment position="end">{iconTag}</InputAdornment>}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            sx={{
              "& .MuiFilledInput-root": {
                backgroundColor: colors.background.light,
                borderRadius: 1,
                color: colors.text.dark,
                "&:hover": {
                  backgroundColor: colors.background.modrate,
                },
                "&.Mui-focused": {
                  backgroundColor: colors.background.modrate,
                  color: colors.text.dark,
                },
              },
              "& .MuiInputLabel-root": {
                color: colors.text.light,
                "&.Mui-focused": {
                  color: colors.text.modrate,
                },
                "&.Mui-error": {
                  color: colors.error.modrate,
                },
              },
            }}
          />
        )}
      />
    </Stack>
  );
}
