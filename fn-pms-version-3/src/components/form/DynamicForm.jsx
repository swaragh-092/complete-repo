// Author: Gururaj
// Created: 19th Jun 2025
// Description: Dynamic form generator that builds MUI form fields from a JSON schema definition.
// Version: 1.0.0
// Modified:

import { useState } from "react";
import { Box, Button } from "@mui/material";
import InputField from "../../components/formFields/InputField";
import { errorMessageFormat, formatValidationErrors } from "../../util/helper";
import { showToast } from "../../util/feedback/ToastService";
import CircularProgress from "@mui/material/CircularProgress";

import Validator from "../../util/validation";
import SelectField from "../formFields/SelectField";
import AutoCompleteSelectSearch from "../formFields/AutoCompleteSelectSearch";
import MemberPicker from "../pms/MemberPicker";

//fields = [
//   { type: "text", name: "name" },
//   { type: "textarea", name: "description", label: "Description", require: false },
// ];

export default function DynamicForm({ fields, initialData = {}, onSubmit, onSuccess = () => {} }) {
  const [formData, setFormData] = useState(initialData);
  const [validationErrors, setValidationErrors] = useState({ version: 1 });
  const [isSubmitting, setSubmitting] = useState(false);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Live validation
    const field = fields.find((f) => f.name === name);
    const error = Validator(field?.validationName || "required", value);
    setValidationErrors((prev) => ({
      ...prev,
      [name]: error,
      version: prev.version + 1,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await onSubmit(formData);

      if (response?.status === 422) {
        const errors = formatValidationErrors(response);
        setValidationErrors({ ...errors, version: validationErrors.version + 1 });
        setSubmitting(false);
        return;
      }

      if (!response?.success) {
        showToast({ message: response.message || "Something went wrong", type: "error" });
        setSubmitting(false);
        return;
      }
      onSuccess();
      showToast({ message: response.message, type: "success" });
      setSubmitting(false);
    } catch (err) {
      showToast({ message: err.message || "Submission failed", type: "error" });
      setSubmitting(false);
    }
  };

  // Derive validity from current state (no effect needed)
  const allRequiredFilled = fields.every((f) => (f.required !== false ? formData[f.name] !== undefined && formData[f.name] !== "" : true));
  const hasErrors = Object.keys(validationErrors).some((key) => key !== "version" && validationErrors[key]);
  const isValid = allRequiredFilled && !hasErrors;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {fields.map((field) =>
        field.type === "select" ? (
          <SelectField
            key={field.name}
            {...field}
            required={field.required !== false} // default required = true
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            errorMessage={errorMessageFormat(validationErrors[field.name], validationErrors.version)}
          />
        ) : field.type === "auto_search" ? (
          <AutoCompleteSelectSearch
            key={field.name}
            {...field} // extra required fields other than what normal = [ fetchUrl, mapResponse ( this maps response with option and value ) ]
            // mapResponse={(i) => ({ id: i.id, label: i.name })}  # this is exaple for mapResponse
            required={field.required !== false}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            errorMessage={errorMessageFormat(validationErrors[field.name], validationErrors.version)}
          />
        ) : field.type === "member_picker" ? (
          <MemberPicker
            key={field.name}
            name={field.name}
            label={field.label || "Assign To"}
            projectId={field.projectId}
            departmentId={field.departmentId}
            required={field.required === true}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            errorMessage={errorMessageFormat(validationErrors[field.name], validationErrors.version)}
          />
        ) : (
          <InputField
            key={field.name}
            {...field}
            required={field.required !== false} // default required = true
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            errorMessage={errorMessageFormat(validationErrors[field.name], validationErrors.version)}
          />
        ),
      )}

      <Button onClick={handleSubmit} disabled={isSubmitting || !isValid} variant="contained" color="primary">
        {isSubmitting ? <CircularProgress size={20} /> : "Submit"}
      </Button>
    </Box>
  );
}
