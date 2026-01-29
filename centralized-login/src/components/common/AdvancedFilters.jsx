import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Stack,
  Typography,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

export function AdvancedFilters({ filters, onFilterChange, onClear }) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || {});

  const handleFilterChange = (key, value) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onFilterChange?.(updated);
  };

  const handleClear = () => {
    const cleared = {};
    setLocalFilters(cleared);
    onClear?.();
    onFilterChange?.(cleared);
  };

  const activeFilterCount = Object.values(localFilters).filter(v => v !== '' && v !== null && v !== undefined).length;

  return (
    <Box>
      <Button
        startIcon={<FilterIcon />}
        onClick={() => setOpen(!open)}
        variant={activeFilterCount > 0 ? 'contained' : 'outlined'}
        size="small"
        sx={{ mb: 2 }}
      >
        Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
      </Button>

      <Collapse in={open}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">Filter Options</Typography>
                {activeFilterCount > 0 && (
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={handleClear}
                  >
                    Clear All
                  </Button>
                )}
              </Box>

              <Box display="flex" gap={2} flexWrap="wrap">
                {filters?.dateRange && (
                  <TextField
                    label="Start Date"
                    type="date"
                    size="small"
                    value={localFilters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 150 }}
                  />
                )}

                {filters?.status && (
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={localFilters.status || ''}
                      label="Status"
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <MenuItem value="">All</MenuItem>
                      {filters.status.options?.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {filters?.search && (
                  <TextField
                    label="Search"
                    size="small"
                    value={localFilters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    sx={{ minWidth: 200 }}
                  />
                )}
              </Box>

              {activeFilterCount > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Active Filters:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {Object.entries(localFilters).map(([key, value]) => {
                      if (!value || value === '') return null;
                      return (
                        <Chip
                          key={key}
                          label={`${key}: ${value}`}
                          onDelete={() => handleFilterChange(key, '')}
                          size="small"
                        />
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Collapse>
    </Box>
  );
}










