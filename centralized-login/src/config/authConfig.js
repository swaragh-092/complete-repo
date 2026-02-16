// centralized-login/src/config/authConfig.js
import { auth } from '@spidy092/auth-client';

const config = {
  clientKey: import.meta.env.VITE_CLIENT_KEY,
  authBaseUrl: import.meta.env.VITE_AUTH_BASE_URL,
  accountUiUrl: import.meta.env.VITE_ACCOUNT_UI_URL,
  redirectUri: import.meta.env.VITE_REDIRECT_URI,
  isRouter: true,

  // Keycloak is the single authority for session/token lifetimes.
  // auth-client reads the JWT's exp claim and auto-schedules refreshes (60s buffer).
  // Session validation pings Keycloak every 15 min to catch admin-deleted sessions.
  // No frontend idle timeout — Keycloak's SSO Session Idle handles this via refresh failure.

  // Dev only — in production, set false and rely on httpOnly cookies.
  persistRefreshToken: true,

  // ========== SESSION SECURITY CONFIGURATION ==========
  tokenRefreshBuffer: 60, // Refresh 60s before expiry
  sessionValidationInterval: 15 * 60 * 1000, // Validate every 15 minutes
  enableSessionValidation: true,
  enableProactiveRefresh: true,
  validateOnVisibility: true,
};

auth.setConfig(config);

// ========== CROSS-TAB LOGOUT SYNC ==========
const AUTH_CHANNEL_NAME = 'auth_account_ui_channel';
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

  if (isRefreshing) return; // Prevent duplicate attempts
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
  stopSessionSecurity();

  // auth-client handles:
  // 1. Proactive refresh — reads JWT exp, refreshes 60s before expiry
  // 2. Session monitor — pings Keycloak every 15 min to verify session exists
  // Both are Keycloak-reactive, not frontend-invented timeouts.
  sessionSecurityCleanup = auth.startSessionSecurity(handleSessionExpired);
}

// Start session security if authenticated
if (auth.isAuthenticated()) {
  startSessionSecurity();
}

// Token listener — start/stop security on login/logout
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
