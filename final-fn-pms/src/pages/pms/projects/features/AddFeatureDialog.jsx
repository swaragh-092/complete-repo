import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  TextField,
  Box,
  Typography,
  Autocomplete,
  MenuItem,
} from "@mui/material";
import { showToast } from "../../../../util/feedback/ToastService";
import backendRequest from "../../../../util/request";
import BACKEND_ENDPOINT from "../../../../util/urls";
import { useWorkspace } from "../../../../context/WorkspaceContext";

export default function AddFeatureDialog({ open, onClose, projectId }) {

  const { workspaces, currentWorkspace, selectWorkspace, loading, isAdmin } = useWorkspace();

  // const [departments, setDepartments] = useState([]);
  const [features, setFeatures] = useState([]);
  
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [featureSearch, setFeatureSearch] = useState("");
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const searchTimer = useRef(null); 

  const departments = workspaces;

  // Reset dialog state on open
  useEffect(() => {
    if (open) {
      setSelectedDepartment("");
      setSelectedFeature(null);
      setFeatures([]);
      setFeatureSearch("");
      setLoadingFeatures(true);
    }
  }, [open]);

  // Debounced search effect
  useEffect(() => {
    // Clear old timer if any
    if (selectedFeature) return 
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!selectedDepartment) {
      setFeatures([]);
      setSelectedFeature(null);
      setFeatureSearch("");
      return;
    } else {
      setFeatures([]);
      setSelectedFeature(null);
      setLoadingFeatures(true);
    }

    // Debounce fetch
    searchTimer.current = setTimeout(() => {
      fetchFeatures(selectedDepartment, featureSearch.trim(), projectId);
    }, 500);

  }, [selectedDepartment, featureSearch, selectedFeature, projectId ]); 

  const fetchFeatures = async (departmentId, searchText = "", projectId) => {
    try {
      setLoadingFeatures(true);
      const res = await fetchFeaturesFromBackend(departmentId, searchText, projectId);
      setFeatures(res?.data?.data || []);
    } catch (err) {
      console.error("Error fetching features:", err);
      showToast("Failed to load features", "error");
    } finally {
      setLoadingFeatures(false);
    }
  };

  const handleAddFeature = async () => {
    try {
      setSubmitting(true);
      const response = await addFeatureToBackend(selectedFeature.id, projectId);
      if (response.success) onClose(true);
    } catch (err) {
      console.error("Error adding feature:", err);
      showToast({message: "Error adding feature", type:  "error"});
    } finally {
      setSubmitting(false);
    }
  };

  const isAddDisabled =
    submitting || !selectedDepartment || !selectedFeature;

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: "16px", p: 1 },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
        Add Feature to Project
      </DialogTitle>

      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={3} pt={1}>
          {/* Department Selector */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>
              Department
            </Typography>
            <TextField
              select
              fullWidth
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              placeholder="Select Department"
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          {/* Feature Search + Select */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>
              Feature
            </Typography>
            <Autocomplete
              key={selectedDepartment}
              disabled={!selectedDepartment}
              // disableCloseOnSelect={false}
              options={features}
              value={selectedFeature || null}
              getOptionLabel={(option) => option?.name || ""}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={loadingFeatures}
              inputValue={featureSearch ?? ""}
              onInputChange={(e, newInputValue, reason) => {
                // only update search text if user is typing or clearing
                if (reason === "input") {
                  setFeatureSearch(newInputValue);
                } else if (reason === "clear") {
                  setFeatureSearch("");
                  setSelectedFeature(null);
                }
              }}
              onChange={(e, newValue, reason) => {
                if (reason === "selectOption") {
                  setFeatureSearch(newValue?.name || "");
                  setSelectedFeature(newValue);
                } 
              }}
              noOptionsText={
                !selectedDepartment
                  ? "Select department first"
                  : loadingFeatures
                  ? "Loading..." 
                  : "No features found"
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  placeholder={
                    selectedDepartment
                      ? "Search or select feature"
                      : "Select department first"
                  }
                />
              )}
            />


          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={() => onClose(false)}
          color="inherit"
          variant="outlined"
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAddFeature}
          variant="contained"
          disabled={isAddDisabled}
        >
          {submitting ? <CircularProgress size={22} /> : "Add Feature"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

async function fetchFeaturesFromBackend(department_id, search_text = "", project_id) {
  const endpoint = BACKEND_ENDPOINT.department_features_not_in_project(department_id, project_id);
  const response = await backendRequest({
    endpoint,
    querySets: search_text ? `?name=${encodeURIComponent(search_text)}` : "",
  });

  if (!response.success)
    showToast({
      message: response.message || "Failed to fetch Features",
      type: "error",
    });

  return response;
}

async function addFeatureToBackend(featureId, projectId) {
  const endpoint = BACKEND_ENDPOINT.add_feature_to_project(featureId, projectId);
  const response = await backendRequest({
    endpoint,
  });

  showToast({
    message: response.message || (response.success ? "Updated Successfully" : "Failed to fetch Features"),
    type: response.success ? "success" : "error",
  });

  return response;
}
