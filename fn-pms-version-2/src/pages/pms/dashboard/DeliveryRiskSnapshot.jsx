import { Grid, Card, Typography, Stack, Box } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ScheduleIcon from "@mui/icons-material/Schedule";
import UpdateDisabledIcon from "@mui/icons-material/UpdateDisabled";
import { useNavigate } from "react-router-dom";
import { paths } from "../../../util/urls";

const RISK_META = {
  behindSchedule: {
    icon: <ScheduleIcon />,
    color: "#ffa726",
  },
  noRecentUpdate: {
    icon: <UpdateDisabledIcon />,
    color: "#ff7043",
  },
  nearDeadline: {
    icon: <WarningAmberIcon />,
    color: "#ef5350",
  },
};

const RiskCard = ({ label, count, icon, color, onClick }) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: "pointer",
        p: 2.5,
        borderRadius: 2,
        height: "100%",
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        },
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ color }}>{icon}</Box>

        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>

        <Typography variant="h4" fontWeight={700} sx={{ color }}>
          {count}
        </Typography>
      </Stack>
    </Card>
  );
};

const DeliveryRiskSnapshot = ({ data, loading }) => {
  const navigate = useNavigate();

  const DELIVERY_RISK_DATA = {
    behindSchedule: {
      label: "Near Deadline (14 days)",
      count: loading ? "..." :data?.near_deadline || 0,
      filter: "near_deadline",
    },
    noRecentUpdate: {
      label: "No Update (7 days)",
      count: loading ? "..." : data?.no_update || 0,
      filter: "no_update",
    },
    nearDeadline: {
      label: "Projects Passed Deadline",
      count: loading ? "..." : data?.overdue || 0,
      filter: "overdue",
    },
  };

  return (
    <Grid paddingBottom={3} container spacing={3}>
      {Object.entries(DELIVERY_RISK_DATA).map(([key, data]) => {
        const meta = RISK_META[key];

        return (
          <Grid item xs={12} md={4} key={key}>
            <RiskCard
              label={data.label}
              count={data.count}
              icon={meta.icon}
              color={meta.color}
              onClick={() => navigate(paths.projects(data.filter))}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default DeliveryRiskSnapshot;


