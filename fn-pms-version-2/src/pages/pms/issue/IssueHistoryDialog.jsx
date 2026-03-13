import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Box, Typography, Divider, useTheme } from "@mui/material";
import backendRequest from "../../../util/request";
import BACKEND_ENDPOINT from "../../../util/urls";
import { showToast } from "../../../util/feedback/ToastService";
import { colorCodes } from "../../../theme";
import DoButton from "../../../components/button/DoButton";
import SimpleSkeleton from "../../../components/skeleton/SimpleSkeleton";

export default function IssueHistoryDialog({ open, onClose, issueId }) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  useEffect(() => {
    if (open && issueId) fetchHistory();
  }, [open, issueId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await backendRequest({ endpoint: BACKEND_ENDPOINT.issue_history(issueId) });

      if (response.success) {
        setHistory(response.data?.history || []);
      } else {
        showToast({ message: response.message || "Failed to GET Issue History", type: "error" });
        setHistory([]);
      }
    } catch (e) {
      console.error("Error fetching history:", e);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Issue History</DialogTitle>

      <DialogContent
        dividers
        sx={{
          height: "350px", // fixed height
          overflowY: "auto", // scroll
        }}
      >
        {loading ? (
          <Box display={"flex"} alignItems={"center"} justifyContent={"center"} height={"100%"} >
            <CircularProgress />
          </Box>
        ) : history.length === 0 ? (
          <Typography>No history found.</Typography>
        ) : (
          history.map((item, index) => {
            const formattedDate = new Date(item.created_at).toLocaleString();

            return (
              <Box key={index} mb={2}>
                <Typography variant="subtitle2" color={colors.warning.light}>
                  ● Action: {item.action_type} | {formattedDate}
                </Typography>

                <Typography variant="body2" mt={0.5}>
                  Comment: {item.comment || "-"}
                </Typography>

                {index !== history.length - 1 && <Divider sx={{ mt: 1 }} />}
              </Box>
            );
          })
        )}
      </DialogContent>

      <DialogActions>
        {/* <Button onClick={onClose} variant="contained">
          Close
        </Button> */}
        <DoButton onclick={onClose}>Close</DoButton>
      </DialogActions>
    </Dialog>
  );
}
