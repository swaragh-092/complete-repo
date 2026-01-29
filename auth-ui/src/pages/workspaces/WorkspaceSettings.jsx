import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton, 
  Chip, 
  Button,
  Avatar,
  Divider,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  PersonAdd as PersonAddIcon, 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import workspaceService from '../../services/workspaceService';
import { useWorkspace } from '../../context/WorkspaceContext';
import AddMemberModal from '../../components/workspaces/AddMemberModal';
import EmailInviteSection from '../../components/workspaces/EmailInviteSection';

export default function WorkspaceSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshWorkspaces } = useWorkspace();
  const [error, setError] = useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 1. Fetch Workspace Details
  const { data: workspace, isLoading: loadingDetails } = useQuery({
    queryKey: ['workspace', id],
    queryFn: () => workspaceService.getById(id)
  });

  // 2. Fetch Members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['workspace-members', id],
    queryFn: () => workspaceService.getMembers(id)
  });

  // Sync edit form with workspace data
  useEffect(() => {
    if (workspace) {
      setEditForm({ name: workspace.name || '', description: workspace.description || '' });
    }
  }, [workspace]);

  // 3. Mutations
  const removeMutation = useMutation({
    mutationFn: (userId) => workspaceService.removeMember(id, userId),
    onSuccess: () => queryClient.invalidateQueries(['workspace-members', id]),
    onError: (err) => setError(err.response?.data?.message || 'Failed to remove member')
  });

  const updateMutation = useMutation({
    mutationFn: (data) => workspaceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace', id]);
      refreshWorkspaces && refreshWorkspaces();
      setIsEditing(false);
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to update workspace')
  });

  const deleteMutation = useMutation({
    mutationFn: () => workspaceService.delete(id),
    onSuccess: () => {
      refreshWorkspaces && refreshWorkspaces();
      navigate('/');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to delete workspace')
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => workspaceService.updateMemberRole(id, userId, role),
    onSuccess: () => queryClient.invalidateQueries(['workspace-members', id]),
    onError: (err) => setError(err.response?.data?.message || 'Failed to update role')
  });

  const handleRemoveMember = (userId) => {
    if (confirm('Are you sure you want to remove this member?')) {
      removeMutation.mutate(userId);
    }
  };

  const handleSaveEdit = () => {
    updateMutation.mutate(editForm);
  };

  const handleDeleteWorkspace = () => {
    deleteMutation.mutate();
  };

  const handleRoleChange = (userId, newRole) => {
    roleMutation.mutate({ userId, role: newRole });
  };

  const isLoading = loadingDetails || loadingMembers;
  if (isLoading) return <Typography>Loading...</Typography>;

  return (
    <Box>
       {/* Header */}
       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={600}>
              Workspace Settings
          </Typography>
        </Box>
        <Button 
          color="error" 
          variant="outlined" 
          size="small"
          onClick={() => setDeleteDialogOpen(true)}
        >
          Delete Workspace
        </Button>
       </Box>

       {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

       {/* General Settings - Editable */}
       <Paper sx={{ p: 3, mb: 3 }}>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
               <Typography variant="h6">General Information</Typography>
               {!isEditing ? (
                   <IconButton size="small" onClick={() => setIsEditing(true)}><EditIcon /></IconButton>
               ) : (
                   <Box>
                       <IconButton size="small" color="primary" onClick={handleSaveEdit}><SaveIcon /></IconButton>
                       <IconButton size="small" onClick={() => setIsEditing(false)}><CancelIcon /></IconButton>
                   </Box>
               )}
           </Box>
           
           {isEditing ? (
               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                   <TextField 
                       label="Workspace Name" 
                       value={editForm.name}
                       onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                       fullWidth 
                       size="small"
                   />
                   <TextField 
                       label="Description" 
                       value={editForm.description}
                       onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                       fullWidth 
                       size="small"
                       multiline
                       rows={2}
                   />
               </Box>
           ) : (
               <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                   <Box>
                       <Typography variant="subtitle2" color="text.secondary">Workspace Name</Typography>
                       <Typography variant="body1">{workspace?.name}</Typography>
                   </Box>
                   <Box>
                       <Typography variant="subtitle2" color="text.secondary">Workspace Slug (ID)</Typography>
                       <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{workspace?.slug}</Typography>
                   </Box>
                   <Box sx={{ gridColumn: 'span 2' }}>
                       <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                       <Typography variant="body1">{workspace?.description || 'No description'}</Typography>
                   </Box>
               </Box>
           )}
       </Paper>

       {/* Members */}
       <Paper sx={{ p: 3 }}>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
               <Typography variant="h6">Members</Typography>
               <Button 
                startIcon={<PersonAddIcon />} 
                variant="contained" 
                size="small"
                onClick={() => setIsAddMemberOpen(true)}
               >
                   Invite Member
               </Button>
           </Box>
           <Divider sx={{ mb: 2 }} />
           
           <TableContainer>
               <Table>
                   <TableHead>
                       <TableRow>
                           <TableCell>User</TableCell>
                           <TableCell>Role</TableCell>
                           <TableCell>Joined At</TableCell>
                           <TableCell align="right">Actions</TableCell>
                       </TableRow>
                   </TableHead>
                   <TableBody>
                       {members.map((member) => (
                           <TableRow key={member.id}>
                               <TableCell>
                                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                       <Avatar sx={{ width: 32, height: 32 }}>
                                           {(member.UserMetadata?.email || '?').charAt(0).toUpperCase()}
                                       </Avatar>
                                       <Box>
                                           <Typography variant="body2" fontWeight={600}>
                                               {member.UserMetadata?.email || 'Unknown'}
                                           </Typography>
                                       </Box>
                                   </Box>
                               </TableCell>
                               <TableCell>
                                   <FormControl size="small" sx={{ minWidth: 100 }}>
                                       <Select
                                           value={member.role}
                                           onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                                           size="small"
                                       >
                                           <MenuItem value="viewer">Viewer</MenuItem>
                                           <MenuItem value="editor">Editor</MenuItem>
                                           <MenuItem value="admin">Admin</MenuItem>
                                       </Select>
                                   </FormControl>
                               </TableCell>
                               <TableCell>
                                   {new Date(member.created_at).toLocaleDateString()}
                               </TableCell>
                               <TableCell align="right">
                                   <IconButton 
                                    color="error" 
                                    size="small"
                                    onClick={() => handleRemoveMember(member.user_id)}
                                   >
                                       <DeleteIcon />
                                   </IconButton>
                               </TableCell>
                           </TableRow>
                       ))}
                   </TableBody>
               </Table>
           </TableContainer>
       </Paper>

       {/* Email Invite Section */}
       <Box sx={{ mt: 3 }}>
           <EmailInviteSection workspaceId={id} />
       </Box>

       {/* Add Member Modal */}
       <AddMemberModal 
        open={isAddMemberOpen} 
        onClose={() => setIsAddMemberOpen(false)}
        workspaceId={id}
        orgId={workspace?.org_id}
        existingMemberIds={members.map(m => m.user_id)}
       />

       {/* Delete Confirmation Dialog */}
       <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
           <DialogTitle>Delete Workspace?</DialogTitle>
           <DialogContent>
               <Typography>
                   Are you sure you want to delete <strong>{workspace?.name}</strong>? 
                   This action will deactivate all memberships. This cannot be undone easily.
               </Typography>
           </DialogContent>
           <DialogActions>
               <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
               <Button color="error" variant="contained" onClick={handleDeleteWorkspace}>Delete</Button>
           </DialogActions>
       </Dialog>
    </Box>
  );
}
