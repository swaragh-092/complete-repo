/**
 * @fileoverview Create Workspace Modal Component
 * @description Enterprise-grade modal for creating new workspaces
 * @version 1.0.0
 * 
 * Features:
 * - Form validation
 * - Auto-slug generation
 * - Error handling
 * - Loading states
 * - Accessible design
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import {
  Workspaces as WorkspaceIcon,
  Link as SlugIcon,
} from '@mui/icons-material';
import { useWorkspace } from '../../context/WorkspaceContext';

// ============================================================================
// Constants
// ============================================================================

/**
 * Validation rules
 * @constant
 */
const VALIDATION = Object.freeze({
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  SLUG_MIN_LENGTH: 2,
  SLUG_MAX_LENGTH: 50,
  SLUG_PATTERN: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
});

/**
 * Initial form state
 * @constant
 */
const INITIAL_STATE = Object.freeze({
  name: '',
  slug: '',
  description: '',
  slugManuallyEdited: false
});

// ============================================================================
// Component
// ============================================================================

/**
 * Create Workspace Modal Component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {Function} [props.onCreated] - Success callback
 * @param {string} [props.orgId] - Organization ID (required when org support enabled)
 * @returns {JSX.Element}
 */
export default function CreateWorkspaceModal({ 
  open, 
  onClose, 
  onCreated,
  orgId 
}) {
  const { createWorkspace, loading: contextLoading } = useWorkspace();
  const { enqueueSnackbar } = useSnackbar();
  
  const [formData, setFormData] = useState({ ...INITIAL_STATE });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Generate slug from name
   * @param {string} name - Workspace name
   * @returns {string} Generated slug
   */
  const generateSlug = useCallback((name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, VALIDATION.SLUG_MAX_LENGTH);
  }, []);

  /**
   * Validate form data
   * @returns {Object} Validation errors
   */
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Workspace name is required';
    } else if (formData.name.length < VALIDATION.NAME_MIN_LENGTH) {
      newErrors.name = `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`;
    } else if (formData.name.length > VALIDATION.NAME_MAX_LENGTH) {
      newErrors.name = `Name cannot exceed ${VALIDATION.NAME_MAX_LENGTH} characters`;
    }

    // Slug validation
    if (!formData.slug.trim()) {
      newErrors.slug = 'Workspace ID is required';
    } else if (formData.slug.length < VALIDATION.SLUG_MIN_LENGTH) {
      newErrors.slug = `ID must be at least ${VALIDATION.SLUG_MIN_LENGTH} characters`;
    } else if (formData.slug.length > VALIDATION.SLUG_MAX_LENGTH) {
      newErrors.slug = `ID cannot exceed ${VALIDATION.SLUG_MAX_LENGTH} characters`;
    } else if (!VALIDATION.SLUG_PATTERN.test(formData.slug)) {
      newErrors.slug = 'ID can only contain lowercase letters, numbers, and hyphens';
    }

    return newErrors;
  }, [formData]);

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle input change
   * @param {Event} event - Change event
   */
  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-generate slug from name if not manually edited
      if (name === 'name' && !prev.slugManuallyEdited) {
        updated.slug = generateSlug(value);
      }
      
      return updated;
    });

    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors, generateSlug]);

  /**
   * Handle slug change (marks as manually edited)
   * @param {Event} event - Change event
   */
  const handleSlugChange = useCallback((event) => {
    const { value } = event.target;
    
    setFormData(prev => ({
      ...prev,
      slug: value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      slugManuallyEdited: true
    }));

    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: '' }));
    }
  }, [errors]);

  /**
   * Handle form submission
   * @param {Event} event - Submit event
   */
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    
    // Validate
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        org_id: orgId
      };

      await createWorkspace(payload);
      
      // Show success notification
      enqueueSnackbar(`Workspace "${formData.name}" created successfully!`, { 
        variant: 'success',
        autoHideDuration: 4000
      });
      
      // Reset and close
      setFormData({ ...INITIAL_STATE });
      setErrors({});
      
      if (onCreated) {
        onCreated();
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to create workspace';
      setSubmitError(message);
      
      // Show error notification
      enqueueSnackbar(message, { 
        variant: 'error',
        autoHideDuration: 5000
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData, orgId, validateForm, createWorkspace, onCreated]);

  /**
   * Handle modal close
   */
  const handleClose = useCallback(() => {
    if (!submitting) {
      setFormData({ ...INITIAL_STATE });
      setErrors({});
      setSubmitError('');
      onClose();
    }
  }, [submitting, onClose]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({ ...INITIAL_STATE });
      setErrors({});
      setSubmitError('');
    }
  }, [open]);

  // ============================================================================
  // Render
  // ============================================================================

  const isLoading = submitting || contextLoading;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WorkspaceIcon color="primary" />
          <Typography variant="h6" component="span">
            Create New Workspace
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {submitError && (
          <Alert 
            severity="error" 
            onClose={() => setSubmitError('')}
            sx={{ mb: 2 }}
          >
            {submitError}
          </Alert>
        )}

        <TextField
          autoFocus
          name="name"
          label="Workspace Name"
          placeholder="e.g., Marketing Team"
          fullWidth
          required
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name || 'A friendly name for the workspace'}
          disabled={isLoading}
          margin="normal"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <WorkspaceIcon color="action" fontSize="small" />
              </InputAdornment>
            )
          }}
        />

        <TextField
          name="slug"
          label="Workspace ID"
          placeholder="e.g., marketing-team"
          fullWidth
          required
          value={formData.slug}
          onChange={handleSlugChange}
          error={!!errors.slug}
          helperText={errors.slug || 'Unique identifier (lowercase, hyphens allowed)'}
          disabled={isLoading}
          margin="normal"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SlugIcon color="action" fontSize="small" />
              </InputAdornment>
            )
          }}
        />

        <TextField
          name="description"
          label="Description"
          placeholder="What is this workspace for?"
          fullWidth
          multiline
          rows={3}
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
          margin="normal"
          helperText="Optional description to help team members understand the workspace purpose"
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={isLoading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          variant="contained"
          disabled={isLoading || !formData.name.trim() || !formData.slug.trim()}
          startIcon={isLoading ? <CircularProgress size={16} /> : <WorkspaceIcon />}
        >
          {isLoading ? 'Creating...' : 'Create Workspace'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { VALIDATION };
