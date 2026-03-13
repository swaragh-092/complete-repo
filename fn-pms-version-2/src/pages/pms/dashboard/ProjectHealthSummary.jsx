// ...existing code...
import { Grid, Card, CardActionArea, CardContent, Box, Typography, Chip, LinearProgress, Stack, Avatar, Divider, Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Heading from "../../../components/Heading";
import { formatTextForDataTable } from "../../../util/helper";
import { paths } from "../../../util/urls";

const HEALTH_META = {
  on_track: { label: "On Track", color: "success" },
  at_risk: { label: "At Risk", color: "warning" },
  critical: { label: "Critical", color: "error" },
};

const ProjectHealthSummary = ({ projects, loading }) => {
  const navigate = useNavigate();
  const projectsWithAllRisky = [...(projects?.risky ?? [])];

  console.log("Projects with all risky:", projectsWithAllRisky);
  console.log("Loading state:", projects);

  return (
    <>
      {loading ? (
        <>
          <Skeleton variant="rectangular" width={210} height={118} />
          <Box sx={{ pt: 0.5 }}>
            <Skeleton />
            <Skeleton />
          </Box>
        </>
      ) : (
        projectsWithAllRisky.length > 0 && (
          <>
            <Heading title={"Projects Needs Attention"} level={3} />
            <Grid paddingBottom={3} container spacing={3}>
              {projectsWithAllRisky.map((project) => {
                const health = HEALTH_META[project.health];

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
                    <Card
                      sx={{
                        height: "100%",
                        
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      elevation={0}
                    >
                      <CardActionArea
                        onClick={() => navigate(`${paths.projectDetail(project.id).actualPath}`)}
                        sx={{
                          height: "100%",
                          alignItems: "stretch",
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={2}>
                            {/* Header */}
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar
                                sx={{
                                  width: 36,
                                  height: 36,
                                  bgcolor: (theme) => theme.palette[health.color]?.main || "grey",
                                  fontWeight: 700,
                                }}
                              >
                                {health.label[0]}
                              </Avatar>

                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight={700}
                                  title={ formatTextForDataTable( project.name )}
                                  sx={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    width: "200px",
                                    textOverflow: "ellipsis",
                                    lineHeight: 1.2,
                                  }}
                                >
                                  { formatTextForDataTable( project.name )}
                                </Typography>

                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                  {health.label}
                                </Typography>
                              </Box>

                              <Chip label={`${calculateCompletion(project.ongoing_tasks, project.total_tasks)}%`} size="small" sx={{ fontWeight: 700 }} />
                            </Box>

                            {/* Progress */}
                            <Box>
                              <LinearProgress
                                variant="determinate"
                                value={calculateCompletion(project.ongoing_tasks, project.total_tasks)}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: "action.selected",
                                  "& .MuiLinearProgress-bar": {
                                    borderRadius: 4,
                                    background: "linear-gradient(90deg, rgba(76,175,80,1) 0%, rgba(63,81,181,1) 100%)",
                                  },
                                }}
                              />
                            </Box>

                            {/* Stats */}
                            <Box>
                              <Divider />
                              <Box display="flex" justifyContent="space-between" textAlign="center" pt={2}>
                                <Box flex={1}>
                                  <Typography fontWeight={700} variant="h6">
                                    {project.overdue_tasks}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Overdue
                                  </Typography>
                                </Box>

                                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                                <Box flex={1}>
                                  <Typography fontWeight={700} variant="h6">
                                    {project.high_issues}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    High Priority
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )
      )}
    </>
  );
};

export default ProjectHealthSummary;


const calculateCompletion = (completed, total) => {
  if (!total || !completed) return 0;
  return Math.round((completed / total) * 100);
};