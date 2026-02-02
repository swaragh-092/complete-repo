/**
 * @fileoverview Organization Onboarding Page
 * @description Screen for initial organization setup (create or join)
 * @matches centalized-login MUI styling
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '@spidy092/auth-client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Container,
  Alert,
  Paper,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Business as BusinessIcon,
  GroupAdd as JoinIcon,
  Mail as InviteIcon,
} from '@mui/icons-material';

export default function OrganizationOnboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState(null);
  const [activeTab, setActiveTab] = useState(0); 
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); 

  const clientKey = searchParams.get('client_key');
  const accessToken = searchParams.get('access_token');
  const state = searchParams.get('state');

  useEffect(() => {
    if (!clientKey || !accessToken) {
      console.log('⚠️ Missing parameters - this is normal during manual navigation');
      setLoading(false);
    }

    // Set the access token for API calls
    if (accessToken) {
      auth.setToken(accessToken);
    }
    fetchOnboardingStatus();
  }, [clientKey, accessToken]);

  const fetchOnboardingStatus = async () => {
    try {
      const response = await auth.api.get(`/onboarding-status?client_key=${clientKey}`);
      setOnboardingData(response.data);
      
      // Determine initial tab based on user's situation
      if (response.data.pending_invitation) {
        setActiveTab(0); // Invitation tab
      } else if (response.data.tenant_status.needs_tenant) {
        // 0=pending (if exists), 1=create, 2=join (indices depend on available tabs)
        // Adjust logic based on which tabs are rendered
        setActiveTab(['create_org', 'flexible'].includes('flexible') ? 0 : 0); 
      } else {
        // User already has organization access
        completeOnboarding();
        return;
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch onboarding status:', err);
      setError('Failed to load onboarding information');
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      setLoading(true);
      await auth.api.post(`/invitations/${invitationId}/accept`);
      completeOnboarding();
    } catch (err) {
      setError('Failed to accept invitation');
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (orgData) => {
    try {
      setLoading(true);
      
      // ✅ Get client_key from token
      const token = localStorage.getItem('auth_token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const clientId = payload.azp || payload.client_id;
      
      console.log('Creating organization...', { orgName: orgData.name, clientId });
      
      // ✅ Use correct endpoint
      const response = await auth.api.post('/organizations/create', {
        name: orgData.name,
        client_key: clientId,
        description: orgData.description || undefined
      });
      
      console.log('Organization created:', response.data);
      setSuccess(`Organization "${orgData.name}" created successfully!`);
      
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
      
    } catch (err) {
      console.error('Failed to create organization:', err);
      setError(err.response?.data?.message || 'Failed to create organization');
      setLoading(false);
    }
  };


  const handleJoinByCode = async (inviteCode) => {
    try {
      setLoading(true);
      await auth.api.post('/organizations/join', {
        invite_code: inviteCode,
        client_key: clientKey
      });
      completeOnboarding();
    } catch (err) {
      setError('Invalid invitation code');
      setLoading(false);
    }
  };

  const completeOnboarding = () => {
    // Redirect back to the application
    const finalUrl = `/callback?access_token=${encodeURIComponent(accessToken)}&state=${state}`;
    window.location.href = finalUrl;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
        <CircularProgress />
        <Typography>Setting up your account...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 3 }}>
        <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 400 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>Try Again</Button>
      </Box>
    );
  }

  // Determine available tabs
  const showInvitationTab = !!onboardingData?.pending_invitation;
  const showCreateTab = ['create_org', 'flexible'].includes('flexible');
  const showJoinTab = ['invitation_only', 'flexible'].includes('flexible');

  // Map activeTab index to content
  const getTabContent = () => {
    let currentIndex = 0;
    
    if (showInvitationTab) {
      if (activeTab === currentIndex) return 'invitation';
      currentIndex++;
    }
    
    if (showCreateTab) {
      if (activeTab === currentIndex) return 'create';
      currentIndex++;
    }
    
    if (showJoinTab) {
      if (activeTab === currentIndex) return 'join';
      currentIndex++;
    }
    
    return null;
  };

  const currentTabContent = getTabContent();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        p: 3,
      }}
    >
      <Container maxWidth="md">
        <Card sx={{ borderRadius: 3, overflow: 'visible' }}>
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: '12px 12px 0 0', mt: -2, mx: 2, boxShadow: 3 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Welcome to 9890
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Let's get your organization set up
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, v) => setActiveTab(v)}
              centered
              sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
            >
              {showInvitationTab && <Tab icon={<InviteIcon />} label="Pending Invitation" />}
              {showCreateTab && <Tab icon={<BusinessIcon />} label="Create Organization" />}
              {showJoinTab && <Tab icon={<JoinIcon />} label="Join Organization" />}
            </Tabs>

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>
            )}

            {currentTabContent === 'invitation' && onboardingData?.pending_invitation && (
              <PendingInvitation 
                invitation={onboardingData.pending_invitation}
                onAccept={handleAcceptInvitation}
              />
            )}

            {currentTabContent === 'create' && (
              <CreateOrganizationForm 
                onSubmit={handleCreateOrganization}
                organizationModel="multi"
              />
            )}

            {currentTabContent === 'join' && (
              <JoinOrganizationForm 
                onSubmit={handleJoinByCode}
                allowDomainMatching={'flexible' === 'domain_matching'}
                userEmail={onboardingData?.user?.email}
              />
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

// Sub-components
function PendingInvitation({ invitation, onAccept }) {
  return (
    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>You've been invited!</Typography>
      <Box sx={{ my: 2 }}>
        <Typography><strong>Organization:</strong> {invitation.organization.name}</Typography>
        <Typography><strong>Role:</strong> {invitation.role.name}</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
        <Button variant="contained" onClick={() => onAccept(invitation.id)}>Accept Invitation</Button>
        <Button variant="outlined" color="error">Decline</Button>
      </Box>
    </Paper>
  );
}

function CreateOrganizationForm({ onSubmit, organizationModel }) {
  const [formData, setFormData] = useState({ name: '', description: '', website: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h6" align="center" gutterBottom>Create Your Organization</Typography>
      <TextField
        fullWidth
        label="Organization Name"
        required
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        sx={{ mb: 2, mt: 2 }}
      />
      <TextField
        fullWidth
        label="Description"
        multiline
        rows={3}
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Website (Optional)"
        value={formData.website}
        onChange={(e) => setFormData({...formData, website: e.target.value})}
        sx={{ mb: 3 }}
      />
      <Button type="submit" variant="contained" size="large" fullWidth>Create Organization</Button>
    </Box>
  );
}

function JoinOrganizationForm({ onSubmit, allowDomainMatching, userEmail }) {
  const [inviteCode, setInviteCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(inviteCode);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h6" align="center" gutterBottom>Join an Organization</Typography>
      
      {allowDomainMatching && (
        <Alert severity="info" sx={{ mb: 3 }}>
          We'll check if your email domain ({userEmail?.split('@')[1]}) matches any existing organizations.
        </Alert>
      )}
      
      <TextField
        fullWidth
        label="Invitation Code"
        required
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value)}
        helperText="Ask your organization admin for an invitation code"
        sx={{ mb: 3, mt: 2 }}
      />
      <Button type="submit" variant="contained" size="large" fullWidth>Join Organization</Button>
    </Box>
  );
}