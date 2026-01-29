/**
 * @fileoverview EmptyState Component
 * @description Reusable empty state component for lists and tables
 */

import PropTypes from 'prop-types';
import { Box, Typography, Button } from '@mui/material';
import {
  Inbox as InboxIcon,
  Search as SearchIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

/**
 * EmptyState - A reusable empty state component
 * @param {Object} props - Component props
 * @param {string} [props.title='No data found'] - Title text
 * @param {string} [props.message] - Description message
 * @param {string} [props.type='empty'] - Type: 'empty', 'search', 'error'
 * @param {React.ReactNode} [props.icon] - Custom icon
 * @param {string} [props.actionLabel] - Action button label
 * @param {function} [props.onAction] - Action button click handler
 */
function EmptyState({
  title = 'No data found',
  message,
  type = 'empty',
  icon,
  actionLabel,
  onAction
}) {
  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'search':
        return <SearchIcon sx={{ fontSize: 64, color: 'action.disabled' }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />;
      default:
        return <InboxIcon sx={{ fontSize: 64, color: 'action.disabled' }} />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'search':
        return 'No results match your search criteria. Try adjusting your filters.';
      case 'error':
        return 'Something went wrong. Please try again later.';
      default:
        return 'There are no items to display yet.';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        textAlign: 'center'
      }}
      role="status"
      aria-label={title}
    >
      {getIcon()}
      
      <Typography 
        variant="h6" 
        color="text.secondary" 
        sx={{ mt: 2, mb: 1 }}
      >
        {title}
      </Typography>
      
      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{ maxWidth: 400, mb: actionLabel ? 3 : 0 }}
      >
        {message || getDefaultMessage()}
      </Typography>

      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{ mt: 2 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  type: PropTypes.oneOf(['empty', 'search', 'error']),
  icon: PropTypes.node,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func
};

export default EmptyState;
