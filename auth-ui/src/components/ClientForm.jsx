import { useState } from 'react';
import { TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox } from '@mui/material';

function ClientForm({ client, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    client_id: client?.client_id || '',
    client_secret: client?.client_secret || '',
    callback_url: client?.callback_url || '',
    realm: client?.realm || 'my-projects',
    tenant_id: client?.tenant_id || '',
    allow_primary_org_change: client?.allow_primary_org_change || false,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>{client ? 'Edit Client' : 'Create Client'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Client ID"
          name="client_id"
          value={formData.client_id}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Client Secret"
          name="client_secret"
          value={formData.client_secret}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Callback URL"
          name="callback_url"
          value={formData.callback_url}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Realm"
          name="realm"
          value={formData.realm}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.allow_primary_org_change || false}
              onChange={(e) => setFormData({ ...formData, allow_primary_org_change: e.target.checked })}
              name="allow_primary_org_change"
              color="primary"
            />
          }
          label="Allow Primary Organization Change"
        />
        <TextField
          label="Tenant ID"
          name="tenant_id"
          value={formData.tenant_id}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Submit</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ClientForm;