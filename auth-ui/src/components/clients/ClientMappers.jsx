import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import clientService from '../../services/clientService';

function ClientMappers({ realmName, clientId }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [editingMapper, setEditingMapper] = useState(null);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-property-mapper',
      config: {
        'user.attribute': '',
        'claim.name': '',
        'jsonType.label': 'String',
        'id.token.claim': 'true',
        'access.token.claim': 'true',
        'userinfo.token.claim': 'true'
      }
    }
  });

  // Fetch Mappers
  const { data: mappers = [], isLoading } = useQuery({
    queryKey: ['client-mappers', realmName, clientId],
    queryFn: () => clientService.getProtocolMappers(realmName, clientId)
  });

  // Create/Update Mutation
  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingMapper) {
        return clientService.updateProtocolMapper(realmName, clientId, editingMapper.id, data);
      }
      return clientService.createProtocolMapper(realmName, clientId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['client-mappers', realmName, clientId]);
      enqueueSnackbar(`Mapper ${editingMapper ? 'updated' : 'created'} successfully`, { variant: 'success' });
      handleClose();
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to save mapper', { variant: 'error' });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (mapperId) => clientService.deleteProtocolMapper(realmName, clientId, mapperId),
    onSuccess: () => {
      queryClient.invalidateQueries(['client-mappers', realmName, clientId]);
      enqueueSnackbar('Mapper deleted successfully', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to delete mapper', { variant: 'error' });
    }
  });

  const handleOpen = (mapper = null) => {
    setEditingMapper(mapper);
    if (mapper) {
      reset(mapper);
    } else {
      reset({
        name: '',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-property-mapper',
        config: {
          'user.attribute': '',
          'claim.name': '',
          'jsonType.label': 'String',
          'id.token.claim': 'true',
          'access.token.claim': 'true',
          'userinfo.token.claim': 'true'
        }
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingMapper(null);
    reset();
  };

  const onSubmit = (data) => {
    saveMutation.mutate(data);
  };

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Protocol Mappers</Typography>
        <Button 
          startIcon={<AddIcon />} 
          variant="outlined" 
          onClick={() => handleOpen()}
        >
          Add Mapper
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mappers.map((mapper) => (
              <TableRow key={mapper.id}>
                <TableCell>{mapper.name}</TableCell>
                <TableCell>{mapper.protocol}</TableCell>
                <TableCell>{mapper.protocolMapper}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpen(mapper)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => deleteMutation.mutate(mapper.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mapper Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingMapper ? 'Edit Mapper' : 'Add Mapper'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Name"
                  fullWidth
                  margin="normal"
                  error={!!control._formState.errors.name}
                />
              )}
            />
            <Controller
              name="protocolMapper"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Mapper Type"
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="oidc-usermodel-property-mapper">User Attribute</MenuItem>
                  <MenuItem value="oidc-hardcoded-claim-mapper">Hardcoded Claim</MenuItem>
                  <MenuItem value="oidc-group-membership-mapper">Group Membership</MenuItem>
                </TextField>
              )}
            />
            
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Configuration</Typography>
            
            <Controller
              name="config.user.attribute"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="User Attribute"
                  fullWidth
                  margin="normal"
                  helperText="Name of the user attribute to map"
                />
              )}
            />
            <Controller
              name="config.claim.name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Token Claim Name"
                  fullWidth
                  margin="normal"
                  helperText="Name of the claim to insert into the token"
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit(onSubmit)} 
            variant="contained"
            disabled={saveMutation.isPending}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ClientMappers;
