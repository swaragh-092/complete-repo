import { Box, Paper, Typography, Chip, Grid } from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';

/**
 * AccountPermissionsTab - Displays user's permissions grouped by organization
 */
export default function AccountPermissionsTab({ permissions }) {
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight={600}>
          Your Permissions
        </Typography>
        <Chip 
          label={`${permissions?.total || 0} Total`}
          size="small"
          sx={{
            bgcolor: 'primary.50',
            color: 'primary.700',
            fontWeight: 600
          }}
        />
      </Box>
      
      <Grid container spacing={2}>
        {Object.entries(permissions?.by_organization || {}).map(([orgId, orgData]) => (
          <Grid item xs={12} key={orgId}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <BusinessIcon sx={{ color: 'white', fontSize: 16 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {orgData.organization.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Role: {orgData.role}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                {orgData.permissions.map((permission, idx) => (
                  <Chip 
                    key={idx}
                    label={permission.name}
                    size="small"
                    sx={{
                      bgcolor: 'grey.100',
                      color: 'grey.700',
                      fontSize: '0.7rem',
                      height: 24
                    }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
