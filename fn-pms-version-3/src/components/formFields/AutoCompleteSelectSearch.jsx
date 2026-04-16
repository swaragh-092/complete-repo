// Author: Gururaj
// Created: 25 Nov 2025
// Description: Reusable AutoComplete Search Select (Single Select)
// Version: 1.0.0

import { useState, useEffect, useRef } from "react";
import { TextField, CircularProgress, Autocomplete, Box, Button, useTheme } from "@mui/material";
import backendRequest from "../../util/request";
import { colorCodes } from "../../theme";

export default function AutoCompleteSelectSearch({
  name = "",
  label = "Select Option",
  value = null, // selected id
  onChange = () => {}, // returns selected id
  fetchUrl = "", // url to fetch options
  searchParam = "searchText",
  setSearchText=() => {},
  errorMessage = "", // ?searchText=
  mapResponse = (i) => ({
    // map API data
    id: i.id,
    label: i.name,
  }),
  forCommon = true,
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  const debounceRef = useRef(null);

  // Load initial list
  useEffect(() => {
    loadList();
  }, []);

  const loadList = async (search = "") => {
    setLoading(true);

    const res = await backendRequest({
      endpoint: fetchUrl,
      querySets: search ? `?${searchParam}=${search}` : "",
    });

    if (res?.success) {
      setOptions(res.data?.data?.map(mapResponse) || []);
    }

    setLoading(false);
  };

  return (
    <>
      <Autocomplete
        fullWidth
        loading={loading}
        options={loading ? [] : options}
        value={options.find((o) => o.id === value) || null}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        getOptionLabel={(opt) => opt.label}
        loadingText="Loading..."
        onInputChange={(e, val) => {
          forCommon? onChange({target: {name: name, value: ""}}) : onChange(null);
          if (debounceRef.current) clearTimeout(debounceRef.current);

          debounceRef.current = setTimeout(() => {
            setSearchText(val);
            loadList(val);
          }, 500); // debounce duration
        }}
        onChange={(e, val) => {
          forCommon ? onChange({target: {name: name, value: val?.id || ""}}) : onChange(val?.id || "");
        }}
        renderInput={(params) => (
          <TextField 
            {...params}
            label={label}
            size="small"
            margin="dense"
            variant="filled"
            helperText={errorMessage}
            error={!!errorMessage}
            InputProps={{
              ...params.InputProps,
              endAdornment: <>{params.InputProps.endAdornment}</>,
            }}
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
        )}
      />
    </>
  );
}
