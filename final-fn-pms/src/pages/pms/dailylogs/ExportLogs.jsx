import { useEffect, useState } from "react";
import { Box, Paper, Typography, TextField, Button, Grid, Alert, CircularProgress, Autocomplete, Divider } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import BACKEND_ENDPOINT from "../../../util/urls";
import backendRequest from "../../../util/request";
import { showToast } from "../../../util/feedback/ToastService";

const getYesterdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
};

const get365DaysAgoDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 365);
  return date.toISOString().split("T")[0];
};

export default function ExportLogs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter states
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [fromDate, setFromDate] = useState(get365DaysAgoDate());
  const [toDate, setToDate] = useState(getYesterdayDate());
  const [includeDateRange, setIncludeDateRange] = useState(false);

  // Dropdown data
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Load projects and users on mount
  useEffect(() => {
    loadProjects();
    loadUsers();
    loadDepartments();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await backendRequest({
        endpoint: BACKEND_ENDPOINT.get_user_projects,
      });
      if (response.success && response.data) {
        setProjects(response.data);
      }
    } catch (err) {
      console.error("Error loading projects:", err);
    }
  };

  const loadUsers = async () => {
    try {
      // This endpoint may vary based on your actual API
      const endpoint = {
        path: "https://pms.local.test/pms_mod/user", // Adjust as needed
        method: "GET",
      };
      const response = await backendRequest({ endpoint });
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  const loadDepartments = async () => {
    try {
      // This endpoint may vary based on your actual API
      const endpoint = {
        path: "https://pms.local.test/pms_mod/department", // Adjust as needed
        method: "GET",
      };
      const response = await backendRequest({ endpoint });
      if (response.success && response.data) {
        setDepartments(response.data);
      }
    } catch (err) {
      console.error("Error loading departments:", err);
    }
  };

  const validateFilters = () => {
    setError("");

    // Check at least one mandatory filter
    if (!selectedProject && !selectedUser && !selectedDepartment) {
      setError("At least one filter (Project, User, or Department) is required");
      return false;
    }

    // Validate date range if included
    if (includeDateRange) {
      if (!fromDate || !toDate) {
        setError("Both start and end dates are required");
        return false;
      }

      const from = new Date(fromDate);
      const to = new Date(toDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (to > today) {
        setError("End date cannot be in the future");
        return false;
      }

      if (from > to) {
        setError("Start date cannot be after end date");
        return false;
      }

      const diffDays = Math.floor((to - from) / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        setError("Date range cannot exceed 365 days");
        return false;
      }
    }

    return true;
  };

  const handleExport = async () => {
    if (!validateFilters()) {
      return;
    }

    setLoading(true);
    setSuccess("");

    try {
      const params = new URLSearchParams();

      if (selectedProject) {
        params.append("project", selectedProject.id || selectedProject);
      }
      if (selectedUser) {
        params.append("user", selectedUser.id || selectedUser);
      }
      if (selectedDepartment) {
        params.append("department", selectedDepartment.id || selectedDepartment);
      }
      if (includeDateRange && fromDate && toDate) {
        params.append("fromDate", fromDate);
        params.append("toDate", toDate);
      }

      const url = `${BACKEND_ENDPOINT.exportExcel.path}?${params.toString()}`;

      // Fetch the file
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to export file");
        setLoading(false);
        return;
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      // Extract filename from response headers or use default
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "Daily-Logs-Report.xlsx";
      if (contentDisposition && contentDisposition.includes("filename")) {
        filename = contentDisposition.split("filename=")[1].replace(/"/g, "").split(";")[0];
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess("Excel file downloaded successfully!");
      showToast({
        message: "Report exported successfully!",
        type: "success",
      });

      // Reset form after success
      setSelectedProject(null);
      setSelectedUser(null);
      setSelectedDepartment(null);
      setIncludeDateRange(false);
    } catch (err) {
      console.error("Export error:", err);
      setError("Error exporting file: " + err.message);
      showToast({
        message: "Error exporting report",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: "bold" }}>
        📊 Export Daily Logs to Excel
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Select at least one filter (Project, User, or Department) to export logs. Optionally add a date range (maximum 365 days).
      </Typography>

      <Grid container spacing={3}>
        {/* Mandatory Filters Section */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 2 }}>
            📋 Mandatory Filters (Select at least one)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete options={projects} getOptionLabel={(option) => option.name || option.project_name || ""} value={selectedProject} onChange={(event, newValue) => setSelectedProject(newValue)} renderInput={(params) => <TextField {...params} label="Project" placeholder="Select a project" size="small" />} />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete options={users} getOptionLabel={(option) => option.name || option.email || ""} value={selectedUser} onChange={(event, newValue) => setSelectedUser(newValue)} renderInput={(params) => <TextField {...params} label="User" placeholder="Select a user" size="small" />} />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete options={departments} getOptionLabel={(option) => option.name || option.department_name || ""} value={selectedDepartment} onChange={(event, newValue) => setSelectedDepartment(newValue)} renderInput={(params) => <TextField {...params} label="Department" placeholder="Select a department" size="small" />} />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        {/* Optional Date Range Section */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 2,
              gap: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              📅 Optional: Date Range (Max 365 days)
            </Typography>
            <Button
              variant={includeDateRange ? "contained" : "outlined"}
              size="small"
              onClick={() => {
                setIncludeDateRange(!includeDateRange);
                if (!includeDateRange) {
                  setFromDate(get365DaysAgoDate());
                  setToDate(getYesterdayDate());
                }
              }}
              color={includeDateRange ? "success" : "primary"}
            >
              {includeDateRange ? "✓ Enabled" : "Add Date Range"}
            </Button>
          </Box>

          {includeDateRange && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Start Date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" inputProps={{ max: getYesterdayDate() }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="End Date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" inputProps={{ max: getYesterdayDate() }} />
              </Grid>
            </Grid>
          )}
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        {/* Export Button */}
        <Grid item xs={12}>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedProject(null);
                setSelectedUser(null);
                setSelectedDepartment(null);
                setIncludeDateRange(false);
                setError("");
                setSuccess("");
              }}
            >
              Clear Filters
            </Button>
            <Button variant="contained" color="primary" startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />} onClick={handleExport} disabled={loading} sx={{ minWidth: 150 }}>
              {loading ? "Exporting..." : "Export to Excel"}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Info Box */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: "#f0f8ff", borderRadius: 1 }}>
        <Typography variant="caption" color="textSecondary">
          <strong>📌 Report Includes:</strong> Detailed logs, project summary, task summary, user summary, department summary, and overall statistics
        </Typography>
      </Box>
    </Paper>
  );
}
