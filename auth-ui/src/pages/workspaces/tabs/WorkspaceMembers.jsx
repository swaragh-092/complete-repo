import React, { useState } from 'react';
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
  Button,
  FormControl,
  Select,
  MenuItem,
  Avatar,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import workspaceService from '../../../services/workspaceService';
import AddMemberModal from '../../../components/workspaces/AddMemberModal';

export default function WorkspaceMembers({ workspace }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Fetch Members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['workspace-members', workspace?.id],
    queryFn: () => workspaceService.getMembers(workspace.id),
    enabled: !!workspace?.id
  });

  // Mutations
  const removeMutation = useMutation({
    mutationFn: (userId) => workspaceService.removeMember(workspace.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace-members', workspace.id]);
      queryClient.invalidateQueries(['workspace', workspace.id]); // Update counts
      enqueueSnackbar('Member removed successfully', { variant: 'success' });
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.message || 'Failed to remove member';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => workspaceService.updateMemberRole(workspace.id, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace-members', workspace.id]);
      enqueueSnackbar('Role updated successfully', { variant: 'success' });
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.message || 'Failed to update role';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  });

  const handleRemoveMember = (userId) => {
    if (confirm('Are you sure you want to remove this member?')) {
      removeMutation.mutate(userId);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    roleMutation.mutate({ userId, role: newRole });
  };

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
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

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        
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
                <TableRow key={member.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {(member.UserMetadata?.email || '?').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {member.UserMetadata?.email || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.UserMetadata?.designation || member.UserMetadata?.department || 'Member'}
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
                        disabled={roleMutation.isLoading}
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
                      disabled={removeMutation.isLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">No members found</Typography>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Member Modal */}
      <AddMemberModal 
        open={isAddMemberOpen} 
        onClose={() => setIsAddMemberOpen(false)}
        workspaceId={workspace.id}
        orgId={workspace.org_id}
        existingMemberIds={members.map(m => m.user_id)}
      />
    </Box>
  );
}
