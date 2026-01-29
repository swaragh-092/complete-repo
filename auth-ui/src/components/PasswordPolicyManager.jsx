import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, IconButton, MenuItem,
  InputAdornment, Paper
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

const AVAILABLE_POLICIES = [
  { key: 'length', label: 'Minimum Length', needsValue: true },
  { key: 'upperCase', label: 'Uppercase Letters', needsValue: true },
  { key: 'lowerCase', label: 'Lowercase Letters', needsValue: true },
  { key: 'digits', label: 'Digits', needsValue: true },
  { key: 'specialChars', label: 'Special Characters', needsValue: true },
  { key: 'notUsername', label: 'Cannot Contain Username', needsValue: false },
];

function parsePolicyString(policyString) {
  if (!policyString) return [];

  return policyString.split(' and ').map(rule => {
    const match = rule.match(/^(\w+)(\((\d+)\))?$/);
    return {
      key: match?.[1] || '',
      value: match?.[3] || '',
    };
  });
}

function buildPolicyString(policies) {
  return policies
    .map(p => (p.value ? `${p.key}(${p.value})` : p.key))
    .join(' and ');
}

const PasswordPolicyManager = ({ value, onChange }) => {
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    setPolicies(parsePolicyString(value));
  }, [value]);

  const handleAddPolicy = () => {
    setPolicies([...policies, { key: '', value: '' }]);
  };

  const handleChange = (index, field, val) => {
    const updated = [...policies];
    updated[index][field] = val;
    setPolicies(updated);
    onChange(buildPolicyString(updated));
  };

  const handleRemove = (index) => {
    const updated = [...policies];
    updated.splice(index, 1);
    setPolicies(updated);
    onChange(buildPolicyString(updated));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Password Policy</Typography>
      {policies.map((policy, index) => {
        const meta = AVAILABLE_POLICIES.find(p => p.key === policy.key) || {};
        return (
          <Paper key={index} sx={{ p: 2, mb: 2, display: 'flex', gap: 2 }}>
            <TextField
              select
              label="Policy"
              value={policy.key}
              onChange={(e) => handleChange(index, 'key', e.target.value)}
              sx={{ flex: 2 }}
            >
              {AVAILABLE_POLICIES.map(p => (
                <MenuItem key={p.key} value={p.key}>{p.label}</MenuItem>
              ))}
            </TextField>

            {meta.needsValue && (
              <TextField
                label="Value"
                type="number"
                value={policy.value}
                onChange={(e) => handleChange(index, 'value', e.target.value)}
                sx={{ flex: 1 }}
              />
            )}

            <IconButton onClick={() => handleRemove(index)}>
              <DeleteIcon />
            </IconButton>
          </Paper>
        );
      })}

      <Button onClick={handleAddPolicy} variant="outlined">Add Policy</Button>
    </Box>
  );
};

export default PasswordPolicyManager;
