import React, { useState } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, Chip, IconButton, Tooltip, TablePagination, 
    Box, Typography, Select, MenuItem, FormControl, InputLabel, Skeleton, Collapse
} from '@mui/material';
import { Replay, KeyboardArrowDown, KeyboardArrowUp, ErrorOutline } from '@mui/icons-material';
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

const Row = ({ row, onResend }) => {
    const [open, setOpen] = useState(false);

    return (
        <React.Fragment>
            <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                </TableCell>
                <TableCell>{format(new Date(row.created_at), 'MMM d, HH:mm:ss')}</TableCell>
                <TableCell>{row.to}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell><StatusChip status={row.status} /></TableCell>
                <TableCell>{row.scope}</TableCell>
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
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="subtitle2" gutterBottom component="div">
                                Log Details (ID: {row.id})
                            </Typography>
                            {row.subject && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Subject</Typography>
                                    <Typography variant="body2">{row.subject}</Typography>
                                </Box>
                            )}
                            {row.error && (
                                <Box>
                                    <Typography variant="body2" color="error">Error Message</Typography>
                                    <Paper sx={{ p: 1, bgcolor: '#fff4f4', mt: 0.5, overflowX: 'auto' }}>
                                        <Typography variant="body2" component="pre" sx={{ m: 0 }}>
                                            {row.error}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                            {row.metadata && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Payload Metadata</Typography>
                                    <Paper sx={{ p: 1, bgcolor: '#f5f5f5', mt: 0.5, overflowX: 'auto' }}>
                                        <Typography variant="body2" component="pre" sx={{ m: 0 }}>
                                            {JSON.stringify(row.metadata, null, 2)}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
};

const EmailHistoryTable = ({ 
    data, count, page, rowsPerPage, loading, 
    status, type, onStatusChange, onTypeChange,
    onPageChange, onRowsPerPageChange, onResend 
}) => {
    return (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ flexGrow: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Filter Records
                </Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id="status-filter-label">Status</InputLabel>
                    <Select
                        labelId="status-filter-label"
                        id="status-filter"
                        value={status || ''}
                        label="Status"
                        onChange={onStatusChange}
                    >
                        <MenuItem value=""><em>All</em></MenuItem>
                        <MenuItem value="sent">Sent</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                        <MenuItem value="queued">Queued</MenuItem>
                        <MenuItem value="sending">Sending</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id="type-filter-label">Type</InputLabel>
                    <Select
                        labelId="type-filter-label"
                        id="type-filter"
                        value={type || ''}
                        label="Type"
                        onChange={onTypeChange}
                    >
                        <MenuItem value=""><em>All</em></MenuItem>
                        <MenuItem value="invite">Invite</MenuItem>
                        <MenuItem value="notification">Notification</MenuItem>
                        <MenuItem value="alert">Alert</MenuItem>
                        <MenuItem value="verification">Verification</MenuItem>
                        <MenuItem value="password-reset">Password Reset</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            <TableContainer>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell width={50} />
                            <TableCell>Time</TableCell>
                            <TableCell>Recipient</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Scope</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            Array.from(new Array(rowsPerPage)).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton variant="circular" width={24} height={24} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={120} /></TableCell>
                                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                                    <TableCell><Skeleton variant="rounded" width={80} height={24} /></TableCell>
                                    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                                    <TableCell align="right">
                                        <Box display="flex" justifyContent="flex-end">
                                            <Skeleton variant="circular" width={28} height={28} />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                    <Box display="flex" flexDirection="column" alignItems="center" color="text.secondary">
                                        <ErrorOutline sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                        <Typography variant="h6">No emails found</Typography>
                                        <Typography variant="body2">Try adjusting your filters or check back later.</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row) => (
                                <Row key={row.id} row={row} onResend={onResend} />
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
