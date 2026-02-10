import { Box } from "@mui/material";
import ProjectList from "./ProjectList";
import ProjectPortfolioOverview from "./overview/ProjectPortfolioOverview";

export default function ProjectDashboard () {
    return (
        <>
            <Box padding={2}>
                <ProjectPortfolioOverview />
                <ProjectList />
            </Box>
        </>
    ) ;
}