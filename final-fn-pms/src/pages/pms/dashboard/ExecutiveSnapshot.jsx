import { Grid, Card, Box, Typography, Stack, Skeleton } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { useNavigate } from "react-router-dom";
import { paths } from "../../../util/urls";

const SNAPSHOT_META = {
  ongoing: {
    color: "#4fc3f7",
    route: paths.projects("ongoing"),
  },
  onTrack: {
    color: "#66bb6a",
    route: paths.projects("on_track"),
  },
  atRisk: {
    color: "#ffa726",
    route: paths.projects("at_risk"),
  },
  critical: {
    color: "#ef5350",
    route: paths.projects("critical"),
  },
};

const SnapshotCard = ({ label, count, trend, color, onClick }) => {
  const isPositive = trend >= 0;

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: "pointer",
        p: 2.5,
        height: "100%",
        borderRadius: 2,
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        },
      }}
    >
      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>

        <Typography variant="h4" fontWeight={700}>
          {count}
        </Typography>

        <Stack direction="row" spacing={0.5} alignItems="center">
          {isPositive ? <TrendingUpIcon fontSize="small" sx={{ color }} /> : <TrendingDownIcon fontSize="small" sx={{ color }} />}

          <Typography variant="caption" sx={{ color }}>
            {Math.abs(trend)} vs last period
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
};

const ExecutiveSnapshot = ({ data, loading }) => {
  const EXECUTIVE_SNAPSHOT_DATA = {
    ongoing: {
      label: "Ongoing Projects",
      count: data?.ongoingProjects,
      trend: +3, // positive = up, negative = down
    },
    onTrack: {
      label: "On Track",
      count: data?.healthoverview?.counts?.safe,
      trend: +2,
    },
    atRisk: {
      label: "At Risk",
      count: data?.healthoverview?.counts?.at_risk,
      trend: -1,
    },
    critical: {
      label: "Critical",
      count: data?.healthoverview?.counts?.critical,
      trend: +1,
    },
  };

  const navigate = useNavigate();

  return (
    <>
      {loading ?
        <Box
          sx={{ display: 'flex', gap: 2, padding: 1 }}
        >
        <Skeleton
          sx={{ bgcolor: 'grey.100' }}
          variant="rectangular"
          width={210}
          height={100}
        />
        <Skeleton
          sx={{ bgcolor: 'grey.100' }}
          variant="rectangular"
          width={210}
          height={100}
        />
        <Skeleton
          sx={{ bgcolor: 'grey.100' }}
          variant="rectangular"
          width={210}
          height={100}
        />
        </Box>
        :
        <Grid container spacing={3}>
          {Object.entries(EXECUTIVE_SNAPSHOT_DATA).map(([key, data]) => {
            const meta = SNAPSHOT_META[key];

            return (
              <Grid paddingBottom={3} item xs={12} sm={6} md={3} key={key}>
                <SnapshotCard label={data.label} count={data.count} trend={data.trend} color={meta.color} onClick={() => navigate(meta.route)} />
              </Grid>
            );
          })}
        </Grid>
      }

      
    </>
  );
};

export default ExecutiveSnapshot;
