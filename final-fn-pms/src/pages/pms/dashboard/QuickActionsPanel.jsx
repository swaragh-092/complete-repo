import { Card, Grid, Typography, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
// quickActions.config.js
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const QuickActionsPanel = () => {
  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" fontWeight={600} mb={2}>
        Quick Actions
      </Typography>

      <Grid container spacing={2}>
        {QUICK_ACTIONS.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.label}>
            <Button
              component={RouterLink}
              to={action.to}
              fullWidth
              startIcon={action.icon}
              sx={{
                justifyContent: "flex-start",
                p: 2,
                color: action.color,
                border: `1px solid ${action.color}`,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "rgba(255,255,255,0.02)",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              {action.label}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Card>
  );
};

export default QuickActionsPanel;




export const QUICK_ACTIONS = [
{
    label: "Review Critical Projects",
    icon: <ErrorOutlineIcon />,
    color: "#ef5350",
    to: "/projects?health=critical",
  },
  {
    label: "Create Project",
    icon: <AddCircleOutlineIcon />,
    color: "#66bb6a",
    to: "/projects?action=create",
  },  
];
