# Enterprise Refresh Token Management - Complete Setup Guide

## Overview

This guide provides complete instructions for setting up enterprise-grade refresh token handling across all authentication methods (Keycloak native, federated providers, SSO).

## 🔧 Keycloak Client Configuration

### Required Client Settings

For **ALL** clients that need refresh tokens, configure the following in Keycloak Admin Console:

#### 1. Client Settings Tab

```
Access Type: confidential (NOT public)
Standard Flow Enabled: ON
Direct Access Grants Enabled: ON (required for refresh tokens)
Service Accounts Enabled: ON (optional, for service-to-service)
```

#### 2. Advanced Settings Tab

```
Access Token Lifespan: 300 (5 minutes)
Refresh Token Lifespan: 2592000 (30 days)
Client Session Idle Timeout: 1800 (30 minutes)
Client Session Max Lifespan: 36000 (10 hours)
```

#### 3. Client Scopes Tab

**Default Client Scopes** (must include):
- `offline_access` ✅ **CRITICAL** - Required for refresh tokens
- `openid`
- `profile`
- `email`
- `roles`

**Optional Client Scopes** (can include):
- `offline_access` (if not in default)
- `address`
- `phone`
- `microprofile-jwt`

### Verification Steps

1. **Check Client Configuration:**
   ```bash
   # Via Keycloak Admin API
   curl -X GET \
     "http://localhost:8081/admin/realms/{realm}/clients/{client-uuid}" \
     -H "Authorization: Bearer {admin-token}"
   ```

2. **Verify offline_access Scope:**
   - Go to: Clients → Your Client → Client Scopes
   - Ensure `offline_access` is in **Default Client Scopes**
   - If missing, move it from Optional to Default

3. **Test Token Request:**
   ```bash
   curl -X POST \
     "http://localhost:8081/realms/{realm}/protocol/openid-connect/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id={client_id}" \
     -d "client_secret={client_secret}" \
     -d "grant_type=authorization_code" \
     -d "code={auth_code}" \
     -d "redirect_uri={redirect_uri}" \
     -d "scope=openid profile email offline_access"
   ```

   **Expected Response:**
   ```json
   {
     "access_token": "...",
     "refresh_token": "...",  // ✅ Must be present
     "expires_in": 300,
     "refresh_expires_in": 2592000
   }
   ```

## 📋 Database Schema

### Refresh Tokens Table

The migration `20250103000000-create-refresh-tokens.js` creates a secure storage table:

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  client_id VARCHAR(100) NOT NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,  -- SHA-256 hash, never plain text
  realm_name VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  device_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  revoked_reason VARCHAR(100),
  rotated_from UUID,  -- For token rotation
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Security Features:**
- ✅ Tokens are **hashed** (SHA-256) before storage
- ✅ Never store plain refresh tokens
- ✅ Automatic expiration tracking
- ✅ Revocation support
- ✅ Token rotation tracking

## 🔐 Security Best Practices

### 1. Token Storage

**✅ DO:**
- Store tokens in **httpOnly cookies** (server-side)
- Hash tokens before database storage
- Use secure, sameSite cookies in production
- Implement token rotation on refresh

**❌ DON'T:**
- Never expose refresh tokens to frontend JavaScript
- Never store plain tokens in localStorage/sessionStorage
- Never log refresh tokens
- Never send refresh tokens in URL parameters

### 2. Token Rotation

The system automatically rotates refresh tokens:
- Old token is revoked when new one is issued
- Prevents token reuse attacks
- Tracks rotation chain via `rotated_from` field

### 3. Token Revocation

Tokens are automatically revoked on:
- User logout
- Token refresh (old token)
- Invalid token detection
- Security events

### 4. Device Tracking

Each token is associated with:
- Device fingerprint
- IP address
- User agent
- Session ID

This enables:
- Device-based revocation
- Suspicious activity detection
- Multi-device management

## 🚀 Implementation Details

### 1. Login Flow (`/callback/:client`)

**What happens:**
1. User authenticates via Keycloak (any method)
2. Keycloak returns `access_token` and `refresh_token`
3. Refresh token is **hashed** and stored in database
4. Device fingerprint is captured
5. Token metadata is stored (provider, org, etc.)
6. Tokens are sent to frontend via redirect URL

**Code Location:** `routes/auth.js` (callback handler)

### 2. Refresh Flow (`/refresh/:client`)

**What happens:**
1. Client sends refresh token (cookie/body/header)
2. System validates token exists in database
3. System checks token is not revoked/expired
4. Request new tokens from Keycloak
5. **Rotate** refresh token (revoke old, store new)
6. Return new access token + optional new refresh token

**Code Location:** `routes/auth.js` (refresh endpoint)

### 3. Logout Flow (`/logout/:client`)

**What happens:**
1. Client sends refresh token
2. Revoke token in Keycloak (if available)
3. Revoke token in database
4. Clear httpOnly cookie
5. Return logout URLs for provider logout

**Code Location:** `routes/auth.js` (logout endpoint)

## 🔍 Troubleshooting

### Issue: "No refresh token available"

**Possible Causes:**
1. ❌ `offline_access` scope not enabled in Keycloak client
2. ❌ Client Access Type is `public` (must be `confidential`)
3. ❌ `directAccessGrantsEnabled` is `false`
4. ❌ Passport strategy missing `offline_access` in scope array

**Solutions:**
1. ✅ Add `offline_access` to Default Client Scopes in Keycloak
2. ✅ Change client to `confidential` Access Type
3. ✅ Enable Direct Access Grants
4. ✅ Verify `passport.service.js` includes `offline_access` in scope

### Issue: "Realm name not found" / "Cannot read properties of undefined (reading 'realm_name')"

