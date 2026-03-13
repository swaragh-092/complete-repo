/**
 * @fileoverview Organization Manager Component
 * @description Admin interface for organization settings, members, and workspaces
 * @matches centalized-login MUI styling
 */

import { useState, useEffect } from 'react';
import { auth } from '@spidy092/auth-client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemAvatar,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Divider,
  Menu,
  Tooltip,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Group as MembersIcon,
  Dashboard as OverviewIcon,
  Workspaces as WorkspacesIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  MoreVert as MoreIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Star as OwnerIcon,
  SwapHoriz as TransferIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import OrganizationWorkspaces from './OrganizationWorkspaces';

export default function OrganizationManager({ organizations, currentOrg, user, organizationModel, onUpdate }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0); 
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Determine user's role in current org
  const userRole = typeof currentOrg?.role === 'object' 
    ? currentOrg?.role?.name?.toLowerCase() 
    : (currentOrg?.role?.toLowerCase() || 'member');
  
  const isOwner = userRole === 'owner';
  const isAdmin = ['admin', 'owner'].includes(userRole);

  useEffect(() => {
    if (currentOrg) {
      fetchRoles();
      if (activeTab === 2) { // Members tab
        fetchMembers();
      }
    }
  }, [currentOrg, activeTab]);

  const fetchRoles = async () => {
    try {
      const response = await auth.api.get('/db-roles');
      const allRoles = response.data?.data || response.data || [];
      setRoles(allRoles);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const fetchMembers = async () => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      const orgId = currentOrg.id || currentOrg.org_id;
      const response = await auth.api.get(`/organizations/${orgId}/members`);
      setMembers(response.data?.data?.members || response.data.members || []);
    } catch (err) {
      setError('Failed to load members');
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!currentOrg || !selectedMember) return;
    
    try {
      setLoading(true);
      const orgId = currentOrg.id || currentOrg.org_id;
      await auth.api.delete(`/organizations/${orgId}/members/${selectedMember.id}`);
      fetchMembers();
      setRemoveDialogOpen(false);
      setSelectedMember(null);
      setError(null);
    } catch (err) {
      setError('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (roleId) => {
    if (!currentOrg || !selectedMember) return;
    
    try {
      setLoading(true);
      const orgId = currentOrg.id || currentOrg.org_id;
      await auth.api.put(`/organizations/${orgId}/members/${selectedMember.id}/role`, {
        role_id: roleId
      });
      fetchMembers();
      setEditRoleModalOpen(false);
      setSelectedMember(null);
      setError(null);
    } catch (err) {
      setError('Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!currentOrg || !selectedMember) return;
    
    try {
      setLoading(true);
      const orgId = currentOrg.id || currentOrg.org_id;
      await auth.api.post(`/organizations/${orgId}/transfer-ownership`, {
        new_owner_id: selectedMember.id
      });
      fetchMembers();
      setTransferDialogOpen(false);
      setSelectedMember(null);
      setError(null);
    } catch (err) {
      setError('Failed to transfer ownership');
    } finally {
      setLoading(false);
    }
  };

  const openMemberMenu = (event, member) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMember(member);
  };

  const closeMemberMenu = () => {
    setMenuAnchor(null);
  };

  const getRoleIcon = (roleName) => {
    const role = typeof roleName === 'object' ? roleName?.name : roleName;
    switch (role?.toLowerCase()) {
      case 'owner': return <OwnerIcon fontSize="small" color="warning" />;
      case 'admin': return <AdminIcon fontSize="small" color="primary" />;
      default: return <PersonIcon fontSize="small" color="action" />;
    }
  };

  const getRoleLabel = (role) => {
    if (typeof role === 'object') {
      return role?.name || 'Member';
    }
    return role || 'Member';
  };

  const canEditMember = (member) => {
    if (!isAdmin) return false;
    const memberRole = typeof member.role === 'object' ? member.role?.name : member.role;
    if (memberRole?.toLowerCase() === 'owner') return isOwner;
    if (memberRole?.toLowerCase() === 'admin') return isOwner;
    return true;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Organization Management</Typography>
          <Typography variant="body2" color="text.secondary">Model: {organizationModel}</Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab icon={<OverviewIcon />} label="Overview" />
            <Tab icon={<WorkspacesIcon />} label="Workspaces" />
            <Tab icon={<MembersIcon />} label="Members" />
            <Tab icon={<SettingsIcon />} label="Settings" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Box>
              {currentOrg ? (
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Current Organization</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Name" secondary={currentOrg.name} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="ID" secondary={currentOrg.tenant_id || currentOrg.id} />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Your Role" 
                          secondary={getRoleLabel(currentOrg.role)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Members" secondary={members.length > 0 ? members.length : 'Loading...'} />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              ) : (
                <Alert severity="info">No organization selected.</Alert>
              )}
            </Box>
          )}

          {/* Workspaces Tab */}
          {activeTab === 1 && currentOrg && (
            <OrganizationWorkspaces 
              orgId={currentOrg.id || currentOrg.org_id} 
              orgName={currentOrg.name}
              userRole={userRole}
            />
          )}

          {/* Members Tab */}
          {activeTab === 2 && currentOrg && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Members of {currentOrg.name}</Typography>
                {isAdmin && (
                  <Button 
                    startIcon={<AddIcon />} 
                    variant="contained"
                    onClick={() => setInviteModalOpen(true)}
                  >
                    Invite Member
                  </Button>
                )}
              </Box>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
              ) : members.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <MembersIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">No members yet</Typography>
                </Paper>
              ) : (
                <List>
                  {members.map((member) => (
                    <ListItem key={member.id} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {(member.name || member.email || '?')[0].toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight={500}>
                              {member.name || member.email}
                            </Typography>
                            {member.id === user?.id && (
                              <Chip label="You" size="small" color="primary" variant="outlined" />
                            )}
                          </Box>
                        }
                        secondary={member.email}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                        {getRoleIcon(member.role)}
                        <Chip 
                          size="small" 
                          label={getRoleLabel(member.role)}
                          color={
                            getRoleLabel(member.role).toLowerCase() === 'owner' ? 'warning' :
                            getRoleLabel(member.role).toLowerCase() === 'admin' ? 'primary' : 'default'
                          }
                          variant="outlined"
                        />
                      </Box>
                      {canEditMember(member) && member.id !== user?.id && (
                        <ListItemSecondaryAction>
                          <Tooltip title="Member actions">
                            <IconButton 
                              edge="end" 
                              onClick={(e) => openMemberMenu(e, member)}
                            >
                              <MoreIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Settings Tab */}
          {activeTab === 3 && currentOrg && (
            <Box>
              <Typography variant="h6" gutterBottom>Organization Settings</Typography>
              <TextField 
                fullWidth 
                label="Organization Name" 
                defaultValue={currentOrg.name} 
                sx={{ mb: 2 }} 
                disabled={!isAdmin}
              />
              <TextField 
                fullWidth 
                label="Description" 
                multiline 
                rows={3} 
                placeholder="Organization description" 
                sx={{ mb: 2 }} 
                disabled={!isAdmin}
              />
              {isAdmin && <Button variant="contained">Save Changes</Button>}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Member Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMemberMenu}
        PaperProps={{ sx: { minWidth: 180 } }}
      >
        <MenuItem onClick={() => { closeMemberMenu(); setEditRoleModalOpen(true); }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Change Role
        </MenuItem>
        {isOwner && (
          <MenuItem onClick={() => { closeMemberMenu(); setTransferDialogOpen(true); }}>
            <TransferIcon fontSize="small" sx={{ mr: 1 }} />
            Transfer Ownership
          </MenuItem>
        )}
        <Divider />
        <MenuItem 
          onClick={() => { closeMemberMenu(); setRemoveDialogOpen(true); }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Remove Member
        </MenuItem>
      </Menu>

      {/* Invite Member Modal */}
      <InviteModal 
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvited={() => { setInviteModalOpen(false); fetchMembers(); }}
        orgId={currentOrg?.id || currentOrg?.org_id}
        orgName={currentOrg?.name}
        roles={roles}
      />

      {/* Edit Role Modal */}
      <Dialog open={editRoleModalOpen} onClose={() => setEditRoleModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Role</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Update role for <strong>{selectedMember?.name || selectedMember?.email}</strong>
          </Typography>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value=""
              label="Role"
              onChange={(e) => handleUpdateRole(e.target.value)}
            >
              {roles.filter(r => {
                const roleName = r.name?.toLowerCase();
                if (!isOwner && roleName === 'owner') return false;
                if (!isOwner && roleName === 'admin') return false;
                return true;
              }).map(role => (
                <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRoleModalOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={removeDialogOpen} onClose={() => setRemoveDialogOpen(false)}>
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove <strong>{selectedMember?.name || selectedMember?.email}</strong> from this organization?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRemoveMember} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Ownership Dialog */}
      <Dialog open={transferDialogOpen} onClose={() => setTransferDialogOpen(false)}>
        <DialogTitle>Transfer Ownership</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to transfer ownership to <strong>{selectedMember?.name || selectedMember?.email}</strong>? 
            You will lose owner privileges and become an admin.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTransferOwnership} color="warning" variant="contained">
            Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Enhanced Invite Modal Component
function InviteModal({ open, onClose, onInvited, orgId, orgName, roles }) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filter roles for invite (exclude owner/superadmin)
  const invitableRoles = roles.filter(role => 
    !['superadmin', 'owner'].includes(role.name?.toLowerCase())
  );

  useEffect(() => {
    if (open && invitableRoles.length > 0 && !selectedRole) {
      setSelectedRole(invitableRoles[0].id);
    }
  }, [open, invitableRoles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !selectedRole) return;

    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      const response = await auth.api.post('/org-onboarding/invitations', {
        org_id: orgId,
        invited_email: email.trim(),
        role_id: selectedRole,
        expires_in_days: 7
      });

      setSuccess({
        message: 'Invitation sent successfully!',
        invitation: response.data?.data?.invitation || response.data.invitation
      });
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess(null);
    onClose();
  };

  const handleDone = () => {
    handleClose();
    onInvited();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          Invite New Member to {orgName}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {success ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography fontWeight={600}>{success.message}</Typography>
              </Alert>
              {success.invitation?.invitation_link && (
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      flex: 1, 
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      wordBreak: 'break-all'
                    }}
                  >
                    {success.invitation.invitation_link}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(success.invitation.invitation_link)}
                    color={copiedLink ? 'success' : 'default'}
                  >
                    {copiedLink ? <CheckIcon /> : <CopyIcon />}
                  </IconButton>
                </Paper>
              )}
            </Box>
          ) : (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Email Address"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                disabled={loading}
              />
              <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedRole}
                  label="Role"
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={loading}
                >
                  {invitableRoles.length === 0 ? (
                    <MenuItem disabled>Loading roles...</MenuItem>
                  ) : (
                    invitableRoles.map(role => (
                      <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {success ? (
            <>
              <Button onClick={() => { setSuccess(null); }}>
                Invite Another
              </Button>
              <Button onClick={handleDone} variant="contained">
                Done
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleClose} disabled={loading}>Cancel</Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading || !email.trim() || !selectedRole}
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
}