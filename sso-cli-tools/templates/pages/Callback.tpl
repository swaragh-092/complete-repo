/**
 * @fileoverview Callback Page
 * @description OAuth callback handler with refresh token support
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, useAuth } from '@spidy092/auth-client';
{{#if REQUIRES_ORGANIZATION}}
import { useOrganization } from '../context/OrganizationContext';
{{/if}}

export default function Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, setToken } = useAuth();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Processing authentication...');
  const processed = useRef(false);
  {{#if REQUIRES_ORGANIZATION}}
  const { fetchOrganizations, currentOrganization } = useOrganization();
  {{/if}}

  // STEP 1: Handle OAuth callback and save tokens
  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    (async () => {
      try {
        console.log('🔄 Processing OAuth callback');
        
        // Get tokens from URL params (passed by centralized-login)
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const errorParam = searchParams.get('error');
        
        if (errorParam) {
          throw new Error(errorParam);
        }
        
        // If tokens are in URL params (from centralized-login redirect)
        if (accessToken) {
          console.log('💾 Saving access token from URL params...');
          setToken(accessToken);
          
          // Store refresh token if provided
          if (refreshToken) {
            console.log('💾 Saving refresh token...');
            auth.setRefreshToken(refreshToken);
          }
          
          console.log('✅ Tokens saved');
        } else {
          // Fallback to standard handleCallback (for direct OIDC flow)
          const token = await auth.handleCallback();
          if (!token) throw new Error('No token received from authentication');
          
          console.log('💾 Saving token from handleCallback...');
          setToken(token);
        }
      } catch (e) {
        console.error('❌ Authentication failed:', e);
        setError(e.message || 'Authentication failed');
        setTimeout(() => navigate('/login'), 2000);
      }
    })();
  }, [searchParams, setToken, navigate]);

  // STEP 2: Handle post-authentication routing
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        {{#if REQUIRES_ORGANIZATION}}
        setStatus('Checking organization membership...');
        await fetchOrganizations();
        
        if (!currentOrganization) {
          console.log('📋 No organization selected, redirecting to selection...');
          navigate('/select-organization', { replace: true });
          return;
        }
        {{/if}}
        
        console.log('✅ Redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } catch (orgError) {
        console.error('❌ Routing error:', orgError);
        navigate('/dashboard', { replace: true });
      }
    })();
  }, [isAuthenticated, navigate{{#if REQUIRES_ORGANIZATION}}, fetchOrganizations, currentOrganization{{/if}}]);

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        padding: '20px', 
        textAlign: 'center' 
      }}>
        <h3 style={{ color: '#d32f2f', marginBottom: '16px' }}>⚠️ Authentication Error</h3>
        <p style={{ marginBottom: '24px' }}>{error}</p>
        <button 
          onClick={() => navigate('/login')} 
          style={{ 
            padding: '10px 24px', 
            backgroundColor: '#1976d2', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      gap: '20px' 
    }}>
      <div style={{ 
        width: '50px', 
        height: '50px', 
        border: '4px solid #f3f3f3', 
        borderTop: '4px solid #1976d2', 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite' 
      }} />
      <div style={{ fontSize: '16px', color: '#666' }}>{status}</div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
