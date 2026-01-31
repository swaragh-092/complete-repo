
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  Paper,
  Fade,
  TablePagination,
  useTheme
} from '@mui/material';
import {
  Apps as AppsIcon,
  Launch as LaunchIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import api, { extractData } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SearchFilter from '../components/SearchFilter';

function Applications() {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch applications
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['applications', search],
    queryFn: () => api.get('/api/admin/applications').then(extractData)
  });

  const applications = response || [];
  
  const filteredApps = applications.filter(app => 
    app.name?.toLowerCase().includes(search.toLowerCase()) || 
    app.clientId?.toLowerCase().includes(search.toLowerCase())
  );

  // Handle search change
  const handleSearch = (value) => {
    setSearch(value);
    setPage(0); // Reset to first page on search
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <EmptyState 
        type="error" 
        title="Failed to load applications" 
        message={error.message} 
      />
    );
  }

  return (
    <Fade in={true}>
      <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Applications
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and access your registered applications
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <Paper sx={{ mb: 3, p: 2 }} elevation={0}>
          <SearchFilter
            onSearch={handleSearch}
            placeholder="Search applications..."
            initialValue={search}
          />
        </Paper>

        {filteredApps.length === 0 ? (
          <EmptyState 
            type="search" 
            title="No applications found" 
            message="Try adjusting your search terms" 
          />
        ) : (
          <>
            <Grid container spacing={3}>
              {filteredApps.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((app) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={app.id}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[4],
                        borderColor: theme.palette.primary.main
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: theme.palette.primary.light, 
                            color: theme.palette.primary.main,
                            width: 48,
                            height: 48,
                            mr: 2
                          }}
                        >
                          <AppsIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="600" noWrap title={app.name}>
                            {app.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {app.clientId}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {app.description || 'No description provided'}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={app.enabled ? 'Active' : 'Disabled'} 
                          size="small" 
                          color={app.enabled ? 'success' : 'default'} 
                          variant="outlined"
                        />
                        <Chip 
                          label={app.protocol} 
                          size="small" 
                          variant="outlined" 
                          sx={{ textTransform: 'uppercase' }}
                        />
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      {app.baseUrl && (
                        <Button 
                          size="small" 
                          startIcon={<LaunchIcon />} 
                          href={app.baseUrl} 
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Launch
                        </Button>
                      )}
                      <Box sx={{ flexGrow: 1 }} />
                      <Button size="small" startIcon={<SettingsIcon />}>
                        Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <TablePagination
              component="div"
              count={filteredApps.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{ mt: 2 }}
            />
          </>
        )}
      </Box>
    </Fade>
  );
}

export default Applications;
