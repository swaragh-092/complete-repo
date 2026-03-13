import { Box } from "@mui/material";
import { useState } from "react";
import ProjectList from "./ProjectList";
import ProjectPortfolioOverview from "./overview/ProjectPortfolioOverview";
import MemberProjectOverview from "./overview/MemberProjectOverview";
import { useWorkspace } from "../../../context/WorkspaceContext";

export default function ProjectDashboard() {
  const [overviewRefresh, setOverviewRefresh] = useState(0);
  const { currentWorkspace } = useWorkspace();
  const isAdmin = currentWorkspace?.role === "admin";

  return (
    <>
      <Box padding={2}>
        {isAdmin ? <ProjectPortfolioOverview refresh={overviewRefresh} /> : <MemberProjectOverview refresh={overviewRefresh} />}
        <ProjectList onProjectCreated={() => setOverviewRefresh((r) => r + 1)} />
      </Box>
    </>
  );
}
