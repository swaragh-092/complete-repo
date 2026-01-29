import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

export function BulkActions({ selected, total, onSelectAll, onDeselectAll, actions = [] }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const selectedCount = selected.length;

  if (selectedCount === 0) return null;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    action.onClick(selected);
    handleMenuClose();
  };

  return (
    <Toolbar
      sx={{
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        minHeight: '56px !important',
        px: 2,
      }}
    >
      <Checkbox
        indeterminate={selectedCount > 0 && selectedCount < total}
        checked={total > 0 && selectedCount === total}
        onChange={(e) => {
          if (e.target.checked) {
            onSelectAll?.();
          } else {
            onDeselectAll?.();
          }
        }}
        sx={{ color: 'inherit', '&.Mui-checked': { color: 'inherit' } }}
      />
      <Typography variant="body2" sx={{ flex: 1 }}>
        {selectedCount} selected
      </Typography>
      <Box>
        {actions.slice(0, 2).map((action, index) => (
          <Button
            key={index}
            size="small"
            onClick={() => action.onClick(selected)}
            sx={{ color: 'inherit', ml: 1 }}
            startIcon={action.icon}
          >
            {action.label}
          </Button>
        ))}
        {actions.length > 2 && (
          <>
            <IconButton size="small" onClick={handleMenuOpen} sx={{ color: 'inherit' }}>
              <MoreVertIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              {actions.slice(2).map((action, index) => (
                <MenuItem key={index} onClick={() => handleAction(action)}>
                  {action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
                  <ListItemText>{action.label}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </Box>
    </Toolbar>
  );
}









