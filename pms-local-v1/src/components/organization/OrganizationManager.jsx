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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Group as MembersIcon,
  Dashboard as OverviewIcon,
  Workspaces as WorkspacesIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import OrganizationWorkspaces from './OrganizationWorkspaces';

export default function OrganizationManager({ organizations, currentOrg, user, organizationModel, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0); 
  const [members, setMembers] = useState([]);

  // Determine user's role in current org
  const userRole = currentOrg?.role || 'member';

  useEffect(() => {
    if (currentOrg && activeTab === 2) { // 2 = Members tab (now shifted)
      fetchMembers();
    }
  }, [currentOrg, activeTab]);

  const fetchMembers = async () => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      const response = await auth.api.get(`/organizations/${currentOrg.id}/members`);
      setMembers(response.data.members || []);
    } catch (err) {
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (inviteData) => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      const response = await auth.api.post(`/organizations/${currentOrg.id}/invite`, inviteData);
      if (response.data.success) {
        fetchMembers();
        setError(null);
      }
    } catch (err) {
      setError('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      await auth.api.delete(`/organizations/${currentOrg.id}/members/${memberId}`);
      fetchMembers(); 
      setError(null);
    } catch (err) {
      setError('Failed to remove member');
    } finally {
      setLoading(false);
    }
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
                        <ListItemText primary="ID" secondary={currentOrg.tenant_id} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Your Role" secondary={currentOrg.role || 'Member'} />
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

          {/* Workspaces Tab (NEW) */}
          {activeTab === 1 && currentOrg && (
            <OrganizationWorkspaces 
              orgId={currentOrg.id} 
              orgName={currentOrg.name}
              userRole={userRole}
            />
          )}

          {/* Members Tab */}
          {activeTab === 2 && currentOrg && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Members of {currentOrg.name}</Typography>
                <InviteModal onInvite={handleInviteUser} />
              </Box>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
              ) : (
                <List>
                  {members.map((member) => (
                    <ListItem key={member.id} divider>
                      <ListItemText 
                        primary={member.name || member.email}
                        secondary={member.email}
                      />
                      <Chip size="small" label={member.role?.name || 'Member'} sx={{ mr: 2 }} />
                      {member.id !== user.id && (
                        <ListItemSecondaryAction>
                          <IconButton edge="end" color="error" onClick={() => handleRemoveMember(member.id)}>
                            <DeleteIcon />
                          </IconButton>
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
              />
              <TextField 
                fullWidth 
                label="Description" 
                multiline 
                rows={3} 
                placeholder="Organization description" 
                sx={{ mb: 2 }} 
              />
              <Button variant="contained">Save Changes</Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// Invite Modal Component
function InviteModal({ onInvite }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'member' });

  const handleSubmit = () => {
    onInvite(inviteData);
    setInviteData({ email: '', role: 'member' });
    setIsOpen(false);
  };

  return (
    <>
      <Button startIcon={<AddIcon />} variant="contained" onClick={() => setIsOpen(true)}>
        Invite Member
      </Button>
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite New Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={inviteData.email}
            onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
          />
          <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={inviteData.role}
              label="Role"
              onChange={(e) => setInviteData({...inviteData, role: e.target.value})}
            >
              <MenuItem value="member">Member</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Send Invite</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}