import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@spidy092/auth-client';
import { useAuth } from '../hooks/useAuth';
import { getQueryParams } from '../utils/queryParams';
import { getClientConfig } from '../config/clientRegistry';
// TODO [STEP-3]: Migrate to service layer when API backend is ready:
// import { getClientSync as getClientConfig } from '../services/clientRegistryService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Callback() {
  const { access_token, refresh_token, error: authError, message: errorMessage } = getQueryParams(window.location.search);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { checkAuth } = useAuth(); // Get revalidation trigger
  const processed = useRef(false);

  useEffect(() => {
    // Prevent double invocation in React Strict Mode
    if (processed.current) return;

    try {
      if (authError) throw new Error(errorMessage ? decodeURIComponent(errorMessage) : `Authentication failed: ${authError}`);
      if (!access_token) throw new Error('No access token received');
      
      processed.current = true;
      
      // TODO [SECURITY-DEFERRED]: sessionStorage is vulnerable to XSS.
      // See SECURITY_DEFERRED.md item #2 for production fix.
      const originalApp = sessionStorage.getItem('originalApp');
      const returnUrl = sessionStorage.getItem('returnUrl');
      const token = auth.handleCallback();
      if (!token) throw new Error('Processing callback failed');
      
      // Notify AuthContext that token is available
      checkAuth();
      
      console.log('Callback processed successfully:', {
        token,
        originalApp,
        returnUrl
      });
      
      // If no originalApp stored, assume account-ui
      if (!originalApp || originalApp === 'account-ui') {
        navigate('/profile', { replace: true });
      } else {
        const cfg = getClientConfig(originalApp);
        let redirectTarget;

        try {
          // WARNING [SECURITY-DEFERRED]: Open redirect vulnerability.
          // returnUrl is not validated against allowed origins.
          // See SECURITY_DEFERRED.md item #3 for production fix.
          if (returnUrl) {
            redirectTarget = new URL(returnUrl);
          } else {
            const baseUrl = cfg.redirectUrl || window.location.origin;
            const ensured = baseUrl.endsWith('/callback') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/callback`;
            redirectTarget = new URL(ensured);
          }
        } catch (urlError) {
          console.warn('Invalid return URL, falling back to default callback', urlError);
          redirectTarget = new URL('/callback', cfg.redirectUrl || window.location.origin);
        }

        // WARNING [SECURITY-DEFERRED]: Tokens in URL query params.
        // Tokens can leak via browser history, referer headers, logs.
        // See SECURITY_DEFERRED.md item #1 for production fix.
        redirectTarget.searchParams.set('access_token', token);
        if (refresh_token) {
          redirectTarget.searchParams.set('refresh_token', refresh_token);
        }
        window.location.href = redirectTarget.toString();
      }
    } catch (e) {
      console.error('Callback error:', e);
      setError(e.message);
    }
  }, [access_token, authError, navigate, checkAuth]);

  if (error) return <ErrorMessage message={error} onRetry={() => navigate('/login')} />;
  return <LoadingSpinner message="Finalizing authentication…" />;
}
