import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Card, CardContent, Divider, TextField, 
    Button, Grid, Alert, CircularProgress, Switch, FormControlLabel
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../hooks/useToast';
import { emailService } from '../../services/emailService';

const EmailSettings = ({ orgId }) => {
    const { showSuccess, showError } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        host: '',
        port: '',
        user: '',
        password: '',
        isEnabled: false
    });

    const { data: currentSettings, isLoading } = useQuery({
        queryKey: ['orgSettings', orgId],
        queryFn: () => emailService.getOrgSettings(orgId),
        enabled: !!orgId,
    });

    useEffect(() => {
        if (currentSettings && currentSettings.email_provider_config) {
            const config = currentSettings.email_provider_config;
            setFormData({
                host: config.host || '',
                port: config.port || '',
                user: config.user || '',
                password: config.password || '',
                isEnabled: config.isEnabled || false
            });
        }
    }, [currentSettings]);

    const mutation = useMutation({
        mutationFn: (newSettings) => emailService.updateOrgSettings(orgId, {
            ...currentSettings,
            email_provider_config: newSettings
        }),
        onSuccess: () => {
            showSuccess('Email settings updated successfully');
            queryClient.invalidateQueries({ queryKey: ['orgSettings', orgId] });
        },
        onError: () => {
            showError('Failed to update email settings');
        }
    });

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    if (isLoading) return <CircularProgress />;

    if (!orgId) {
        return (
            <Alert severity="warning">
                Please enter into an Organization context to manage Email Settings.
            </Alert>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    SMTP Provider Configuration
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Alert severity="info" sx={{ mb: 3 }}>
                    These settings will override the system default SMTP configuration for this organization.
                </Alert>

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        name="isEnabled"
                                        checked={formData.isEnabled}
                                        onChange={handleChange}
                                        color="primary"
                                    />
                                }
                                label="Enable Custom SMTP for this Organization"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={8}>
                            <TextField
                                fullWidth
                                label="SMTP Host"
                                name="host"
                                value={formData.host}
                                onChange={handleChange}
                                disabled={!formData.isEnabled}
                                placeholder="smtp.mailgun.org"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="SMTP Port"
                                name="port"
                                value={formData.port}
                                onChange={handleChange}
                                disabled={!formData.isEnabled}
                                placeholder="587"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Username"
                                name="user"
                                value={formData.user}
                                onChange={handleChange}
                                disabled={!formData.isEnabled}
                                placeholder="postmaster@yourdomain.com"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={!formData.isEnabled}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button 
                                type="submit" 
                                variant="contained" 
                                color="primary"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </CardContent>
        </Card>
    );
};

export default EmailSettings;
