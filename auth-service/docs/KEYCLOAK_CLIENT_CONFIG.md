# Keycloak Client Configuration for Refresh Tokens

## 🔧 Manual Configuration Steps

### Step 1: Access Keycloak Admin Console
1. Navigate to: `http://localhost:8081` (or your Keycloak URL)
2. Login as admin
3. Select your realm (e.g., `my-projects`)

### Step 2: Configure Client Settings

#### Basic Settings Tab
```
Client ID: {your-client-id}
Client Protocol: openid-connect
Access Type: confidential ✅ (CRITICAL - must be confidential)
Standard Flow Enabled: ON ✅
Direct Access Grants Enabled: ON ✅ (Required for refresh tokens)
Implicit Flow Enabled: OFF
Service Accounts Enabled: ON (optional)
```

#### Advanced Settings Tab
```
Access Token Lifespan: 300 (5 minutes)
Refresh Token Lifespan: 2592000 (30 days)
Client Session Idle Timeout: 1800 (30 minutes)
Client Session Max Lifespan: 36000 (10 hours)
```

### Step 3: Configure Client Scopes

1. Go to: **Clients → Your Client → Client Scopes Tab**

2. **Default Client Scopes** (must include):
   - ✅ `offline_access` - **CRITICAL for refresh tokens**
   - ✅ `openid`
   - ✅ `profile`
   - ✅ `email`
   - ✅ `roles`
   - ✅ `web-origins`

3. **Optional Client Scopes** (can include):
   - `offline_access` (if not in default)
   - `address`
   - `phone`
   - `microprofile-jwt`

4. **To Add `offline_access` to Default:**
   - Go to: **Client Scopes** (left menu)
   - Find `offline_access` scope
   - Click **Add to Default** or drag to Default Client Scopes

### Step 4: Verify Configuration

#### Test Token Request
```bash
# Get authorization code first (via browser login)
# Then exchange for tokens:

curl -X POST \
  "http://localhost:8081/realms/my-projects/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=your-client-id" \
  -d "client_secret=your-client-secret" \
  -d "grant_type=authorization_code" \
  -d "code={authorization_code}" \
  -d "redirect_uri=http://localhost:4000/auth/callback/your-client-key" \
  -d "scope=openid profile email offline_access"
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiw...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiw...",  // ✅ Must be present
  "expires_in": 300,
  "refresh_expires_in": 2592000,
  "token_type": "Bearer",
  "not-before-policy": 0,
  "session_state": "...",
  "scope": "openid profile email offline_access"
}
```

## 🔄 Programmatic Configuration (via Code)

The `KeycloakService.createClient()` method now automatically configures clients for refresh tokens:

```javascript
const KeycloakService = require('./services/keycloak.service');

const kc = new KeycloakService('my-projects');
await kc.initialize();

await kc.createClient({
  clientId: 'my-client',
  secret: 'my-secret',
  redirectUris: ['http://localhost:4000/auth/callback/my-client']
});
```

This automatically:
- ✅ Sets `directAccessGrantsEnabled: true`
- ✅ Configures token lifespans
- ✅ Adds `offline_access` to scopes
- ✅ Assigns `offline_access` scope to client

## 📋 Configuration Checklist

For each client that needs refresh tokens:

- [ ] Access Type = `confidential`
- [ ] Standard Flow Enabled = `ON`
- [ ] Direct Access Grants Enabled = `ON`
- [ ] `offline_access` in Default Client Scopes
- [ ] Refresh Token Lifespan = `2592000` (30 days)
- [ ] Access Token Lifespan = `300` (5 minutes)

## 🐛 Common Issues

### Issue: Refresh token not in response

**Check:**
1. Is `offline_access` in Default Client Scopes? (not Optional)
2. Is Access Type `confidential`? (not `public`)
3. Is Direct Access Grants Enabled?
4. Is `offline_access` included in the authorization request scope?

**Fix:**
```javascript
// In passport.service.js - already fixed
scope: ['openid', 'profile', 'email', 'offline_access']
```

### Issue: "Invalid grant" error

**Causes:**
- Client secret mismatch
- Wrong realm
- Token expired
- Token already used (if rotation enabled)

**Fix:**
- Verify client secret in database matches Keycloak
- Check realm name is correct
- Ensure token hasn't expired
- Don't reuse refresh tokens (rotation enabled)

## 🔍 Verification Queries

### Check Keycloak Client Configuration (via Admin API)

```bash
# Get admin token
ADMIN_TOKEN=$(curl -X POST \
  "http://localhost:8081/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" | jq -r '.access_token')

# Get client details
curl -X GET \
  "http://localhost:8081/admin/realms/my-projects/clients?clientId=your-client-id" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[0] | {
    clientId,
    publicClient,
    directAccessGrantsEnabled,
    standardFlowEnabled
  }'
```

### Check Client Scopes

```bash
# Get default scopes
curl -X GET \
  "http://localhost:8081/admin/realms/my-projects/clients/{client-uuid}/default-client-scopes" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[] | select(.name == "offline_access")'
```

## 📝 Realm-Level Settings (Optional)

For realm-wide refresh token settings:

1. Go to: **Realm Settings → Tokens Tab**
2. Configure:
   - **Default Signature Algorithm:** RS256
   - **Access Token Lifespan:** 5 Minutes
   - **SSO Session Idle:** 30 Minutes
   - **SSO Session Max:** 10 Hours
   - **Access Token Lifespan For Implicit Flow:** 15 Minutes
   - **Client Login Timeout:** 1 Minute

These are defaults - client-level settings override them.

## ✅ Final Verification

After configuration, test the complete flow:

1. **Login:**
   ```bash
   # Should return refresh_token
   curl -X POST ".../token" -d "grant_type=authorization_code" -d "scope=... offline_access"
   ```

2. **Refresh:**
   ```bash
   # Should return new access_token + new refresh_token
   curl -X POST ".../token" -d "grant_type=refresh_token" -d "refresh_token=..."
   ```

3. **Logout:**
   ```bash
   # Should revoke token
   curl -X POST ".../logout" -d "refresh_token=..."
   ```

All should work without errors! 🎉







