import {
  Table, TableHead, TableRow, TableCell, TableBody, IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

function RoleTable({ roles, roleType, selectedClient }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      api.delete(
        roleType === 'realm'
          ? `/roles/realm/${id}`
          : `/roles/client/${selectedClient}/${id}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles', roleType, selectedClient]);
    },
  });

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Role Name</TableCell>
          <TableCell>Description</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {roles?.map((role) => (
          <TableRow key={role.id}>
            <TableCell>{role.name}</TableCell>
            <TableCell>{role.description || '-'}</TableCell>
            <TableCell align="right">
              <IconButton
                onClick={() => deleteMutation.mutate(role.id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
        {roles?.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} align="center">
              No roles found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default RoleTable;