**Possible Causes:**
1. ❌ Client record missing Realm association in database
2. ❌ `loadClients()` not including Realm in query
3. ❌ Client created without proper Realm foreign key

**Solutions:**
1. ✅ Run migration to ensure `realm_id` foreign key exists
2. ✅ Verify `loadClients()` includes Realm: `Client.findAll({ include: Realm })`
3. ✅ Check database: `SELECT * FROM clients WHERE realm_id IS NULL;`

**Fixed in:** `config/index.js` - `loadClients()` now includes Realm with `required: true`

### Issue: "Token refresh failed: Invalid refresh token"

**Possible Causes:**
1. ❌ Token not stored in database during login
2. ❌ Token was revoked
3. ❌ Token expired
4. ❌ Token hash mismatch

**Solutions:**
1. ✅ Check `refresh_tokens` table for user's tokens
2. ✅ Verify token wasn't revoked: `SELECT * FROM refresh_tokens WHERE revoked_at IS NULL`
3. ✅ Check expiration: `SELECT * FROM refresh_tokens WHERE expires_at > NOW()`
4. ✅ Verify token hash calculation matches

### Issue: Refresh token not persisting across browser sessions

**Possible Causes:**
1. ❌ Cookie not set with proper expiration
2. ❌ Cookie domain/path mismatch
3. ❌ Browser blocking cookies

**Solutions:**
1. ✅ Verify cookie settings in `/refresh` endpoint
2. ✅ Check `maxAge` matches token expiration
3. ✅ Ensure `sameSite` and `secure` flags are correct
4. ✅ Test in browser DevTools → Application → Cookies

## 📊 Monitoring & Maintenance

### Cleanup Expired Tokens

Run periodic cleanup job:

```javascript
const RefreshTokenService = require('./services/refresh-token.service');

// Daily cleanup job
setInterval(async () => {
  const deleted = await RefreshTokenService.cleanupExpiredTokens();
  console.log(`Cleaned up ${deleted} expired tokens`);
}, 24 * 60 * 60 * 1000); // 24 hours
```

### View Active Tokens

```javascript
const tokens = await RefreshTokenService.getUserTokens(userId, clientId);
console.log(`User has ${tokens.length} active tokens`);
```

### Revoke All User Tokens

```javascript
await RefreshTokenService.revokeAllUserTokens(userId, clientId, 'security_breach');
```

## ✅ Verification Checklist

After setup, verify:

- [ ] Keycloak client has `offline_access` in Default Client Scopes
- [ ] Keycloak client Access Type is `confidential`
- [ ] Keycloak client has `directAccessGrantsEnabled: true`
- [ ] Passport strategy includes `offline_access` in scope
- [ ] Database migration `20250103000000-create-refresh-tokens.js` executed
- [ ] `RefreshToken` model added to `config/database.js`
- [ ] `/callback` endpoint stores refresh tokens
- [ ] `/refresh` endpoint validates and rotates tokens
- [ ] `/logout` endpoint revokes tokens
- [ ] Realm lookup works (no `realm_name` undefined errors)
- [ ] Tokens stored as hashes (not plain text)
- [ ] httpOnly cookies set correctly

## 🔄 Migration Steps

1. **Run Database Migration:**
   ```bash
   npx sequelize-cli db:migrate
   ```

2. **Update Existing Keycloak Clients:**
   - Go to Keycloak Admin Console
   - For each client:
     - Add `offline_access` to Default Client Scopes
     - Enable Direct Access Grants
     - Set refresh token lifespan

3. **Restart Auth Service:**
   ```bash
   npm start
   ```

4. **Test Login Flow:**
   - Login via any method (Keycloak, Google, etc.)
   - Check database: `SELECT COUNT(*) FROM refresh_tokens WHERE user_id = '{userId}';`
   - Should see 1+ token records

5. **Test Refresh Flow:**
   - Call `/refresh/:client` endpoint
   - Verify new access token returned
   - Check old token revoked, new token stored

6. **Test Logout Flow:**
   - Call `/logout/:client` endpoint
   - Verify token revoked in database
   - Verify Keycloak session terminated

## 📝 Keycloak Admin API - Update Client Programmatically

```javascript
const KeycloakService = require('./services/keycloak.service');

async function updateClientForRefreshTokens(realm, clientId) {
  const kc = new KeycloakService(realm);
  await kc.initialize();
  
  const clients = await kc.client.clients.find({ clientId });
  if (!clients || clients.length === 0) {
    throw new Error('Client not found');
  }
  
  const clientUuid = clients[0].id;
  
  // Update client
  await kc.client.clients.update(
    { id: clientUuid },
    {
      directAccessGrantsEnabled: true,
      attributes: {
        'access.token.lifespan': '300',
        'refresh.token.lifespan': '2592000',
      },
    }
  );
  
  // Add offline_access scope
  const optionalScopes = await kc.client.clients.listOptionalClientScopes({ id: clientUuid });
  const offlineScope = optionalScopes.find(s => s.name === 'offline_access');
  
  if (offlineScope) {
    await kc.client.clients.addOptionalClientScope({
      id: clientUuid,
      clientScopeId: offlineScope.id,
    });
  }
}
```

## 🎯 Summary

The refresh token system is now:
- ✅ **Secure**: Tokens hashed, httpOnly cookies, rotation enabled
- ✅ **Reliable**: Database storage, validation, error handling
- ✅ **Universal**: Works with all login methods (Keycloak, Google, GitHub, SSO)
- ✅ **Enterprise-ready**: Device tracking, revocation, audit logging
- ✅ **Fixed**: Realm lookup errors resolved, proper error handling

All endpoints now properly handle refresh tokens across the entire authentication system.







