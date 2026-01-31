import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import clientRequestService from '../services/clientRequestService';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  useTheme,
  Fade,
  Badge,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  TablePagination
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as PendingIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Code as CodeIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import SearchFilter from '../components/SearchFilter';

export default function ClientRequests() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [editFormData, setEditFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await clientRequestService.getAll(filter);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load requests:', err);
      enqueueSnackbar('Failed to load requests', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await clientRequestService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    loadRequests();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Client-side search filtering
  const filteredRequests = requests.filter(req =>
    req.name?.toLowerCase().includes(search.toLowerCase()) ||
    req.client_key?.toLowerCase().includes(search.toLowerCase()) ||
    req.developer_email?.toLowerCase().includes(search.toLowerCase()) ||
    req.developer_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Paginated requests
  const paginatedRequests = filteredRequests.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle search change
  const handleSearch = (value) => {
    setSearch(value);
    setPage(0); // Reset to first page on search
  };

  // === Action Handlers ===
  const handleView = async (request) => {
    try {
      const fullRequest = await clientRequestService.getById(request.id);
      setSelectedRequest(fullRequest);
      setShowViewModal(true);
    } catch {
      enqueueSnackbar('Failed to load request details', { variant: 'error' });
    }
  };

  const handleEdit = (request) => {
    setSelectedRequest(request);
    setEditFormData({
      name: request.name || '',
      clientKey: request.client_key || '',
      redirectUrl: request.redirect_url || '',
      description: request.description || '',
      developerEmail: request.developer_email || '',
      developerName: request.developer_name || '',
      requiresOrganization: request.requires_organization || false,
      organizationModel: request.organization_model || '',
      onboardingFlow: request.onboarding_flow || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = (request) => {
    setSelectedRequest(request);
    setShowDeleteModal(true);
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  // === Confirm Actions ===
  const confirmApproval = async () => {
    try {
      setActionLoading(true);
      await clientRequestService.approve(selectedRequest.id);
      setShowApprovalModal(false);
      setSelectedRequest(null);
      loadRequests();
      loadStats();
      enqueueSnackbar('Request approved successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to approve request', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmRejection = async () => {
    try {
      setActionLoading(true);
      await clientRequestService.reject(selectedRequest.id, rejectionReason);
      setShowRejectionModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      loadRequests();
      loadStats();
      enqueueSnackbar('Request rejected', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to reject request', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmEdit = async () => {
    try {
      setActionLoading(true);
      await clientRequestService.update(selectedRequest.id, editFormData);
      setShowEditModal(false);
      setSelectedRequest(null);
      setEditFormData({});
      loadRequests();
      enqueueSnackbar('Request updated successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to update request', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setActionLoading(true);
      await clientRequestService.delete(selectedRequest.id);
      setShowDeleteModal(false);
      setSelectedRequest(null);
      loadRequests();
      loadStats();
      enqueueSnackbar('Request deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to delete request', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const StatCard = ({ title, value, color, icon: IconComponent }) => (
    <Card 
      sx={{ 
        flex: 1, 
        minWidth: { xs: '100%', sm: 150 },
        bgcolor: theme.palette.mode === 'light' 
          ? `${theme.palette[color].main}15` 
          : `${theme.palette[color].main}25`,
        border: `1px solid ${theme.palette[color].main}40`
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
        <IconComponent sx={{ fontSize: 40, color: theme.palette[color].main }} />
        <Box>
          <Typography variant="h4" fontWeight="700" color={`${color}.main`}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const RequestCard = ({ request }) => (
    <Fade in timeout={300}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <BusinessIcon color="action" />
              <Typography variant="h6" fontWeight="600">
                {request.name || 'Unnamed Client'}
              </Typography>
            </Box>
            <Chip 
              label={request.status} 
              size="small" 
              color={getStatusColor(request.status)}
              variant="outlined"
            />
          </Box>

          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <CodeIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" fontFamily="monospace">
              {request.client_key}
            </Typography>
          </Box>

          {request.redirect_url && (
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <LinkIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary" noWrap>
                {request.redirect_url}
              </Typography>
            </Box>
          )}

          {request.description && (
            <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
              <DescriptionIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
              <Typography variant="body2" color="text.secondary" sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {request.description}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              {request.requested_at ? new Date(request.requested_at).toLocaleDateString() : 'N/A'}
            </Typography>
            
            <Box display="flex" gap={0.5}>
              {/* View Button - Always visible */}
              <Tooltip title="View Details">
                <IconButton size="small" onClick={() => handleView(request)}>
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Edit Button - Only for pending */}
              {request.status === 'pending' && (
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleEdit(request)} color="primary">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Delete Button - For pending and rejected */}
              {request.status !== 'approved' && (
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(request)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Approve/Reject - Only for pending */}
              {request.status === 'pending' && (
                <>
                  <Tooltip title="Approve">
                    <IconButton size="small" onClick={() => handleApprove(request)} color="success">
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reject">
                    <IconButton size="small" onClick={() => handleReject(request)} color="error">
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  return (
    <Fade in timeout={500}>
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, margin: '0 auto' }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="700" color="text.primary">
              Client Registration Requests
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Review and manage client application requests
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={() => { loadRequests(); loadStats(); }} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
          <StatCard title="Pending" value={stats.pending} color="warning" icon={PendingIcon} />
          <StatCard title="Approved" value={stats.approved} color="success" icon={CheckCircleIcon} />
          <StatCard title="Rejected" value={stats.rejected} color="error" icon={CancelIcon} />
        </Box>

        {/* Filter Tabs */}
        <Paper sx={{ mb: 3, bgcolor: 'transparent' }} elevation={0}>
          <Tabs 
            value={filter} 
            onChange={(e, v) => setFilter(v)}
            textColor="primary"
            indicatorColor="primary"
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
          >
            <Tab value="pending" label={<Badge badgeContent={stats.pending} color="warning">Pending</Badge>} />
            <Tab value="approved" label="Approved" />
            <Tab value="rejected" label="Rejected" />
            <Tab value="all" label="All" />
          </Tabs>
        </Paper>

        {/* Search */}
        <Paper sx={{ mb: 3, p: 2 }} elevation={0}>
          <SearchFilter
            onSearch={handleSearch}
            placeholder="Search by client name, key, or developer..."
            initialValue={search}
          />
        </Paper>

        {/* Content */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : filteredRequests.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <PendingIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No {filter === 'all' ? '' : filter} requests
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filter === 'pending' 
                ? 'All caught up! No pending requests to review.' 
                : `No ${filter} requests at the moment.`}
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {paginatedRequests.map((request) => (
                <Grid item xs={12} md={6} lg={4} key={request.id}>
                  <RequestCard request={request} />
                </Grid>
              ))}
            </Grid>
            <TablePagination
              component="div"
              count={filteredRequests.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[6, 9, 12, 24]}
              sx={{ mt: 2 }}
            />
          </>
        )}

        {/* ========== VIEW DETAILS DIALOG ========== */}
        <Dialog open={showViewModal} onClose={() => setShowViewModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Request Details</Typography>
            <IconButton onClick={() => setShowViewModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedRequest && (
              <List dense>
                <ListItem>
                  <ListItemText primary="Name" secondary={selectedRequest.name} />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText primary="Client Key" secondary={selectedRequest.client_key} />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Status" 
                    secondary={
                      <Chip label={selectedRequest.status} size="small" color={getStatusColor(selectedRequest.status)} />
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText primary="Redirect URL" secondary={selectedRequest.redirect_url || 'N/A'} />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText primary="Description" secondary={selectedRequest.description || 'N/A'} />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText primary="Developer Name" secondary={selectedRequest.developer_name || 'N/A'} />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText primary="Developer Email" secondary={selectedRequest.developer_email || 'N/A'} />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText primary="Requires Organization" secondary={selectedRequest.requires_organization ? 'Yes' : 'No'} />
                </ListItem>
                {selectedRequest.requires_organization && (
                  <>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText primary="Organization Model" secondary={selectedRequest.organization_model || 'N/A'} />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText primary="Onboarding Flow" secondary={selectedRequest.onboarding_flow || 'N/A'} />
                    </ListItem>
                  </>
                )}
                <Divider component="li" />
                <ListItem>
                  <ListItemText primary="Requested At" secondary={selectedRequest.requested_at ? new Date(selectedRequest.requested_at).toLocaleString() : 'N/A'} />
                </ListItem>
                {selectedRequest.status === 'approved' && (
                  <>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText primary="Approved At" secondary={selectedRequest.approved_at ? new Date(selectedRequest.approved_at).toLocaleString() : 'N/A'} />
                    </ListItem>
                  </>
                )}
                {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                  <>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText primary="Rejection Reason" secondary={selectedRequest.rejection_reason} />
                    </ListItem>
                  </>
                )}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowViewModal(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* ========== EDIT DIALOG ========== */}
        <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Client Request</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Name"
                fullWidth
                value={editFormData.name || ''}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
              <TextField
                label="Client Key"
                fullWidth
                value={editFormData.clientKey || ''}
                onChange={(e) => setEditFormData({ ...editFormData, clientKey: e.target.value })}
              />
              <TextField
                label="Redirect URL"
                fullWidth
                value={editFormData.redirectUrl || ''}
                onChange={(e) => setEditFormData({ ...editFormData, redirectUrl: e.target.value })}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={editFormData.description || ''}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
              <TextField
                label="Developer Name"
                fullWidth
                value={editFormData.developerName || ''}
                onChange={(e) => setEditFormData({ ...editFormData, developerName: e.target.value })}
              />
              <TextField
                label="Developer Email"
                fullWidth
                type="email"
                value={editFormData.developerEmail || ''}
                onChange={(e) => setEditFormData({ ...editFormData, developerEmail: e.target.value })}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editFormData.requiresOrganization || false}
                    onChange={(e) => setEditFormData({ ...editFormData, requiresOrganization: e.target.checked })}
                  />
                }
                label="Requires Organization"
              />
              {editFormData.requiresOrganization && (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Organization Model</InputLabel>
                    <Select
                      value={editFormData.organizationModel || ''}
                      label="Organization Model"
                      onChange={(e) => setEditFormData({ ...editFormData, organizationModel: e.target.value })}
                    >
                      <MenuItem value="single">Single</MenuItem>
                      <MenuItem value="multi">Multi</MenuItem>
                      <MenuItem value="workspace">Workspace</MenuItem>
                      <MenuItem value="enterprise">Enterprise</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Onboarding Flow</InputLabel>
                    <Select
                      value={editFormData.onboardingFlow || ''}
                      label="Onboarding Flow"
                      onChange={(e) => setEditFormData({ ...editFormData, onboardingFlow: e.target.value })}
                    >
                      <MenuItem value="create_org">Create Organization</MenuItem>
                      <MenuItem value="invitation_only">Invitation Only</MenuItem>
                      <MenuItem value="domain_matching">Domain Matching</MenuItem>
                      <MenuItem value="flexible">Flexible</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="contained" onClick={confirmEdit} disabled={actionLoading}>
              {actionLoading ? <CircularProgress size={20} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ========== DELETE CONFIRMATION DIALOG ========== */}
        <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Delete Request</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mt: 1 }}>
              Are you sure you want to delete the client request for <strong>{selectedRequest?.name || selectedRequest?.client_key}</strong>? This action cannot be undone.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDelete} disabled={actionLoading}>
              {actionLoading ? <CircularProgress size={20} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ========== APPROVAL DIALOG ========== */}
        <Dialog open={showApprovalModal} onClose={() => setShowApprovalModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Approve Request</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mt: 1 }}>
              Are you sure you want to approve the client registration request for <strong>{selectedRequest?.name || selectedRequest?.client_key}</strong>?
              <br /><br />
              This will:
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>Create a new client in Keycloak</li>
                <li>Register the client in the database</li>
                <li>Send approval notification to the developer</li>
              </ul>
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowApprovalModal(false)}>Cancel</Button>
            <Button variant="contained" color="success" onClick={confirmApproval} disabled={actionLoading}>
              {actionLoading ? <CircularProgress size={20} /> : 'Approve'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ========== REJECTION DIALOG ========== */}
        <Dialog open={showRejectionModal} onClose={() => setShowRejectionModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Reject Request</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
              Please provide a reason for rejecting this request.
            </Typography>
            <TextField
              label="Rejection Reason"
              fullWidth
              multiline
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRejectionModal(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmRejection} disabled={actionLoading}>
              {actionLoading ? <CircularProgress size={20} /> : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
}
