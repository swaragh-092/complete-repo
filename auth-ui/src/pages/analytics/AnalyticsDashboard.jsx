import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Breadcrumbs,
  Link
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

import SessionStatsChart from '../../components/analytics/SessionStatsChart';
import LoginStatsChart from '../../components/analytics/LoginStatsChart';

function AnalyticsDashboard() {
  const { realmName } = useParams();
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          component="button" 
          color="inherit" 
          onClick={() => navigate(`/realms/${realmName}`)}
        >
          {realmName}
        </Link>
        <Typography color="text.primary">Analytics</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/realms/${realmName}`)}>
          Back
        </Button>
        <Typography variant="h4">Realm Analytics</Typography>
      </Box>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SessionStatsChart realmName={realmName} />
        </Grid>
        <Grid item xs={12} md={6}>
          <LoginStatsChart realmName={realmName} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default AnalyticsDashboard;
