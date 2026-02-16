/**
 * @fileoverview Auth Configuration
 * @description Auth client setup with session security, cross-tab sync, and idle timeout
 * @matches centalized-login pattern
 */

import { auth } from '@spidy092/auth-client';

const config = {
  clientKey: 'token-test',
  authBaseUrl: import.meta.env.VITE_AUTH_BASE_URL,
  accountUiUrl: import.meta.env.VITE_ACCOUNT_UI_URL,
  redirectUri: import.meta.env.VITE_REDIRECT_URI,
  
  // ✅ Organization Configuration
  requiresOrganization: import.meta.env.VITE_REQUIRES_ORGANIZATION === 'true',
  organizationModel: import.meta.env.VITE_ORGANIZATION_MODEL,
  onboardingFlow: import.meta.env.VITE_ONBOARDING_FLOW,
  
  // ========== SESSION SECURITY CONFIGURATION (matches centalized-login) ==========
  tokenRefreshBuffer: 120, // Refresh 2 minutes before expiry (same as centalized-login)
  sessionValidationInterval: 5 * 60 * 1000, // Validate every 5 minutes (same as centalized-login)
  idleTimeoutMs: 30 * 60 * 1000, // 30 minutes
  enableSessionValidation: true,
  enableProactiveRefresh: true,
  validateOnVisibility: false, // Disabled - was causing session_deleted_while_hidden errors
  enableIdleTimeout: true,
  skipValidationWhenHidden: true, // Skip validation when tab is hidden
  persistRefreshToken: true, // ✅ Store refresh token in localStorage (needed for local HTTPS)
  
  // API configuration
  api: {
    baseURL: import.meta.env.VITE_AUTH_BASE_URL,
    timeout: 10000,
    withCredentials: true
  }
};


console.log('🔑 token-test auth config:', {
  clientKey: config.clientKey,
  requiresOrganization: config.requiresOrganization,
  sessionValidation: config.enableSessionValidation,
});

auth.setConfig(config);

// ========== CROSS-TAB LOGOUT SYNC ==========
const AUTH_CHANNEL_NAME = 'auth_token-test_channel';
let authChannel = null;

function initCrossTabSync() {
  if (typeof BroadcastChannel === 'undefined') {
    console.warn('⚠️ BroadcastChannel not supported');
    return;
  }

  authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);

  authChannel.onmessage = (event) => {
    const { type, reason } = event.data;

    if (type === 'LOGOUT') {
      console.log('📢 Logout from another tab:', reason);
      auth.clearToken();
      auth.clearRefreshToken();
      stopSessionSecurity();
      
      const loginUrl = new URL('/login', window.location.origin);
      loginUrl.searchParams.set('expired', 'true');
      loginUrl.searchParams.set('reason', reason || 'logout_from_other_tab');
      window.location.href = loginUrl.toString();
    }
  };

  console.log('📡 Cross-tab sync initialized');
}

function broadcastLogout(reason) {
  if (authChannel) {
    authChannel.postMessage({ type: 'LOGOUT', reason });
  }
}

function closeCrossTabSync() {
  if (authChannel) {
    authChannel.close();
    authChannel = null;
  }
}

initCrossTabSync();

// ========== SESSION SECURITY ==========
let sessionSecurityCleanup = null;
let idleTimer = null;
let lastActivityTime = Date.now();

function resetIdleTimer() {
  lastActivityTime = Date.now();
}

function stopSessionSecurity() {
  if (sessionSecurityCleanup) {
    sessionSecurityCleanup.stopAll();
    sessionSecurityCleanup = null;
  }
  if (idleTimer) {
    clearInterval(idleTimer);
    idleTimer = null;
  }
  if (typeof document !== 'undefined') {
    document.removeEventListener('mousemove', resetIdleTimer);
    document.removeEventListener('keydown', resetIdleTimer);
    document.removeEventListener('click', resetIdleTimer);
    document.removeEventListener('scroll', resetIdleTimer);
  }
}

function handleSessionExpired(reason) {
  console.log('🚨 Session expired:', reason);
  auth.clearToken();
  auth.clearRefreshToken();
  broadcastLogout(reason); // ✅ Notify other tabs

  const loginUrl = new URL('/login', window.location.origin);
  loginUrl.searchParams.set('expired', 'true');
  loginUrl.searchParams.set('reason', reason);
  window.location.href = loginUrl.toString();
}

function startSessionSecurity() {
  console.log('🔐 Starting session security');
  stopSessionSecurity();
  lastActivityTime = Date.now();

  // Start auth-client's session security
  sessionSecurityCleanup = auth.startSessionSecurity(handleSessionExpired);

  // Add idle timeout
  if (config.enableIdleTimeout && typeof document !== 'undefined') {
    document.addEventListener('mousemove', resetIdleTimer);
    document.addEventListener('keydown', resetIdleTimer);
    document.addEventListener('click', resetIdleTimer);
    document.addEventListener('scroll', resetIdleTimer);

    idleTimer = setInterval(() => {
      const idleTime = Date.now() - lastActivityTime;
      if (idleTime > config.idleTimeoutMs) {
        console.log('⏰ Idle timeout');
        stopSessionSecurity();
        auth.clearToken();
        auth.clearRefreshToken();
        broadcastLogout('idle_timeout');
        handleSessionExpired('idle_timeout');
      }
    }, 60000);
  }
}

// Start session security if authenticated
if (auth.isAuthenticated()) {
  startSessionSecurity();
}

// Token listener
auth.addTokenListener((newToken, oldToken) => {
  if (newToken && !oldToken) {
    startSessionSecurity();
  } else if (!newToken && oldToken) {
    stopSessionSecurity();
  }
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  stopSessionSecurity();
  closeCrossTabSync();
});

export default config;
