/**
 * @fileoverview SearchFilter Component
 * @description Reusable search and filter component with debounce
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

import useDebounce from '../hooks/useDebounce';

/**
 * SearchFilter - A reusable search and filter component
 * @param {Object} props - Component props
 * @param {function} props.onSearch - Handler for search value changes (debounced)
 * @param {function} [props.onSearchImmediate] - Handler for immediate search value changes
 * @param {Array} [props.filters=[]] - Active filter chips
 * @param {string} [props.placeholder='Search...'] - Search input placeholder
 * @param {number} [props.debounceDelay=300] - Debounce delay in milliseconds
 * @param {string} [props.initialValue=''] - Initial search value
 * @param {boolean} [props.showFilterIcon=false] - Show filter button
 * @param {function} [props.onFilterClick] - Handler for filter button click
 */
function SearchFilter({
  onSearch,
  onSearchImmediate,
  filters = [],
  placeholder = 'Search...',
  debounceDelay = 300,
  initialValue = '',
  showFilterIcon = false,
  onFilterClick
}) {
  const [searchValue, setSearchValue] = useState(initialValue);
  const debouncedSearchValue = useDebounce(searchValue, debounceDelay);

  // Call debounced search handler
  useEffect(() => {
    onSearch(debouncedSearchValue);
  }, [debouncedSearchValue, onSearch]);

  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    setSearchValue(value);
    if (onSearchImmediate) {
      onSearchImmediate(value);
    }
  }, [onSearchImmediate]);

  const handleClear = useCallback(() => {
    setSearchValue('');
    onSearch('');
    if (onSearchImmediate) {
      onSearchImmediate('');
    }
  }, [onSearch, onSearchImmediate]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <TextField
        placeholder={placeholder}
        value={searchValue}
        onChange={handleSearchChange}
        size="small"
        sx={{ minWidth: 250 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchValue && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClear}
                edge="end"
                aria-label="Clear search"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          )
        }}
        aria-label="Search"
      />

      {showFilterIcon && onFilterClick && (
        <Tooltip title="Filter options">
          <IconButton
            onClick={onFilterClick}
            color={filters.length > 0 ? 'primary' : 'default'}
            aria-label="Open filter options"
          >
            <FilterIcon />
          </IconButton>
        </Tooltip>
      )}

      {filters.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filters.map((filter) => (
            <Chip
              key={filter.key}
              label={filter.label}
              onDelete={filter.onRemove}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

SearchFilter.propTypes = {
  onSearch: PropTypes.func.isRequired,
  onSearchImmediate: PropTypes.func,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      onRemove: PropTypes.func.isRequired
    })
  ),
  placeholder: PropTypes.string,
  debounceDelay: PropTypes.number,
  initialValue: PropTypes.string,
  showFilterIcon: PropTypes.bool,
  onFilterClick: PropTypes.func
};

export default SearchFilter;
