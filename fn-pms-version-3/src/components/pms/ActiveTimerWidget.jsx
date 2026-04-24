// Author: Copilot
// Description: Persistent bottom-right floating widget showing the currently running timer.
// Polls for active timer on mount. Stop can be done directly here.
// Version: 1.0.0

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Chip, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import StopIcon from "@mui/icons-material/Stop";
import TimerIcon from "@mui/icons-material/Timer";
import backendRequest from "../../util/request";
import BACKEND_ENDPOINT from "../../util/urls";
import { showToast } from "../../util/feedback/ToastService";
import { useWorkspace } from "../../context/WorkspaceContext";

function formatElapsed(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ActiveTimerWidget() {
  const [active, setActive] = useState(null); // currently running component
  const [elapsed, setElapsed] = useState(0);
  const [stopping, setStopping] = useState(false);
  const tickRef = useRef(null);
  const pollRef = useRef(null);
  const { currentWorkspace } = useWorkspace();

  const fetchActive = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.active_component_timer() });
      if (res?.success) {
        setActive(res.data || null);
      }
    } catch (_) { /* silent */ }
  }, [currentWorkspace?.id]);

  // Poll every 30s to stay in sync
  useEffect(() => {
    fetchActive();
    pollRef.current = setInterval(fetchActive, 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchActive]);

  // Live tick
  useEffect(() => {
    clearInterval(tickRef.current);
    if (active?.timer_status === "running" && active?.timer_started_at) {
      const base = active.total_work_time || 0; // minutes already logged
      const startedAt = new Date(active.timer_started_at).getTime();
      const computeElapsed = () => {
        const curSecs = Math.floor((Date.now() - startedAt) / 1000);
        setElapsed(base * 60 + curSecs);
      };
      computeElapsed();
      tickRef.current = setInterval(computeElapsed, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(tickRef.current);
  }, [active?.id, active?.timer_status, active?.timer_started_at, active?.total_work_time]);

  // Listen for custom events when other components start/stop timers
  useEffect(() => {
    const onTimerChange = () => fetchActive();
    window.addEventListener("pms:timer-changed", onTimerChange);
    return () => window.removeEventListener("pms:timer-changed", onTimerChange);
  }, [fetchActive]);

  const handleStop = async () => {
    if (!active) return;
    setStopping(true);
    const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.stop_component_timer(active.id) });
    setStopping(false);
    if (res?.success) {
      showToast({ message: "Timer stopped", type: "success" });
      setActive(null);
      window.dispatchEvent(new Event("pms:timer-changed"));
    } else {
      showToast({ message: res?.message || "Failed to stop timer", type: "error" });
    }
  };

  if (!active) return null;

  return (
    <Paper
      elevation={6}
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1400,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1,
        borderRadius: 3,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "success.main",
        minWidth: 220,
        maxWidth: 360,
      }}
    >
      <TimerIcon color="success" fontSize="small" />
      <Box flex={1} overflow="hidden">
        <Typography variant="caption" color="text.secondary" display="block" noWrap>
          Working on
        </Typography>
        <Typography variant="body2" fontWeight="bold" noWrap>
          {active.title}
        </Typography>
      </Box>
      <Chip
        label={formatElapsed(elapsed)}
        size="small"
        color="success"
        sx={{ fontWeight: "bold", fontVariantNumeric: "tabular-nums" }}
      />
      <Tooltip title="Stop Timer">
        <span>
          <IconButton
            size="small"
            color="error"
            onClick={handleStop}
            disabled={stopping}
          >
            <StopIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Paper>
  );
}

/** Call this after starting a timer to notify the widget */
export function notifyTimerStarted() {
  window.dispatchEvent(new Event("pms:timer-changed"));
}
