import { Box } from "@mui/material";
import Heading from "../../../components/Heading";
import StandUp from "./StandUp";
import OtherTasks from "./OtherTasks";
import { useState } from "react";
import ReportsLog from "./ReportsLog";
import ExportLogs from "./ExportLogs";

export default function DailyLog() {
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const handleReload = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  return (
    <>
      <Box p={2}>
        <Heading title={"Daily Logs"} subtitle="Your Daily Record of Work & Progress" />
        <StandUp reloadTrigger={reloadTrigger} onTaskChange={handleReload} />
        <OtherTasks reloadTrigger={reloadTrigger} onTaskChange={handleReload} />
      </Box>

      <Box p={2}>
        <ExportLogs />
      </Box>

      <Box p={2}>
        <ReportsLog />
      </Box>
    </>
  );
}
