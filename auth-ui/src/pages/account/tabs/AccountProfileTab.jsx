import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

/**
 * InfoCard Component for displaying profile information
 */
function InfoCard({ icon: IconComponent, label, value, gradient }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <IconComponent sx={{ color: 'white', fontSize: 20 }} />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {value || 'Not specified'}
        </Typography>
      </Box>
    </Paper>
  );
}

/**
 * AccountProfileTab - Displays personal and work information
 */
export default function AccountProfileTab({ profile }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            height: '100%'
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2.5 }}>
            Personal Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <InfoCard 
                icon={PersonIcon} 
                label="Full Name" 
                value={`${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()}
                gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
              />
            </Grid>
            <Grid item xs={12}>
              <InfoCard 
                icon={EmailIcon} 
                label="Email Address" 
                value={profile?.email}
                gradient="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
              />
            </Grid>
            <Grid item xs={12}>
              <InfoCard 
                icon={PhoneIcon} 
                label="Mobile Number" 
                value={profile?.metadata?.mobile}
                gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            height: '100%'
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2.5 }}>
            Work Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <InfoCard 
                icon={WorkIcon} 
                label="Designation" 
                value={profile?.metadata?.designation}
                gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
              />
            </Grid>
            <Grid item xs={12}>
              <InfoCard 
                icon={BusinessIcon} 
                label="Department" 
                value={profile?.metadata?.department}
                gradient="linear-gradient(135deg, #ec4899 0%, #be185d 100%)"
              />
            </Grid>
            <Grid item xs={12}>
              <InfoCard 
                icon={BusinessIcon} 
                label="Primary Organization" 
                value={profile?.metadata?.primary_organization?.name}
                gradient="linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
}
