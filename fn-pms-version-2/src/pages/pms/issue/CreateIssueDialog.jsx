// Author: Gururaj
// Created: 25 Nov 2025
// Description: Create Issue Dialog (final validated version)
// Version: 2.0.0

import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Box } from "@mui/material";

import InputField from "../../../components/formFields/InputField";
import AutoCompleteSelectSearch from "../../../components/formFields/AutoCompleteSelectSearch";

import backendRequest from "../../../util/request";
import BACKEND_ENDPOINT from "../../../util/urls";
import { showToast } from "../../../util/feedback/ToastService";
import Validator from "../../../util/validation";
import { errorMessageFormat, formatValidationErrors } from "../../../util/helper";
import SelectField from "../../../components/formFields/SelectField";
import DoButton from "../../../components/button/DoButton";
import { useWorkspace } from "../../../context/WorkspaceContext";

export default function CreateIssueDialog({ isOpen, onClose, fromDepartmentId, projectId, onSuccess = () => {} }) {
  const { workspaces, currentWorkspace, selectWorkspace, loading, isAdmin } = useWorkspace();
  // ----------------------------------------
  // FORM STATE
  // ----------------------------------------
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    issue_type_id: "",
    to_department_id: "",
  });

  const [newIssueText, setNewIssueText] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        issue_type_id: "",
        to_department_id: "",
      });

      setValidationErrors({ version: 1 });
    }
  }, [isOpen]);

  const [validationErrors, setValidationErrors] = useState({ version: 1 });
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);

  const [departments, setDepartments] = useState([]);

  // ----------------------------------------
  // Load departments (dummy now)
  // ----------------------------------------

  useEffect(() => {
    if (!workspaces || !currentWorkspace?.id) {
      setDepartments([]);
      return;
    }

    // to-do later here fetch all the departments
    const departments = workspaces
      .filter((workspace) => workspace.id !== currentWorkspace.id)
      .map((workspace) => ({
        value: workspace.id,
        label: workspace.name,
      }));

    setDepartments(departments);
  }, [workspaces, currentWorkspace?.id]);

  // ----------------------------------------
  // Handle Input Change with Validation
  // ----------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((p) => ({
      ...p,
      [name]: value,
    }));

    // validation
    const error = Validator("required", value); // all required for now
    setValidationErrors((prev) => ({
      ...prev,
      [name]: error,
      version: prev.version + 1,
    }));
  };

  // ----------------------------------------
  // Handle AutoComplete Change (issue type)
  // ----------------------------------------
  const handleIssueTypeChange = (value) => {
    setFormData((p) => ({ ...p, issue_type_id: value }));

    const error = Validator("required", value);
    setValidationErrors((prev) => ({
      ...prev,
      issue_type_id: error,
      version: prev.version + 1,
    }));
  };

  // ----------------------------------------
  // Handle Department Change
  // ----------------------------------------
  const handleDepartmentChange = (e) => {
    const value = e.target.value;

    setFormData((p) => ({ ...p, to_department_id: value }));

    const error = Validator("required", value);
    setValidationErrors((prev) => ({
      ...prev,
      to_department_id: error,
      version: prev.version + 1,
    }));
  };

  const handleCreateIssueType = async () => {
    setSubmitting("issueType");
    const response = await createIssueTypeBackend({ name: newIssueText });
    setNewIssueText("");
    if (response?.status === 422) {
      const errors = formatValidationErrors(response);
      setValidationErrors({ issue_type_id: errors.name, version: validationErrors.version + 1 });
    }
    setSubmitting(false);
  };

  // ----------------------------------------
  // Validate Form On Change
  // ----------------------------------------
  useEffect(() => {
    const requiredFields = ["title", "issue_type_id", "to_department_id"];

    const allFilled = requiredFields.every((f) => formData[f] !== undefined && formData[f] !== "");

    const hasErrors = Object.keys(validationErrors).some((k) => k !== "version" && validationErrors[k]);

    setIsValid(allFilled && !hasErrors);
  }, [formData, validationErrors]);

  // ----------------------------------------
  // Submit
  // ----------------------------------------
  const handleSubmit = async () => {
    setSubmitting("issue");

    const payload = {
      from_department_id: fromDepartmentId,
      to_department_id: formData.to_department_id,
      issue_type_id: formData.issue_type_id,
      title: formData.title.trim(),
      description: formData.description || null,
      priority: formData.priority,
    };

    const response = await createIssueBackend(projectId, payload);
    if (response?.status === 422) {
      const errors = formatValidationErrors(response);
      setValidationErrors({ ...errors, version: validationErrors.version + 1 });
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    if (response.success) {
      onClose();
      onSuccess();
    }
  };

  return (
    <Dialog open={!!isOpen} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>Create Issue</DialogTitle>

      <DialogContent dividers>
        {/* ------------------- DEPARTMENT ------------------- */}
        <Box marginTop={"10px"}>
          <SelectField name="to_department_id" label="To Department" value={formData.to_department_id} onChange={handleDepartmentChange} errorMessage={validationErrors.to_department_id} options={departments} />
        </Box>
        {/* ------------------- ISSUE TYPE ------------------- */}
        <Box marginTop={"10px"} display={"flex"} alignItems={"center"} justifyContent={"center"}>
          <AutoCompleteSelectSearch setSearchText={setNewIssueText} label="Issue Type" value={formData.issue_type_id} onChange={handleIssueTypeChange} fetchUrl={BACKEND_ENDPOINT.issue_types} mapResponse={(i) => ({ id: i.id, label: i.name })} errorMessage={errorMessageFormat(validationErrors.issue_type_id, validationErrors.version)} forCommon={false} />

          <DoButton onclick={handleCreateIssueType} extraStyles={{ width: "100px", height: "100%" }} isDisable={!newIssueText || formData.issue_type_id || isSubmitting === "issueType"}>
            {" "}
            {isSubmitting === "issueType" ? <CircularProgress size={20} /> : "Add As New"}{" "}
          </DoButton>
        </Box>
        {/* ------------------- TITLE ------------------- */}
        <Box marginTop={"10px"}>
          <InputField type="text" name="title" label="Title" value={formData.title} onChange={handleInputChange} errorMessage={errorMessageFormat(validationErrors.title, validationErrors.version)} />
        </Box>
        {/* ------------------- DESCRIPTION ------------------- */}
        <Box marginTop={"10px"}>
          <InputField type="textarea" name="description" label="Description" rows={3} value={formData.description} onChange={handleInputChange} hideError />
        </Box>
        {/* ------------------- PRIORITY ------------------- */}
        <Box marginTop={"10px"}>
          <SelectField
            name="priority"
            label="Priority"
            errorMessage={validationErrors.priority}
            value={formData.priority}
            onChange={handleInputChange}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "critical", label: "Critical" },
            ]}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={isSubmitting}>
          Cancel
        </Button>

        <Button variant="contained" onClick={handleSubmit} disabled={!isValid || isSubmitting}>
          {isSubmitting === "issue" ? <CircularProgress size={20} /> : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const createIssueTypeBackend = async (data) => {
  const response = await backendRequest({ endpoint: BACKEND_ENDPOINT.issue_type_create, bodyData: data });
  showToast({ message: response.message ?? (response.success ? "Issue Type created successfully" : "Failed to create Issue Type"), type: response.success ? "success" : "error" });
  return response;
};

const createIssueBackend = async (projectId, data) => {
  const endpoint = BACKEND_ENDPOINT.create_issue(projectId);
  const response = await backendRequest({ endpoint, bodyData: data });
  showToast({ message: response.message ?? (response.success ? "Issue created successfully" : "Failed to create Issue"), type: response.success ? "success" : "error" });
  return response;
};
