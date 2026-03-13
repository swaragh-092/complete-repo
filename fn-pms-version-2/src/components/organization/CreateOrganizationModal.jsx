/**
 * @fileoverview Create Organization Modal
 * @description MUI Dialog for creating a new organization (for existing users)
 * Keeps users within the app context without losing sidebar
 */

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useOrganization } from '../../context/OrganizationContext';

export default function CreateOrganizationModal({ open, onClose, onSuccess }) {
  const theme = useTheme();
  const { createOrganization, loading } = useOrganization();
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateName = (name) => {
    if (!name.trim()) return 'Organization name is required';
    if (name.trim().length < 2) return 'Organization name must be at least 2 characters';
    if (name.trim().length > 100) return 'Organization name must be less than 100 characters';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateName(orgName);
    if (validation) {
      setError(validation);
      return;
    }
    
    setError('');
    setSubmitting(true);
    
    try {
      const newOrg = await createOrganization(orgName.trim());
      setOrgName('');
      onSuccess?.(newOrg);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setOrgName('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: theme.palette.mode === 'dark' 
            ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` 
            : 'none',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BusinessIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" fontWeight={600}>
            Create New Organization
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose} 
          disabled={submitting}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new organization to manage a separate team or project.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Organization Name"
            placeholder="Enter organization name"
            value={orgName}
            onChange={(e) => {
              setOrgName(e.target.value);
              if (error) setError(validateName(e.target.value));
            }}
            disabled={submitting}
            autoFocus
            error={!!error}
            helperText="This will be your organization's display name"
            InputProps={{
              sx: { borderRadius: 2 },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button 
            onClick={handleClose} 
            disabled={submitting}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || loading || !orgName.trim()}
            sx={{
              borderRadius: 2,
              px: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
              },
            }}
          >
            {submitting ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1, color: 'inherit' }} />
                Creating...
              </>
            ) : (
              'Create Organization'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
