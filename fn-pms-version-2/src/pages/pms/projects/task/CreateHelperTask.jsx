import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button, Autocomplete, TextField, useTheme } from "@mui/material";
import InputField from "../../../../components/formFields/InputField";
import { errorMessageFormat, formatValidationErrors } from "../../../../util/helper";
import Validator from "../../../../util/validation";
import { showToast } from "../../../../util/feedback/ToastService";
import { colorCodes } from "../../../../theme";
import backendRequest from "../../../../util/request";
import BACKEND_ENDPOINT from "../../../../util/urls";

const fields = [
  { name: "title", label: "Title", validationName: "text" },
  { name: "description", label: "Description", type: "textarea", rows: 3, validationName: "text" },
  { name: "due_date", label: "Deadline", type: "date", validationName: "futureDate" },
];

export default function CreateHelperTask({ open, onClose, onSuccess, initialData = {}, projectMemberId, taskId }) {

  const [formData, setFormData] = useState(initialData);
  const [validationErrors, setValidationErrors] = useState({ version: 1 });
  const [isSubmitting, setSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);


  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);

  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  useEffect(() => {
    if (open) {
      setFormData(initialData);
      setValidationErrors({ version: 1 });
      setSelectedMember(null);
      setMemberSearch("");
      setMembers([]);
      setSubmitting(false);
      setIsValid(false);
    }
  }, [open]);

  useEffect(() => {
    const controller = new AbortController(); // for cancelling old requests
    const signal = controller.signal;
    const debounceTimer = setTimeout(async () => {
      if (memberSearch.trim().length < 2) {
        setMembers([]);
        return;
      }

      setLoadingMembers(true);
      try {
        const response = await backendRequest({
          endpoint: BACKEND_ENDPOINT.search_project_member(projectMemberId),
          querySets: `?searchText=${memberSearch}`,
        });

        if (signal.aborted) return; // ignore if request was cancelled

        if (!response.success) {
          showToast({ message: response.message || "Failed to search", type: "error" });
        } else if (Array.isArray(response.data)) {
          setMembers(response.data);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          showToast({ message: err.message || "Search failed", type: "error" });
        }
      } finally {
        if (!signal.aborted) setLoadingMembers(false);
      }
    }, 400); // ⏱ debounce delay (ms)

    // cleanup function: cancel previous request + clear timeout
    return () => {
      controller.abort();
      clearTimeout(debounceTimer);
    };
  }, [memberSearch]);

  // 🧠 Handle Input Changes (with validation)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    const field = fields.find((f) => f.name === name) || name;
    const error = Validator(field?.validationName || "required", value);
    setValidationErrors((prev) => ({
      ...prev,
      [name]: error,
      version: prev.version + 1,
    }));
  };

  // ✅ Check validity
  useEffect(() => {
    const allRequiredFilled = fields.every((f) => (f.required !== false ? !!formData[f.name] : true));
    const hasErrors = Object.keys(validationErrors).some((key) => key !== "version" && validationErrors[key]);
    setIsValid(allRequiredFilled && !hasErrors && !!selectedMember);
  }, [formData, validationErrors, fields, selectedMember]);

  // 🚀 Submit handler
  const handleSubmit = async () => {
    setSubmitting(true);
    try {

      const response = await backendRequest(
        {
          bodyData: {
            ...formData,
            projectMemberId: selectedMember.projectMemberId,
          },
          endpoint: BACKEND_ENDPOINT.create_helper_task(taskId)

        }
      );

      if (response?.status === 422) {
        const errors = formatValidationErrors(response);
        setValidationErrors({
          ...errors,
          version: validationErrors.version + 1,
        });
        setSubmitting(false);
        showToast({ message: response.message || "Validation Error!..", type: "error" });
        return;
      }

      if (!response?.success) {
        showToast({
          message: response.message || "Something went wrong",
          type: "error",
        });
        setSubmitting(false);
        return;
      }

      onSuccess?.();
      showToast({ message: response.message || "Helper Task created successfully!..", type: "success" });
      onClose();
    } catch (err) {
      showToast({
        message: err.message || "Submission failed",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Helper Task</DialogTitle>
      <DialogContent>
        <Box mt={1} display="flex" flexDirection="column" gap={2}>
          {fields.map((field) => (
            <InputField key={field.name} {...field} required={field.required !== false} value={formData[field.name] || ""} onChange={handleInputChange} errorMessage={errorMessageFormat(validationErrors[field.name], validationErrors.version)} />
          ))}

          {/* 🔍 Member Search */}
          <Box>
            
            <Autocomplete
              options={members}
              value={selectedMember || null}
              getOptionLabel={(option) => option?.name || ""}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={loadingMembers}
              inputValue={memberSearch}
              onInputChange={(e, newInputValue, reason) => {
                if (reason === "input") {
                  setMemberSearch(newInputValue);
                  handleInputChange(e);
                } else if (reason === "clear") {
                  setMemberSearch("");
                  setSelectedMember(null);
                  handleInputChange(e);
                }
              }}
              onChange={(e, newValue, reason) => {
                if (reason === "selectOption") {
                  setMemberSearch(newValue?.name || "");
                  setSelectedMember(newValue);
                }
              }}
              noOptionsText={loadingMembers ? "Loading..." : memberSearch.trim().length < 2 ? "Type to search members" : "No members found"}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Member*"
                  variant="filled"
                  name={"projectMemberId"}
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
            {validationErrors.projectMemberId && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.5, ml: 1 }}
              >
                {errorMessageFormat(validationErrors.projectMemberId, validationErrors.version)}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid || isSubmitting}>
          {isSubmitting ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
