import { useState } from 'react';
import { Box, Paper, Typography, Divider, Avatar, Chip, Badge, Button, CircularProgress } from '@mui/material';
import {
  Business as BusinessIcon,
  Shield as ShieldIcon,
  Star as StarIcon
} from '@mui/icons-material';

/**
 * AccountOrganizationsTab - Displays user's organization memberships
 * @param {Object} organizations - Organizations data including primary_organization and memberships
 * @param {Function} onSetPrimary - Callback to set an organization as primary (optional)
 */
export default function AccountOrganizationsTab({ organizations, onSetPrimary }) {
  const [loading, setLoading] = useState(null); // Tracks which org is being set

  const handleSetPrimary = async (orgId) => {
    if (!onSetPrimary) return;
    setLoading(orgId);
    try {
      await onSetPrimary(orgId);
    } finally {
      setLoading(null);
    }
  };

  const primaryOrgId = organizations?.primary_organization?.id;

  return (
    <Paper 
      elevation={0}
      sx={{ 
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Your Organizations
        </Typography>
      </Box>
      <Divider />
      
      {organizations?.memberships?.length > 0 ? (
        <Box>
          {organizations.memberships.map((membership, index) => {
            const isPrimary = membership.organization.id === primaryOrgId;
            return (
              <Box 
                key={membership.organization.id || index}
                sx={{ 
                  p: 3,
                  borderBottom: index < organizations.memberships.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        background: isPrimary 
                          ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
                          : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        fontWeight: 600
                      }}
                    >
                      {membership.organization.name?.charAt(0) || 'O'}
                    </Avatar>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {membership.organization.name}
                        </Typography>
                        {isPrimary && (
                          <Chip 
                            icon={<StarIcon sx={{ fontSize: 14 }} />}
                            label="Primary"
                            size="small"
                            color="warning"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 22
                            }}
                          />
                        )}
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Chip 
                          label={membership.role?.name || 'Member'}
                          size="small"
                          sx={{
                            bgcolor: 'primary.50',
                            color: 'primary.700',
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            height: 22
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {membership.role?.permissions?.length || 0} permissions
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    {!isPrimary && onSetPrimary && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleSetPrimary(membership.organization.id)}
                        disabled={loading !== null}
                        startIcon={loading === membership.organization.id ? <CircularProgress size={14} /> : null}
                      >
                        {loading === membership.organization.id ? 'Setting...' : 'Set as Primary'}
                      </Button>
                    )}
                    <Badge 
                      badgeContent={membership.role?.permissions?.length || 0} 
                      color="primary"
                      sx={{ '& .MuiBadge-badge': { fontWeight: 600 } }}
                    >
                      <ShieldIcon sx={{ color: 'text.secondary' }} />
                    </Badge>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            No organization memberships
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
