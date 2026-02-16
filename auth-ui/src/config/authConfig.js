// admin-ui/src/config/authConfig.js
import { auth } from '@spidy092/auth-client';

const config = {
  clientKey: import.meta.env.VITE_CLIENT_KEY || 'admin-ui',
  authBaseUrl: import.meta.env.VITE_AUTH_BASE_URL || 'https://auth.local.test',
  accountUiUrl: import.meta.env.VITE_ACCOUNT_UI_URL || 'https://account.local.test',
  redirectUri: import.meta.env.VITE_CALLBACK_URL || `${window.location.origin}/callback`,

  // ========== SESSION SECURITY CONFIGURATION ==========
  // We rely on Keycloak as the source of truth for session lifetimes.
  // The frontend simply reacts to token expiry/revocation.
  tokenRefreshBuffer: 60, // Refresh 60s before expiry
  sessionValidationInterval: 15 * 60 * 1000, // Validate every 15m
  enableSessionValidation: true,
  enableProactiveRefresh: true,
  validateOnVisibility: true,
  persistRefreshToken: true, // ✅ Store refresh token in localStorage (needed for local HTTPS dev)
};

auth.setConfig(config);

// ========== CROSS-TAB LOGOUT SYNC ==========
// BroadcastChannel for syncing logout across browser tabs
const AUTH_CHANNEL_NAME = 'auth_admin_ui_channel';
let authChannel = null;

function initCrossTabSync() {
  if (typeof BroadcastChannel === 'undefined') {
    console.warn('⚠️ BroadcastChannel not supported - cross-tab sync disabled');
    return;
  }

  authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);

  authChannel.onmessage = (event) => {
    const { type, reason } = event.data;

    if (type === 'LOGOUT') {
      // Received logout from another tab
      // Clear tokens without broadcasting (to prevent loops)
      auth.clearToken();
      auth.clearRefreshToken();
      stopSessionSecurity();
      // Redirect to login
      const loginUrl = new URL('/login', window.location.origin);
      loginUrl.searchParams.set('expired', 'true');
      loginUrl.searchParams.set('reason', reason || 'logout_from_other_tab');
      window.location.href = loginUrl.toString();
    }
  };
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

// Initialize cross-tab sync
initCrossTabSync();

// ========== SESSION MANAGEMENT ==========
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

// Start session security if authenticated
if (auth.isAuthenticated()) {
  sessionSecurityCleanup = auth.startSessionSecurity(handleSessionExpired);
}

// Token listener
auth.addTokenListener((newToken, oldToken) => {
  if (newToken && !oldToken) {
    sessionSecurityCleanup = auth.startSessionSecurity(handleSessionExpired);
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
