// centralized-login/src/config/authConfig.js
import { auth } from '@spidy092/auth-client';

const config = {
  clientKey: import.meta.env.VITE_CLIENT_KEY,
  authBaseUrl: import.meta.env.VITE_AUTH_BASE_URL,
  accountUiUrl: import.meta.env.VITE_ACCOUNT_UI_URL,
  redirectUri: import.meta.env.VITE_REDIRECT_URI,
  isRouter: true,

  // ========== SESSION SECURITY CONFIGURATION ==========
  tokenRefreshBuffer: 120, // Refresh 2 minutes before expiry (increased from 60)
  sessionValidationInterval: 5 * 60 * 1000, // Validate every 5 minutes (was 2 minutes)
  idleTimeoutMs: 30 * 60 * 1000, // 30 minutes idle timeout
  enableSessionValidation: true,
  enableProactiveRefresh: true,
  validateOnVisibility: false, // Disabled - was causing session_deleted_while_hidden errors
  enableIdleTimeout: true,
  skipValidationWhenHidden: true, // Skip validation when tab is hidden
};

// TODO [SECURITY-DEFERRED]: Remove console.log in production.
// Exposes auth configuration. See SECURITY_DEFERRED.md item #4.
console.log('🔑 Auth config:', config);
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

  console.log('📡 Cross-tab sync initialized');
}

function broadcastLogout(reason) {
  if (authChannel) {
    console.log('📢 Broadcasting logout:', reason);
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

  // Start auth-client's built-in session security (paths work because authBaseUrl has /auth)
  sessionSecurityCleanup = auth.startSessionSecurity(handleSessionExpired);

  // Add idle timeout
  if (config.enableIdleTimeout && typeof document !== 'undefined') {
    console.log(`⏰ Idle timeout: ${config.idleTimeoutMs / 60000}min`);

    document.addEventListener('mousemove', resetIdleTimer);
    document.addEventListener('keydown', resetIdleTimer);
    document.addEventListener('click', resetIdleTimer);
    document.addEventListener('scroll', resetIdleTimer);

    idleTimer = setInterval(() => {
      const idleTime = Date.now() - lastActivityTime;
      if (idleTime > config.idleTimeoutMs) {
        console.log('⏰ Idle timeout reached');
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
    console.log('🔐 Token acquired');
    startSessionSecurity();
  } else if (!newToken && oldToken) {
    console.log('🔐 Token cleared');
    stopSessionSecurity();
  }
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  stopSessionSecurity();
  closeCrossTabSync();
});

console.log('🔧 Account UI configured with cross-tab sync:', {
  clientKey: config.clientKey,
  authBaseUrl: config.authBaseUrl,
  sessionValidation: config.sessionValidationInterval / 1000 + 's',
  idleTimeout: config.idleTimeoutMs / 60000 + 'min',
});

export default config;
