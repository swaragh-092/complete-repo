

// account-ui/src/pages/Login.jsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { auth } from '@spidy092/auth-client';
import { getQueryParams } from '../utils/queryParams';
import { getClientConfig } from '../config/clientRegistry';
// TODO [STEP-3]: Migrate to service layer when API backend is ready:
// import { getClientSync as getClientConfig } from '../services/clientRegistryService';
import LoadingSpinner from '../components/LoadingSpinner';
import ClientCard from '../components/ClientCard';
import { Alert, AlertTitle, Stack } from '@mui/material';

export default function Login() {
  const { client, redirect_uri } = getQueryParams(window.location.search);
  const [searchParams] = useSearchParams();
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Check if session expired
  const sessionExpired = searchParams.get('expired') === 'true';
  const expiredReason = searchParams.get('reason');

  // Check for auth errors (e.g. social login failures)
  const authError = searchParams.get('error');
  const authErrorMessage = searchParams.get('message');

  useEffect(() => {
    // Async function inside useEffect to handle async getClientConfig
    async function loadClientConfig() {
      // Resolve client
      let currentClient = client || "account-ui";

      // Always take redirect URL from registry (NOW ASYNC)
      const registryConfig = await getClientConfig(currentClient);
      let currentRedirectUri = registryConfig.redirectUrl;

      console.log('Centralized Login serving client:', {
        requestedClient: client,
        resolvedClient: currentClient,
        redirectUri: currentRedirectUri,
        sessionExpired,
        expiredReason,
        authError
      });

      // If session expired OR auth error, don't auto-redirect even if token exists
      if (sessionExpired || authError) {
        if (sessionExpired) {
          console.log('⚠️ Session expired, clearing any stale tokens');
        } else {
          console.log('⚠️ Auth error present, clearing potentially invalid tokens');
        }
        auth.clearToken();
        auth.clearRefreshToken();
      }

      // Check if already authenticated (only if not coming from expiration or error)
      if (!sessionExpired && !authError) {
        const token = auth.getToken();
        if (token && !auth.isTokenExpired(token)) {
          // Note: currentRedirectUri already ends with /callback (e.g., http://admin.local.test:5173/callback)
          // So we just append the query parameters, not another /callback
          // WARNING [SECURITY-DEFERRED]: Token exposed in URL query params.
          // See SECURITY_DEFERRED.md item #1 for production fix.
          const destination = currentClient === 'account-ui'
            ? '/profile'
            : `${currentRedirectUri}?access_token=${token}`;
          
          console.log('Already authenticated, redirecting to:', destination);
          window.location.href = destination;
          return;
        }
      }

      // Load client info
      setClientInfo({
        ...registryConfig,
        clientKey: currentClient,
        redirectUrl: currentRedirectUri
      });

      console.log('Displaying login for client:', registryConfig);
    }

    loadClientConfig();
  }, [client, redirect_uri, sessionExpired, expiredReason, authError]);


  const onLogin = () => {
    if (!clientInfo) return;
    
    setLoading(true);
    console.log('🔐 Redirecting to auth service for:', clientInfo.clientKey);

    try {
      auth.login(clientInfo.clientKey, clientInfo.redirectUrl);
    } catch (error) {
      console.error('❌ Failed to initiate login:', error);
      setLoading(false);
      alert('Failed to start login. Please try again.');
    }
  };

  if (!clientInfo) return <LoadingSpinner />;
  
  return (
    <div className="login-container">
      {/* Session Expired Message */}
      <Stack spacing={2} sx={{ mb: 3, maxWidth: '400px', mx: 'auto' }}>
        {sessionExpired && (
          <Alert severity="warning" variant="filled">
            <AlertTitle>Session Expired</AlertTitle>
            {expiredReason === 'session_deleted' 
              ? 'Your session was terminated by an administrator. Please sign in again.'
              : 'Your session has expired. Please sign in again to continue.'}
          </Alert>
        )}

        {authError && (
          <Alert severity="error" variant="filled">
            <AlertTitle>Authentication Failed</AlertTitle>
             {authErrorMessage ? decodeURIComponent(authErrorMessage) : `Error: ${authError}`}
          </Alert>
        )}
      </Stack>
      
      <div className="login-header">
        <h2>Sign in to continue</h2>
        <p>You are being redirected from <strong>{clientInfo.name}</strong></p>
      </div>
      <ClientCard 
        client={clientInfo} 
        onLogin={onLogin} 
        isLoading={loading} 
      />
    </div>
  );
}

