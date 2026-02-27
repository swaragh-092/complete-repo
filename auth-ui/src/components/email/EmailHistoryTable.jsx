import React, { useState } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, Chip, IconButton, Tooltip, TablePagination, CircularProgress 
} from '@mui/material';
import { Refresh, Replay } from '@mui/icons-material';
import { format } from 'date-fns';

const StatusChip = ({ status }) => {
    const colors = {
        sent: 'success',
        failed: 'error',
        queued: 'warning',
        sending: 'info'
    };
    return <Chip label={status} color={colors[status] || 'default'} size="small" />;
};

const EmailHistoryTable = ({ 
    data, count, page, rowsPerPage, loading, 
    onPageChange, onRowsPerPageChange, onResend 
}) => {
    return (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>Recipient</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No emails found</TableCell>
                            </TableRow>
                        ) : (
                            data.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell>
                                        {format(new Date(row.created_at), 'MMM d, HH:mm:ss')}
                                    </TableCell>
                                    <TableCell>{row.to}</TableCell>
                                    <TableCell>{row.type}</TableCell>
                                    <TableCell><StatusChip status={row.status} /></TableCell>
                                    <TableCell>{row.subject || '-'}</TableCell>
                                    <TableCell align="right">
                                        {row.status === 'failed' && (
                                            <Tooltip title="Resend">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => onResend(row.id)}
                                                    color="primary"
                                                >
                                                    <Replay fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={count || 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
            />
        </Paper>
    );
};

export default EmailHistoryTable;
