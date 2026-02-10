import { Box } from "@mui/material";
import Heading from "../../../components/Heading";
import StandUp from "./StandUp";
import OtherTasks from "./OtherTasks";

export default function DailyLog() {
  return (
    <>
      <Box p={2}>
        <Heading title={"Daily Logs"} subtitle="Your Daily Record of Work & Progress" />
        <StandUp />
        <OtherTasks />
      </Box>
    </>
  );
}
