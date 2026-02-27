import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Button, Container, Alert } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useToast } from '../hooks/useToast';
import { emailService } from '../services/emailService';
import EmailStats from '../components/email/EmailStats';
import EmailHistoryTable from '../components/email/EmailHistoryTable';

const EmailDashboard = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orgId, setOrgId] = useState(null); // Set this if filtering by org (e.g. from context)
    const { showSuccess, showError, showWarning, showInfo, enqueueSnackbar } = useToast();
    const queryClient = useQueryClient();

    // Fetch Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['emailStats', orgId],
        queryFn: () => emailService.getStats({ org_id: orgId })
    });

    // Fetch History
    const { data: historyData, isLoading: historyLoading } = useQuery({
        queryKey: ['emailHistory', orgId, page, rowsPerPage],
        queryFn: () => emailService.getHistory({ 
            org_id: orgId, 
            page: page + 1, // API is 1-indexed
            limit: rowsPerPage 
        })
    });

    // Resend Mutation
    const resendMutation = useMutation({
        mutationFn: emailService.resend,
        onSuccess: () => {
            showSuccess('Email resent successfully');
            queryClient.invalidateQueries(['emailHistory']);
            queryClient.invalidateQueries(['emailStats']);
        },
        onError: (err) => {
            showError('Failed to resend email');
        }
    });

    const handlePageChange = (event, newPage) => setPage(newPage);
    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Email Dashboard
                </Typography>
                <Button 
                    startIcon={<Refresh />} 
                    onClick={() => {
                        queryClient.invalidateQueries(['emailStats']);
                        queryClient.invalidateQueries(['emailHistory']);
                    }}
                >
                    Refresh
                </Button>
            </Box>

            <EmailStats stats={stats} loading={statsLoading} />

            <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                    Email History
                </Typography>
                <EmailHistoryTable 
                    data={historyData?.rows || []}
                    count={historyData?.count || 0}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    loading={historyLoading}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onResend={(id) => resendMutation.mutate(id)}
                />
            </Box>
        </Container>
    );
};

export default EmailDashboard;
