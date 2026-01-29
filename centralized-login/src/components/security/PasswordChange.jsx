import { useState } from 'react';
import { Box, TextField, Button, Card, CardContent, Typography } from '@mui/material';
import { useSecurity } from '../../hooks/useSecurity';

export default function PasswordChange() {
  const { changePassword } = useSecurity();
  const [form, setForm] = useState({ current: '', new: '', confirm: '' });

  const handleSubmit = () => {
    if (form.new !== form.confirm) return alert('Passwords do not match');
    changePassword.mutate({ oldPassword: form.current, newPassword: form.new });
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Change Password</Typography>
        <Box display="flex" flexDirection="column" gap={2} maxWidth={400}>
          <TextField label="Current password" type="password"
            value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
          <TextField label="New password" type="password"
            value={form.new} onChange={(e) => setForm({ ...form, new: e.target.value })} />
          <TextField label="Confirm new password" type="password"
            value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          <Button variant="contained" onClick={handleSubmit}
            disabled={changePassword.isLoading}>
            {changePassword.isLoading ? 'Changing…' : 'Update Password'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
