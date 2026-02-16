/**
 * @fileoverview Auth Configuration
 * @description Auth client setup with session security and cross-tab sync
 * @matches centalized-login pattern
 */

import { auth } from '@spidy092/auth-client';

const config = {
  clientKey: 'new-token',
  authBaseUrl: import.meta.env.VITE_AUTH_BASE_URL,
  accountUiUrl: import.meta.env.VITE_ACCOUNT_UI_URL,
  redirectUri: import.meta.env.VITE_REDIRECT_URI,

  // ✅ Organization Configuration
  requiresOrganization: import.meta.env.VITE_REQUIRES_ORGANIZATION === 'true',
  organizationModel: import.meta.env.VITE_ORGANIZATION_MODEL,
  onboardingFlow: import.meta.env.VITE_ONBOARDING_FLOW,

  // ========== SESSION SECURITY CONFIGURATION (matches centalized-login) ==========
  tokenRefreshBuffer: 60, // Refresh 60s before expiry
  sessionValidationInterval: 15 * 60 * 1000, // Validate every 15 minutes
  enableSessionValidation: true,
  enableProactiveRefresh: true,
  validateOnVisibility: true,
  persistRefreshToken: true, // ✅ Store refresh token in localStorage (needed for local HTTPS)

  // API configuration
  api: {
    baseURL: import.meta.env.VITE_AUTH_BASE_URL,
    timeout: 10000,
    withCredentials: true
  }
};


console.log('🔑 new-token auth config:', {
  clientKey: config.clientKey,
  requiresOrganization: config.requiresOrganization,
  sessionValidation: config.enableSessionValidation,
});

auth.setConfig(config);

// ========== CROSS-TAB LOGOUT SYNC ==========
const AUTH_CHANNEL_NAME = 'auth_new-token_channel';
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

function stopSessionSecurity() {
  if (sessionSecurityCleanup) {
    sessionSecurityCleanup.stopAll();
    sessionSecurityCleanup = null;
  }
}

// Guard against concurrent refresh attempts
let isRefreshing = false;

async function handleSessionExpired(reason) {
  // ── Resilient handler: try to refresh before giving up ──
  // Browsers throttle background-tab timers, so proactive refresh
  // may not fire while the tab is hidden.  The access token expires,
  // but the refresh token & Keycloak session are still alive.
  // A single refresh attempt can silently restore everything.

  if (isRefreshing) return;
  isRefreshing = true;

  console.log('⚠️ Session security triggered:', reason, '— attempting silent refresh…');

  try {
    await auth.refreshToken();
    console.log('✅ Token refreshed — session still active (false alarm)');
    isRefreshing = false;
    return; // Session is fine, do NOT redirect
  } catch (err) {
    console.log('❌ Refresh failed — session truly expired:', err.message);
  }

  isRefreshing = false;

  // Refresh failed → session is genuinely dead
  auth.clearToken();
  auth.clearRefreshToken();
  broadcastLogout(reason);

  const loginUrl = new URL('/login', window.location.origin);
  loginUrl.searchParams.set('expired', 'true');
  loginUrl.searchParams.set('reason', reason);
  window.location.href = loginUrl.toString();
}

function startSessionSecurity() {
  console.log('🔐 Starting session security');
  stopSessionSecurity();

  // Start auth-client's session security
  sessionSecurityCleanup = auth.startSessionSecurity(handleSessionExpired);
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
