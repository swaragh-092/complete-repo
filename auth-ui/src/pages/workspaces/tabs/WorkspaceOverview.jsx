import React from 'react';
import { Box, Paper, Typography, Grid, Chip, Divider } from '@mui/material';
import { 
  AccessTime as TimeIcon, 
  Fingerprint as IdIcon, 
  Group as MembersIcon,
  Description as DescIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

export default function WorkspaceOverview({ workspace }) {
  if (!workspace) return null;

  const stats = [
    { 
      label: 'Members', 
      value: workspace.member_count || '...', 
      icon: <MembersIcon color="primary" /> 
    },
    { 
      label: 'Created', 
      value: workspace.created_at ? formatDistanceToNow(new Date(workspace.created_at), { addSuffix: true }) : 'N/A', 
      icon: <TimeIcon color="action" /> 
    },
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Info Card */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>About</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DescIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
              </Box>
              <Typography variant="body1">
                {workspace.description || 'No description provided for this workspace.'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IdIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" color="text.secondary">Workspace ID (Slug):</Typography>
                <Chip label={workspace.slug} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
            </Box>
            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                Technical identifier used in API calls and URLs.
            </Typography>
          </Paper>
        </Grid>

        {/* Stats Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Statistics</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {stats.map((stat, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ 
                            p: 1.5, 
                            borderRadius: 2, 
                            bgcolor: 'action.hover',
                            display: 'flex'
                        }}>
                            {stat.icon}
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={600}>{stat.value}</Typography>
                            <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                        </Box>
                    </Box>
                ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
