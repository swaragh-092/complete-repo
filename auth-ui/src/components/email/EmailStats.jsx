import React from 'react';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import { Email, CheckCircle, Error, Schedule } from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography color="textSecondary" variant="subtitle2">
                    {title}
                </Typography>
                {icon}
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color }}>
                {value}
            </Typography>
        </CardContent>
    </Card>
);

const EmailStats = ({ stats, loading }) => {
    if (loading) return <Typography>Loading stats...</Typography>;
    if (!stats) return null;

    return (
        <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                    title="Total Emails" 
                    value={stats.total} 
                    icon={<Email color="primary" />} 
                    color="primary.main"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                    title="Sent" 
                    value={stats.sent} 
                    icon={<CheckCircle color="success" />} 
                    color="success.main"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                    title="Failed" 
                    value={stats.failed} 
                    icon={<Error color="error" />} 
                    color="error.main"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                    title="Queued" 
                    value={stats.queued} 
                    icon={<Schedule color="warning" />} 
                    color="warning.main"
                />
            </Grid>
        </Grid>
    );
};

export default EmailStats;
