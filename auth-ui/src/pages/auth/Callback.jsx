import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth as authClient } from '@spidy092/auth-client';
import { auth as authService } from '../../services/auth';

function Callback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return;
    setProcessed(true);

    try {
      const token = authClient.handleCallback();
    
      // Extract and store refresh_token from URL (for HTTP development)
      const params = new URLSearchParams(location.search);
      const refreshToken = params.get('refresh_token');
      if (refreshToken) {
        authClient.setRefreshToken(refreshToken);
      }
    
      if (token) {
        // ✅ Set token via local service to update API headers
        authService.setToken(token);
        
        // ✅ Small delay to ensure listeners fire before navigation
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      }
    } catch (e) {
      console.error('❌ Admin UI callback error:', e);
      setError(e.message);
    }
  }, [navigate, location.search, processed]);

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Authentication Failed</h3>
        <p>{error}</p>
        <button onClick={() => {
          setError(null);
          setProcessed(false);
          navigate('/login');
        }}>Try Again</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <div>Finalizing authentication...</div>
    </div>
  );
}

export default Callback;
