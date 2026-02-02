/**
 * @fileoverview Select Organization Page
 * @description Screen for selecting from multiple organizations
 * Uses MUI components for consistent theming with dark mode support
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '../context/OrganizationContext';
import authConfig from '../config/authConfig';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Container,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Check as CheckIcon,
  Add as AddIcon,
} from '@mui/icons-material';

export default function SelectOrganization() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { 
    organizations, 
    loading, 
    error, 
    switchOrganization,
    fetchOrganizations 
  } = useOrganization();
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Check if single organization model
  const isSingleOrgMode = authConfig.organizationModel === 'single';

  // Auto-select and redirect for single org mode
  useEffect(() => {
    if (!loading && organizations.length > 0 && isSingleOrgMode) {
      // In single org mode, if user has exactly 1 org, auto-select and redirect
      const org = organizations[0];
      switchOrganization(org.id || org.org_id);
      navigate('/dashboard', { replace: true });
    }
  }, [loading, organizations, isSingleOrgMode, switchOrganization, navigate]);

  const handleSelect = async () => {
    if (!selectedId) return;
    
    setSubmitting(true);
    try {
      const success = switchOrganization(selectedId);
      if (success) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Failed to select organization:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/create-organization');
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        }}
      >
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Loading organizations...</Typography>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        }}
      >
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Button variant="contained" onClick={fetchOrganizations}>
            Try Again
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        p: 3,
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={theme.palette.mode === 'dark' ? 0 : 8}
          sx={{
            borderRadius: 3,
            border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` : 'none',
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <BusinessIcon
                sx={{
                  fontSize: 56,
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              />
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Select Organization
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Choose an organization to continue
              </Typography>
            </Box>

            {/* Organization List */}
            <List sx={{ mb: 3 }}>
              {organizations.map((org) => {
                const orgId = org.id || org.org_id;
                const isSelected = selectedId === orgId;
                
                return (
                  <ListItemButton
                    key={orgId}
                    selected={isSelected}
                    onClick={() => setSelectedId(orgId)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      border: isSelected 
                        ? `2px solid ${theme.palette.primary.main}`
                        : `2px solid ${alpha(theme.palette.divider, 0.5)}`,
                      backgroundColor: isSelected
                        ? alpha(theme.palette.primary.main, 0.1)
                        : 'transparent',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <ListItemIcon>
                      <BusinessIcon color={isSelected ? 'primary' : 'action'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography fontWeight={600}>
                          {org.name || org.org_name}
                        </Typography>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          {org.role && (
                            <Chip
                              label={org.role.name || org.role}
                              size="small"
                              variant="outlined"
                              sx={{ height: 22, fontSize: '0.75rem' }}
                            />
                          )}
                          {org.isPrimary && (
                            <Chip
                              label="Primary"
                              size="small"
                              color="primary"
                              sx={{ height: 22, fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                    {isSelected && (
                      <CheckIcon color="primary" />
                    )}
                  </ListItemButton>
                );
              })}
            </List>

            {/* Actions */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleSelect}
                disabled={!selectedId || submitting}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                  },
                }}
              >
                {submitting ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                    Continuing...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
              {/* Only show Create button if not single org mode OR if user has no orgs */}
              {(!isSingleOrgMode || organizations.length === 0) && (
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={handleCreateNew}
                  startIcon={<AddIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    },
                  }}
                >
                  Create New Organization
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
