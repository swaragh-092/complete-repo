// Author: Gururaj
// Created: 22th May 2025
// Description: Dashboard page .
// Version: 1.0.0
// path : pages/dash.jsx
// Modified:


// MUI imports
import { Box, useTheme } from "@mui/material";
import { colorCodes } from "../../../theme";
import Heading from "../../../components/Heading";
import ImmediateAttention from "./ImmediateAttention";
import SummaryView from "./SummaryView";

// local imports


const WorkerDash = () => {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  return (
    <>
      <Box padding={2} >
        <Heading title={"Attentions"} />

        <ImmediateAttention issueData={issueData} taskData={taskData} />

        <Heading title={"Tasks Summery"} level={3} />
        <SummaryView data={taskData} />


        <Heading title={"Issues Summery"} level={3} />
        <SummaryView data={issueData} />
      </Box>
    </>
  );
};

export default WorkerDash;


const issueData = {
  open : {
    title : "Open Issues",
    count : 14,
    icon_name : "BugReportOutlinedIcon",
    color : "#1976d2",
    navigate : "/issues?status=open"
  },
  priority : {
    title : "High Priority",
    count : 13,
    icon_name : "PriorityHighOutlinedIcon",
    color : "#d32f2f",
    navigate : "/issues?priority=high"
  },
  mine : {
    title : "Assigned to Me",
    count : 9,
    icon_name : "AssignmentIndOutlinedIcon",
    color : "#388e3c",
    navigate : "/issues?assigned=me"
  },
  over_due : {
    title : "Overdue Issues",
    count : 2,
    icon_name : "WarningAmberOutlinedIcon",
    color : "#ed6c02",
    navigate : "/issues?filter=overdue"
  },
};

const taskData = {
  pending : {
    title : "Pending Tasks",
    count : 10,
    icon_name : "HourglassEmptyOutlinedIcon",
    color : "#6c757d",
    navigate : "/tasks?status=pending"
  },
  ongoing : {
    title : "Ongoing Tasks",
    count : 6,
    icon_name : "PlayCircleOutlineOutlinedIcon",
    color : "#1976d2",
    navigate : "/tasks?status=ongoing"
  },
  due_today : {
    title : "Due Today",
    count : 2,
    icon_name : "TodayOutlinedIcon",
    color : "#ed6c02",
    navigate : "/tasks?filter=today"
  },
  overdue : {
    title : "Overdue",
    count : 4,
    icon_name : "WarningAmberOutlinedIcon",
    color : "#d32f2f",
    navigate : "/tasks?filter=overdue"
  },
  help_needed : {
    title : "Overdue",
    count : 5,
    icon_name : "HelpOutlineOutlinedIcon",
    color : "#f57c00",
    navigate : "/tasks?filter=help_needed"
  },
};