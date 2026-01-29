import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Tooltip,
  Skeleton,
  Breadcrumbs,
  Link,
  Fade,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

import userService from '../../services/userService';
import UserForm from '../../components/UserForm';
import ConfirmDialog from '../../components/ConfirmDialog';
import SearchFilter from '../../components/SearchFilter';
import EmptyState from '../../components/EmptyState';

function UsersList() {
  const { realmName } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteData, setDeleteData] = useState(null);

  // Fetch Users
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', realmName, page, rowsPerPage, search],
    queryFn: () => userService.getAllUsers({
      realm: realmName,
      page: page + 1,
      limit: rowsPerPage,
      search
    })
  });

  // Handle standardized service response
  const users = data?.users || data?.data || [];
  const totalCount = data?.total || data?.count || users.length || 0;

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data) => userService.createUser(realmName, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users', realmName]);
      enqueueSnackbar('User created successfully', { variant: 'success' });
      setCreateOpen(false);
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to create user', { variant: 'error' });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (userId) => userService.deleteUser(realmName, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users', realmName]);
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
      setDeleteData(null);
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to delete user', { variant: 'error' });
    }
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <EmptyState
          type="error"
          title="Error loading users"
          message={error.message}
          actionLabel="Retry"
          onAction={() => queryClient.invalidateQueries(['users', realmName])}
        />
      </Box>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(`/realms/${realmName}`)} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight="700" color="text.primary">
                Users
              </Typography>
              <Breadcrumbs sx={{ mt: 0.5 }}>
                <Link 
                  component="button" 
                  color="inherit" 
                  onClick={() => navigate(`/realms/${realmName}`)}
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {realmName}
                </Link>
                <Typography color="text.primary">Users List</Typography>
              </Breadcrumbs>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ px: 3 }}
          >
            Add User
          </Button>
        </Box>

        {/* Search */}
        <Paper sx={{ mb: 3, p: 2 }} elevation={0}>
          <SearchFilter
            onSearch={(val) => { setSearch(val); setPage(0); }}
            placeholder="Search users by username, email, or name..."
            initialValue={search}
          />
        </Paper>

        {/* List */}
        {users.length === 0 ? (
          <EmptyState
            title="No Users Found"
            message={search ? `No users match "${search}"` : "Create your first user to get started."}
            actionLabel="Add User"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <Paper elevation={0} sx={{ overflow: 'hidden', border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', fontWeight: 'bold' }}>
                            {user.username?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Link 
                              component="button"
                              onClick={() => navigate(`/realms/${realmName}/users/${user.id}`)}
                              sx={{ fontWeight: 600, textDecoration: 'none', color: 'text.primary', '&:hover': { color: 'primary.main' } }}
                            >
                              {user.username}
                            </Link>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {user.firstName} {user.lastName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.enabled ? 'Active' : 'Disabled'}
                          color={user.enabled ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {user.createdTimestamp ? new Date(user.createdTimestamp).toLocaleDateString() : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => navigate(`/realms/${realmName}/users/${user.id}`)}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => setDeleteData(user)}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Paper>
        )}

        {/* Create Dialog */}
        {createOpen && (
          <UserForm
            onClose={() => setCreateOpen(false)}
            onSubmit={(data) => createMutation.mutate(data)}
          />
        )}

        {/* Delete Dialog */}
        <ConfirmDialog
          open={!!deleteData}
          onClose={() => setDeleteData(null)}
          onConfirm={() => deleteMutation.mutate(deleteData.id)}
          title="Delete User"
          message={`Are you sure you want to delete user "${deleteData?.username}"?`}
          confirmText="Delete"
          danger
          loading={deleteMutation.isPending}
        />
      </Box>
    </Fade>
  );
}

export default UsersList;
