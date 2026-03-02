import { Card, CardContent, Typography, Grid, Box, useTheme } from '@mui/material';
import { Email, CheckCircle, Error, Schedule } from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ 
        height: '100%', 
        transition: 'all 0.3s ease', 
        '&:hover': { 
            transform: 'translateY(-4px)', 
            boxShadow: 4 
        } 
    }}>
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
    const theme = useTheme();

    if (loading) return <Typography>Loading stats...</Typography>;
    if (!stats) return null;

    const chartData = [
        { name: 'Sent', value: stats.sent, color: theme.palette.success.main },
        { name: 'Failed', value: stats.failed, color: theme.palette.error.main },
        { name: 'Queued/Sending', value: stats.queued + (stats.sending || 0), color: theme.palette.warning.main }
    ].filter(item => item.value > 0);

    return (
        <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={8}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <StatCard 
                            title="Total Emails" 
                            value={stats.total} 
                            icon={<Email color="primary" />} 
                            color="primary.main"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <StatCard 
                            title="Sent" 
                            value={stats.sent} 
                            icon={<CheckCircle color="success" />} 
                            color="success.main"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <StatCard 
                            title="Failed" 
                            value={stats.failed} 
                            icon={<Error color="error" />} 
                            color="error.main"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <StatCard 
                            title="Queued" 
                            value={stats.queued} 
                            icon={<Schedule color="warning" />} 
                            color="warning.main"
                        />
                    </Grid>
                </Grid>
            </Grid>
            
            <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', minHeight: 250 }}>
                    <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                            Delivery Breakdown
                        </Typography>
                        <Box sx={{ flexGrow: 1, minHeight: 200 }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box display="flex" alignItems="center" justifyItems="center" height="100%">
                                    <Typography color="textSecondary">No data available</Typography>
                                </Box>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default EmailStats;
