// Author: Gururaj
// Created: 19th Jun 2025
// Description: Immediate Attention widget that surfaces blocked stories and overdue items needing action.
// Version: 1.0.0
// Modified:

import { Card, Box, Typography, Button } from "@mui/material";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { useNavigate } from "react-router-dom";

/**
 * Priority mapping using EXISTING data keys
 */
const PRIORITY_FLOW = [
  { source: "issue", key: "high_priority", level: "error" },
  { source: "task", key: "overdue", level: "error" },
  { source: "task", key: "approve_pending", level: "warning" },
];

const ICON_BY_LEVEL = {
  error: <ErrorOutlineOutlinedIcon />,
  warning: <WarningAmberOutlinedIcon />,
};

const COLOR_BY_LEVEL = {
  error: "#d32f2f",
  warning: "#ed6c02",
};

const ImmediateAttention = ({ issueData, taskData }) => {
  const navigate = useNavigate();

  let activeItem = null;

  for (const rule of PRIORITY_FLOW) {
    const dataSource = rule.source === "issue" ? issueData : taskData;
    const item = dataSource?.[rule.key];

    if (item && item.count > 0) {
      activeItem = { ...item, level: rule.level };
      break;
    }
  }

  // Nothing urgent → show nothing
  if (!activeItem) return null;

  return (
    <Card
      sx={{
        p: 2.5,
        mb: 3,
        borderLeft: `5px solid ${COLOR_BY_LEVEL[activeItem.level]}`,
        backgroundColor: "rgba(0,0,0,0.25)",
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Box
          sx={{
            color: COLOR_BY_LEVEL[activeItem.level],
            display: "flex",
            alignItems: "center",
          }}
        >
          {ICON_BY_LEVEL[activeItem.level]}
        </Box>

        <Box flexGrow={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Immediate Attention Required
          </Typography>

          <Typography fontWeight={600}>{activeItem.title}</Typography>

          <Typography variant="body2" color="text.secondary">
            {activeItem.count} item(s) need action
          </Typography>
        </Box>

        <Button variant="contained" color={activeItem.level === "error" ? "error" : "warning"} onClick={() => navigate(activeItem.navigate)}>
          Act Now
        </Button>
      </Box>
    </Card>
  );
};

export default ImmediateAttention;
