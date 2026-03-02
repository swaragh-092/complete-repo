import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Card, CardContent, Divider, TextField, 
    Button, Grid, Alert, CircularProgress, Select, MenuItem,
    FormControl, InputLabel, Table, TableBody, TableCell, TableHead, TableRow, IconButton
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../hooks/useToast';
import { emailService } from '../../services/emailService';

// Standard expected templates in the system
const SYSTEM_TEMPLATES = [
    'WELCOME_EMAIL',
    'PASSWORD_RESET',
    'INVITATION',
    '2FA_CODE'
];

const EmailTemplates = ({ orgId }) => {
    const { showSuccess, showError } = useToast();
    const queryClient = useQueryClient();
    const [editingTemplate, setEditingTemplate] = useState(null);

    const [formData, setFormData] = useState({
        templateName: '',
        subject: '',
        htmlContent: ''
    });

    const { data: currentSettings, isLoading } = useQuery({
        queryKey: ['orgSettings', orgId],
        queryFn: () => emailService.getOrgSettings(orgId),
        enabled: !!orgId,
    });

    const storedTemplates = currentSettings?.email_templates || {};

    const mutation = useMutation({
        mutationFn: (newTemplates) => emailService.updateOrgSettings(orgId, {
            ...currentSettings,
            email_templates: newTemplates
        }),
        onSuccess: () => {
            showSuccess('Email templates updated successfully');
            queryClient.invalidateQueries(['orgSettings', orgId]);
            setEditingTemplate(null);
            setFormData({ templateName: '', subject: '', htmlContent: '' });
        },
        onError: () => {
            showError('Failed to update email templates');
        }
    });

    const handleEdit = (name) => {
        const tpl = storedTemplates[name] || { subject: '', htmlContent: '' };
        setEditingTemplate(name);
        setFormData({
            templateName: name,
            subject: tpl.subject || '',
            htmlContent: tpl.htmlContent || ''
        });
    };

    const handleDelete = (name) => {
        if(window.confirm(`Are you sure you want to remove the custom template for ${name}? It will revert to the system default.`)) {
            const updated = { ...storedTemplates };
            delete updated[name];
            mutation.mutate(updated);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.templateName) {
            showError("Please select a template name.");
            return;
        }

        const updated = {
            ...storedTemplates,
            [formData.templateName]: {
                subject: formData.subject,
                htmlContent: formData.htmlContent
            }
        };

        mutation.mutate(updated);
    };

    if (isLoading) return <CircularProgress />;

    if (!orgId) {
        return (
            <Alert severity="warning">
                Please enter into an Organization context to manage Email Templates.
            </Alert>
        );
    }

    return (
        <Box>
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {editingTemplate ? `Edit Template: ${editingTemplate}` : 'Create / Override Template'}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Template Type</InputLabel>
                                    <Select
                                        name="templateName"
                                        value={formData.templateName}
                                        label="Template Type"
                                        onChange={handleChange}
                                        disabled={!!editingTemplate}
                                    >
                                        {SYSTEM_TEMPLATES.map(t => (
                                            <MenuItem key={t} value={t}>{t}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <TextField
                                    fullWidth
                                    label="Email Subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={8}
                                    label="HTML Content"
                                    name="htmlContent"
                                    value={formData.htmlContent}
                                    onChange={handleChange}
                                    placeholder="<p>Hello {{name}},</p>"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} display="flex" gap={2}>
                                <Button 
                                    type="submit" 
                                    variant="contained" 
                                    color="primary"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? 'Saving...' : 'Save Template'}
                                </Button>
                                {editingTemplate && (
                                    <Button 
                                        variant="outlined" 
                                        onClick={() => {
                                            setEditingTemplate(null);
                                            setFormData({ templateName: '', subject: '', htmlContent: '' });
                                        }}
                                    >
                                        Cancel Edit
                                    </Button>
                                )}
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Active Custom Templates
                    </Typography>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Template Name</TableCell>
                                <TableCell>Subject</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.keys(storedTemplates).length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">
                                        No custom templates found. System defaults are being used.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                Object.entries(storedTemplates).map(([name, data]) => (
                                    <TableRow key={name}>
                                        <TableCell>{name}</TableCell>
                                        <TableCell>{data.subject}</TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleEdit(name)} color="primary">
                                                <Edit />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(name)} color="error">
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </Box>
    );
};

export default EmailTemplates;
