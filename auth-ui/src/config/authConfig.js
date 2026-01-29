// admin-ui/src/config/authConfig.js
import { auth } from '@spidy092/auth-client';

const config = {
  clientKey: import.meta.env.VITE_CLIENT_KEY || 'admin-ui',
  authBaseUrl: import.meta.env.VITE_AUTH_BASE_URL || 'https://auth.local.test',
  accountUiUrl: import.meta.env.VITE_ACCOUNT_UI_URL || 'https://account.local.test',
  redirectUri: import.meta.env.VITE_CALLBACK_URL || `${window.location.origin}/callback`,

  // ========== SESSION SECURITY CONFIGURATION ==========
  tokenRefreshBuffer: 60,
  sessionValidationInterval: 2 * 60 * 1000,
  idleTimeoutMs: 30 * 60 * 1000,
  enableSessionValidation: true,
  enableProactiveRefresh: true,
  validateOnVisibility: true,
  enableIdleTimeout: true,
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
      stopCustomSessionSecurity();
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

// ========== CUSTOM SESSION VALIDATION ==========
async function validateSession() {
  try {
    const response = await auth.api.get('/auth/account/validate-session');
    return response.data.valid !== false;
  } catch (err) {
    if (err.response?.status === 401) {
      return false;
    }
    console.warn('⚠️ Session validation error:', err.message);
    return true;
  }
}

// ========== CUSTOM TOKEN REFRESH ==========
let refreshInProgress = false;
let refreshPromise = null;

async function customRefreshToken() {
  if (refreshInProgress && refreshPromise) {
    return refreshPromise;
  }

  refreshInProgress = true;
  refreshPromise = (async () => {
    try {
      const storedRefreshToken = auth.getRefreshToken();
      const requestOptions = {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      };

      if (storedRefreshToken) {
        requestOptions.headers['X-Refresh-Token'] = storedRefreshToken;
        requestOptions.body = JSON.stringify({ refreshToken: storedRefreshToken });
      }

      const response = await fetch(`${config.authBaseUrl}/auth/refresh/${config.clientKey}`, requestOptions);

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
      }

      const data = await response.json();
      const { access_token, refresh_token: new_refresh_token } = data;

      if (!access_token) {
        throw new Error('No access token in refresh response');
      }

      auth.setToken(access_token);
      if (new_refresh_token) {
        auth.setRefreshToken(new_refresh_token);
      }


      return access_token;
    } catch (err) {
      console.error('❌ Token refresh error:', err);
      throw err;
    } finally {
      refreshInProgress = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ========== SESSION SECURITY ==========
let proactiveRefreshTimer = null;
let sessionValidationTimer = null;
let visibilityHandler = null;
let idleTimer = null;
let lastActivityTime = Date.now();

function resetIdleTimer() {
  lastActivityTime = Date.now();
}

function stopCustomSessionSecurity() {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }
  if (sessionValidationTimer) {
    clearInterval(sessionValidationTimer);
    sessionValidationTimer = null;
  }
  if (idleTimer) {
    clearInterval(idleTimer);
    idleTimer = null;
  }
  if (visibilityHandler && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }
  if (typeof document !== 'undefined') {
    document.removeEventListener('mousemove', resetIdleTimer);
    document.removeEventListener('keydown', resetIdleTimer);
    document.removeEventListener('click', resetIdleTimer);
    document.removeEventListener('scroll', resetIdleTimer);
  }
}

function startCustomSessionSecurity(onSessionInvalid) {
  stopCustomSessionSecurity();
  lastActivityTime = Date.now();

  // Proactive refresh
  function scheduleRefresh() {
    const token = auth.getToken();
    if (!token) return;

    const timeUntilExpiry = auth.getTimeUntilExpiry(token);
    if (timeUntilExpiry <= 0) {
      customRefreshToken().catch(() => onSessionInvalid('token_expired'));
      return;
    }

    const refreshIn = Math.max(0, (timeUntilExpiry - config.tokenRefreshBuffer)) * 1000;

    proactiveRefreshTimer = setTimeout(async () => {
      try {
        await customRefreshToken();
        scheduleRefresh();
      } catch {
        proactiveRefreshTimer = setTimeout(scheduleRefresh, 30000);
      }
    }, refreshIn);
  }

  if (config.enableProactiveRefresh) {
    scheduleRefresh();
  }

  // Session validation
  if (config.enableSessionValidation) {
    sessionValidationTimer = setInterval(async () => {
      const token = auth.getToken();
      if (!token) {
        stopCustomSessionSecurity();
        return;
      }

      const isValid = await validateSession();
      if (!isValid) {
        stopCustomSessionSecurity();
        auth.clearToken();
        auth.clearRefreshToken();
        broadcastLogout('session_deleted'); // Notify other tabs
        onSessionInvalid('session_deleted');
      }
    }, config.sessionValidationInterval);
  }

  // Visibility validation
  if (config.validateOnVisibility && typeof document !== 'undefined') {
    visibilityHandler = async () => {
      if (document.visibilityState === 'visible') {
        const token = auth.getToken();
        if (!token) return;

        const isValid = await validateSession();
        if (!isValid) {
          stopCustomSessionSecurity();
          auth.clearToken();
          auth.clearRefreshToken();
          broadcastLogout('session_expired');
          onSessionInvalid('session_expired_while_hidden');
        }
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
  }

  // Idle timeout
  if (config.enableIdleTimeout && typeof document !== 'undefined') {
    document.addEventListener('mousemove', resetIdleTimer);
    document.addEventListener('keydown', resetIdleTimer);
    document.addEventListener('click', resetIdleTimer);
    document.addEventListener('scroll', resetIdleTimer);

    idleTimer = setInterval(() => {
      const idleTime = Date.now() - lastActivityTime;
      if (idleTime > config.idleTimeoutMs) {
        stopCustomSessionSecurity();
        auth.clearToken();
        auth.clearRefreshToken();
        broadcastLogout('idle_timeout');
        onSessionInvalid('idle_timeout');
      }
    }, 60000);
  }

  return { stopAll: stopCustomSessionSecurity };
}

// ========== SESSION MANAGEMENT ==========
let sessionSecurityCleanup = null;

function handleSessionExpired(reason) {
  auth.clearToken();
  auth.clearRefreshToken();
  broadcastLogout(reason); // ✅ Broadcast to other tabs

  const loginUrl = new URL('/login', window.location.origin);
  loginUrl.searchParams.set('expired', 'true');
  loginUrl.searchParams.set('reason', reason);
  window.location.href = loginUrl.toString();
}

// Start session security if authenticated
if (auth.isAuthenticated()) {
  sessionSecurityCleanup = startCustomSessionSecurity(handleSessionExpired);
}

// Token listener
auth.addTokenListener((newToken, oldToken) => {
  if (newToken && !oldToken) {
    sessionSecurityCleanup = startCustomSessionSecurity(handleSessionExpired);
  } else if (!newToken && oldToken) {
    if (sessionSecurityCleanup) {
      sessionSecurityCleanup.stopAll();
      sessionSecurityCleanup = null;
    }
  }
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  if (sessionSecurityCleanup) {
    sessionSecurityCleanup.stopAll();
  }
  closeCrossTabSync();
});



export default config;
