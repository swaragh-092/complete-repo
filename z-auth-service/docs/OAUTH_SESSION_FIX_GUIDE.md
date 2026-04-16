# OAuth Session & State Validation Fix Guide

## Problems Identified

1. **OAuth State Validation Failing**: Session cookies not persisting through Keycloak redirects
2. **Wrong Provider Detection**: System incorrectly detects "google" even for password login
3. **Keycloak Sessions Not Being Created**: Browser sessions not created after authentication
4. **Session Cookie Issues**: Cookies lost between redirects

## Root Causes

### 1. Session Cookie Not Sent on Cross-Site Redirects

**Problem**: When Keycloak redirects back to `auth.local.test:4000/auth/callback`, the session cookie is not sent because:
- Keycloak is on `keycloak.local.test:8081` (different domain)
- Browser security: `SameSite=lax` cookies are **NOT** sent on cross-site redirects
- `SameSite=none` requires `Secure=true` (HTTPS), which doesn't work with HTTP

**Solution Options**:
1. **Use HTTPS** (Recommended for production)
   - Set up self-signed certificates for `.local.test` domains
   - Configure `SESSION_COOKIE_SECURE=true` and `SESSION_COOKIE_SAMESITE=none`
   
2. **Use Database-Backed State Storage** (Alternative)
   - Store OAuth state in database instead of session
   - Validate state from database on callback

3. **Use Same-Site Redirects** (Not possible with Keycloak on different domain)

### 2. State Validation Disabled

**Problem**: `state: false` was added to passport config to bypass validation, but this:
- Breaks Keycloak session creation
- Removes CSRF protection
- Prevents proper SSO functionality

**Solution**: 
- ✅ **State validation is now ENABLED** (default behavior)
- Passport-openidconnect handles state validation automatically
- State is stored in `req.session['passport-openidconnect']`

### 3. Session Configuration Issues

**Problem**: 
- `saveUninitialized: false` prevented session creation before redirect
- No explicit session store configuration

**Solution**:
- ✅ Changed to `saveUninitialized: true` to ensure session is created
- ✅ Added proper session configuration with rolling expiration
- ✅ Enhanced session debugging

### 4. Provider Detection

**Problem**: System was reading `identity_provider` claim directly, which is always present (linked provider) even for password login.

**Solution**: 
- ✅ Already fixed in `passport.service.js` (lines 116-118)
- Uses `broker_session_id` to detect actual login method:
  - `broker_session_id` present → Federated/social login
  - `broker_session_id` absent → Direct Keycloak password login

## Changes Made

### 1. `server.js` - Session Configuration

```javascript
// ✅ Changed saveUninitialized to true
saveUninitialized: true, // Create session even if unmodified (needed for OAuth state)

// ✅ Added proper session ID generation
genid: (req) => {
  return require('crypto').randomBytes(16).toString('hex');
}
```

### 2. `passport.service.js` - State Validation

```javascript
// ✅ State validation is ENABLED (default)
// Do NOT set state: false as it prevents Keycloak from creating browser sessions
```

### 3. `routes/auth.js` - Callback State Validation

- ✅ Removed "DEMO MODE" workarounds
- ✅ Proper state validation with error handling
- ✅ Enhanced session debugging

## Recommended Setup for Production

### Option 1: HTTPS (Recommended)

1. **Generate self-signed certificates**:
```bash
# Generate CA certificate
openssl genrsa -out ca.key 2048
openssl req -new -x509 -days 365 -key ca.key -out ca.crt \
  -subj "/CN=Local Test CA"

# Generate server certificate for *.local.test
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr \
  -subj "/CN=*.local.test"
openssl x509 -req -days 365 -in server.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out server.crt -extensions v3_req \
  -extfile <(echo "[v3_req]"; echo "subjectAltName=DNS:*.local.test,DNS:local.test")
```

2. **Update `.env`**:
```env
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=none
SESSION_COOKIE_DOMAIN=.local.test
```

3. **Configure Express to use HTTPS**:
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
};

https.createServer(options, app).listen(4000);
```

### Option 2: Database-Backed State Storage

If HTTPS is not possible, implement database-backed state storage:

1. Create `OAuthState` table/model
2. Store state in database before redirect
3. Validate state from database on callback
4. Clean up expired states periodically

## Testing the Fix

### 1. Verify Session Creation

Check logs for:
```
🔍 CALLBACK SESSION DEBUG
  sessionExists: true
  cookieReceived: true
  passportState: present
```

### 2. Verify State Validation

- State validation should work automatically via passport-openidconnect
- Check for errors: "Unable to verify authorization request state"

### 3. Verify Provider Detection

Check logs for:
```
✅ ACTUAL LOGIN METHOD: keycloak  (for password login)
✅ ACTUAL LOGIN METHOD: google    (for Google login)
```

### 4. Verify Keycloak Sessions

After login, check Keycloak admin console:
- User should have active browser session
- Session should appear in Keycloak sessions list

## Troubleshooting

### Session Cookie Not Received

**Symptoms**: `cookieReceived: false` in logs

**Solutions**:
1. Check cookie domain matches (`.local.test`)
2. Verify `SameSite` and `Secure` settings match your setup
3. For cross-site redirects, use HTTPS + `SameSite=none`

### State Validation Failing

**Symptoms**: "Unable to verify authorization request state"

**Solutions**:
1. Ensure session is saved before redirect (check login route)
2. Verify session cookie is sent back (check callback logs)
3. For HTTP + cross-site, consider database-backed state

### Keycloak Sessions Not Created

**Symptoms**: No sessions in Keycloak admin console

**Solutions**:
1. Ensure `state: false` is NOT set in passport config
2. Verify state validation is working
3. Check Keycloak client configuration (SSO settings)

## Environment Variables

```env
# Session Configuration
SESSION_SECRET=your-secret-key-here
SESSION_COOKIE_NAME=auth.sid
SESSION_COOKIE_DOMAIN=.local.test
SESSION_COOKIE_SECURE=false  # true for HTTPS
SESSION_COOKIE_SAMESITE=lax  # none for HTTPS + cross-site
```

## Next Steps

1. ✅ Session configuration fixed
2. ✅ State validation enabled
3. ✅ Provider detection verified
4. ⚠️ **Action Required**: Set up HTTPS for proper cross-site cookie support
   - OR implement database-backed state storage
   - OR use same-site redirects (not possible with Keycloak on different domain)

## Additional Notes

- The current setup works for **same-site redirects** (if Keycloak was on same domain)
- For **cross-site redirects** (Keycloak on different domain), HTTPS is required
- Browser security prevents sending cookies on cross-site redirects without `SameSite=none` + `Secure=true`

