import { useEffect, useState } from "react";
import Heading from "../../../components/Heading";
import { Box, Paper, Typography, CircularProgress, Grid, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Pagination, TextField, Button, Alert } from "@mui/material";
import BACKEND_ENDPOINT from "../../../util/urls";
import backendRequest from "../../../util/request";
import { convertMinutes, formatTextForDataTable } from "../../../util/helper";

const PAGE_SIZE = 10;
const MAX_DAYS = 30;

// Helper function to get yesterday's date as YYYY-MM-DD
const getYesterdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
};

// Helper function to get date 30 days ago as YYYY-MM-DD
const get30DaysAgoDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split("T")[0];
};

export default function ReportsLog() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState(getYesterdayDate());
  const [toDate, setToDate] = useState(getYesterdayDate());
  const [dateError, setDateError] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState(getYesterdayDate());

  useEffect(() => {
    fetchReport(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateRange]);

  useEffect(() => {
    fetchReport(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const validateDateRange = (from, to) => {
    if (!from || !to) {
      setDateError("Both dates are required");
      return false;
    }

    const fromTime = new Date(from).getTime();
    const toTime = new Date(to).getTime();

    if (fromTime > toTime) {
      setDateError("Start date cannot be after end date");
      return false;
    }

    const diffDays = Math.ceil((toTime - fromTime) / (1000 * 60 * 60 * 24));
    if (diffDays > MAX_DAYS) {
      setDateError(`Date range cannot exceed ${MAX_DAYS} days`);
      return false;
    }

    setDateError("");
    return true;
  };

  const handleApplyDateRange = () => {
    if (validateDateRange(fromDate, toDate)) {
      setSelectedDateRange(`${fromDate}_to_${toDate}`);
    }
  };

  const fetchReport = async (pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      const endpoint = {
        ...BACKEND_ENDPOINT.productivitySummary,
        path: `${BACKEND_ENDPOINT.productivitySummary.path}?page=${pageNum}&pageSize=${PAGE_SIZE}&from=${fromDate}&to=${toDate}`,
      };
      const res = await backendRequest({ endpoint });
      if (!res.success) {
        setError("Failed to fetch report here.");
      } else {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching report.");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Box p={2}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Heading title="Project Analytics" subtitle="Ongoing Projects: Working Hours, Tasks, and Logs" />
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box p={2}>
        <Heading title="Project Analytics" subtitle="Ongoing Projects: Working Hours, Tasks, and Logs" />
        <Typography>No data available.</Typography>
      </Box>
    );
  }

  const totalPages = Math.ceil((data.total_logs || 0) / PAGE_SIZE);

  return (
    <Box p={2}>
      <Heading title="Project Analytics" subtitle="Ongoing Projects: Working Hours, Tasks, and Logs" />

      {/* Date Range Selector */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: "#fafafa" }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Current Selection:
          </Typography>
          <Typography variant="h6" color="primary" sx={{ fontWeight: "bold" }}>
            {fromDate === toDate ? `📅 ${fromDate}` : `📅 ${fromDate} to ${toDate}`}
          </Typography>
        </Box>
        <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, color: "#666" }}>
          Select Date or Date Range (Maximum 30 days)
        </Typography>
        {dateError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {dateError}
          </Alert>
        )}
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={5}>
            <TextField label="From Date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth inputProps={{ max: getYesterdayDate() }} />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField label="To Date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth inputProps={{ max: getYesterdayDate() }} />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button variant="contained" color="primary" fullWidth sx={{ height: 56 }} onClick={handleApplyDateRange}>
              Apply
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Totals {fromDate === toDate ? `(${fromDate})` : `(${fromDate} to ${toDate})`}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Chip label={`Total Working: ${convertMinutes(data.total_working_minutes)}`} color="primary" variant="outlined" sx={{ width: "100%" }} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Chip label={`Completed Tasks: ${data.total_completed_tasks}`} color="success" variant="outlined" sx={{ width: "100%" }} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Chip label={`Ongoing Tasks: ${data.total_ongoing_tasks}`} color="warning" variant="outlined" sx={{ width: "100%" }} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Chip label={`Total Logs: ${data.total_logs}`} color="info" variant="outlined" sx={{ width: "100%" }} />
          </Grid>
        </Grid>
      </Paper>

      {/* Project-wise Breakdown Table */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Project-wise Breakdown
        </Typography>
        {data.projects && data.projects.length > 0 ? (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 500 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Project</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Working Time
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Completed Tasks
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Ongoing Tasks
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.projects.map((proj) => (
                  <TableRow key={proj.id} hover>
                    <TableCell>{proj.name}</TableCell>
                    <TableCell align="right">{convertMinutes(proj.total_working_minutes || 0)}</TableCell>
                    <TableCell align="right">{proj.completed_tasks || 0}</TableCell>
                    <TableCell align="right">{proj.ongoing_tasks || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No ongoing projects found.
          </Typography>
        )}
      </Paper>

      {/* Paginated Logs Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Daily Logs (Page {page} of {totalPages})
        </Typography>
        {data.logs && data.logs.length > 0 ? (
          <>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Project</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Task</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Duration
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.logs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{log.project?.name || "-"}</TableCell>
                      <TableCell>{log.task?.title || "-"}</TableCell>
                      <TableCell>{formatTextForDataTable(log.task?.status || "-")}</TableCell>
                      <TableCell align="right">{convertMinutes(log.actual_duration || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination count={totalPages} page={page} onChange={(event, value) => setPage(value)} color="primary" />
              </Box>
            )}
          </>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No logs found.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
