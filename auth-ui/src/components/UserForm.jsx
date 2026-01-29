import { useState } from 'react';
import { TextField, Button, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions  } from '@mui/material';

function UserForm({ user, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    password: '',
    org_id: user?.org_id || '',
    designation: user?.designation || '',
    department: user?.department || '',
    avatar_url: user?.avatar_url || '',
    mobile: user?.mobile || '',
    gender: user?.gender || '',
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
      <DialogTitle>{user ? 'Edit User' : 'Create User'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required={!user}
        />
        <TextField
          label="Organization ID"
          name="org_id"
          value={formData.org_id}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Designation"
          name="designation"
          value={formData.designation}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Avatar URL"
          name="avatar_url"
          value={formData.avatar_url}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Mobile"
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Gender"
          name="gender"
          select
          value={formData.gender}
          onChange={handleChange}
          fullWidth
          margin="normal"
        >
          <MenuItem value="male">Male</MenuItem>
          <MenuItem value="female">Female</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Submit</Button>
      </DialogActions>
    </Dialog>
  );
}

export default UserForm;