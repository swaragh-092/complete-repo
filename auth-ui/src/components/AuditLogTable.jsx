import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, TablePagination, CircularProgress, TextField, TableSortLabel, Box, Paper, Typography,} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api, { extractPaginatedData } from '../services/api.js';

function AuditLogTable() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, rowsPerPage, search, sortBy, sortOrder],
    queryFn: () =>
      api
        .get('auth/audit-logs', {
          params: {
            page: page + 1,
            limit: rowsPerPage,
            search,
            sortBy,
            sortOrder,
          },
        })
        .then(extractPaginatedData),
    keepPreviousData: true,
  });

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };


  

  return (
    <Paper sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        Audit Logs
      </Typography>

      <Box mb={2}>
        <TextField
          label="Search"
          variant="outlined"
          value={search}
          onChange={handleSearchChange}
          size="small"
          fullWidth
        />
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Table>
           <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'id'}
                    direction={sortBy === 'id' ? sortOrder : 'asc'}
                    onClick={() => handleSort('id')}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'user_id'}
                    direction={sortBy === 'user_id' ? sortOrder : 'asc'}
                    onClick={() => handleSort('user_id')}
                  >
                    User ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'client_id'}
                    direction={sortBy === 'client_id' ? sortOrder : 'asc'}
                    onClick={() => handleSort('client_id')}
                  >
                    Client ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'action'}
                    direction={sortBy === 'action' ? sortOrder : 'asc'}
                    onClick={() => handleSort('action')}
                  >
                    Action
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'created_at'}
                    direction={sortBy === 'created_at' ? sortOrder : 'asc'}
                    onClick={() => handleSort('created_at')}
                  >
                    Created At
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.rows?.length > 0 ? (
                data.rows.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.id}</TableCell>
                    <TableCell>{log.user_id}</TableCell>
                    <TableCell>{log.client_id}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={data?.count || 0}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </>
      )}
    </Paper>
  );
}

export default AuditLogTable;
