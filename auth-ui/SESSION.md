# Session Architecture & Debugging Guide

This project follows a **Keycloak-Authoritative** session model. The frontend (React) reacts to Keycloak's session state rather than enforcing its own timeouts.

## Core Concepts

1.  **Keycloak is the Source of Truth**: Session lifetime, idle timeouts, and max lifespans are configured in Keycloak.
2.  **Short-Lived Access Tokens**: Access tokens are short-lived (e.g., 5 minutes) to minimize risk.
3.  **Proactive Refresh**: The frontend silently refreshes the token *before* it expires to ensure a seamless user experience.
4.  **Session Monitoring**: The frontend periodically ping the auth server to check if the session is still valid (e.g., if an admin revoked it).

## Configuration

The session behavior is controlled by `@spidy092/auth-client` defaults, adhering to enterprise security standards.

| Setting                     | Default  | Purpose                                                                                                        |
| --------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `tokenRefreshBuffer`        | `60s`    | **Safety Margin**. Refresh token 60s *before* expiry. Prevents race conditions.                                |
| `sessionValidationInterval` | `15m`    | **Background Check**. Ping Keycloak every 15m to catch remote revocations.                                     |
| `validateOnVisibility`      | `true`   | **Tab Switch**. Check session status immediately when user returns to the tab.                                 |
| `persistRefreshToken`       | `false`* | **Dev Mode**. Stores refresh token in localStorage (default is httpOnly cookie). *Often set to `true` in dev.* |

> **Note**: Frontend "Idle Timeout" logic has been **removed**. We rely on Keycloak's "SSO Session Idle" timeout. If the user is inactive for too long, the next token refresh will fail, and they will be logged out.

## Debug Panel Legend

If the application includes the `<SessionDebug />` component (usually bottom-right), here is what the metrics mean:

| Metric               | Value (Example) | Description                                                                                                |
| -------------------- | --------------- | ---------------------------------------------------------------------------------------------------------- |
| **ACCESS TOKEN**     |                 | **Information directly from your Keycloak JWT**                                                            |
| Expires in           | `212s`          | Seconds until your current access token dies.                                                              |
| Proactive refresh in | `152s`          | Time until the app *silently* requests a new token. Calculated as `Expires in` minus `tokenRefreshBuffer`. |
| **SESSION CONFIG**   |                 | **Settings controlling the session engine**                                                                |
| `tokenRefreshBuffer` | `60s`           | The "safety zone". If this is 60s, we refresh at T-60s.                                                    |
| `Refreshes`          | `5`             | Count of successful silent refreshes since page load.                                                      |

## Troubleshooting

### "Token Expired"?
-   Check if `Proactive refresh in` is counting down.
-   If it stays at 0 or negative, proactive refresh might be disabled or failing.
-   Check console logs for `🔄 Proactive token refresh triggered`.

### "Session Expired"?
-   Did you revoke the session in Keycloak?
-   Did the "SSO Session Idle" timeout hit?
-   Check console logs for `401 Unauthorized` during refresh.

### Cross-Tab Sync
-   Logging out in one tab should logout all other tabs immediately.
-   This uses `BroadcastChannel`. If not working, check console for "BroadcastChannel not supported".
