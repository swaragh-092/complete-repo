import { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Grid, Avatar, Typography, Card, CardContent, Stack,
} from '@mui/material';
import { useProfile } from '../../hooks/useProfile';

export default function ProfileEditForm({ onClose, showContainer = true }) {
  const { data: user, updateProfileAsync, updating } = useProfile();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', mobile: '', department: '', designation: '', avatarFile: null,
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        mobile: user.metadata?.mobile ?? '',
        department: user.metadata?.department ?? '',
        designation: user.metadata?.designation ?? '',
        avatarFile: null,
      });
    }
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFile = (e) => setForm({ ...form, avatarFile: e.target.files?.[0] });

  const handleSubmit = async () => {
    const payload = { ...form };
    delete payload.avatarFile;

    try {
      await updateProfileAsync(payload);
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.warn('Profile update failed', err);
    }
  };

  if (!user) return null;

  const content = (
    <>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>Profile details</Typography>

      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar
          src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}`}
          sx={{ width: 72, height: 72 }}
        />
        <Stack direction="column" spacing={1}>
          <Button variant="outlined" component="label">
            Upload avatar
            <input hidden type="file" accept="image/*" onChange={handleFile} />
          </Button>
          {form.avatarFile && (
            <Typography variant="caption" color="text.secondary">{form.avatarFile.name}</Typography>
          )}
        </Stack>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="First name" fullWidth name="firstName" value={form.firstName} onChange={handleChange} autoComplete="given-name" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Last name" fullWidth name="lastName" value={form.lastName} onChange={handleChange} autoComplete="family-name" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Email" fullWidth name="email" value={form.email} onChange={handleChange} autoComplete="email" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Mobile" fullWidth name="mobile" value={form.mobile} onChange={handleChange} autoComplete="tel" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Department" fullWidth name="department" value={form.department} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Designation" fullWidth name="designation" value={form.designation} onChange={handleChange} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={2} mt={3}>
        <Button variant="contained" onClick={handleSubmit} disabled={updating}>
          {updating ? 'Saving…' : 'Save changes'}
        </Button>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
      </Stack>
    </>
  );

  if (!showContainer) {
    return content;
  }

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
