# SSO Gateway Setup Documentation

This document details the complete setup of the SSO system with a unified Docker Gateway for HTTPS access.

---

## 🎯 Overview

The SSO system consists of:
- **Gateway** - Nginx reverse proxy with TLS termination
- **Auth-Service** - OAuth/OIDC backend API
- **Centralized-Login** - Account UI (login page)
- **Auth-UI** - Admin dashboard
- **Keycloak** - Identity provider

All services run behind a single Nginx Gateway with HTTPS using `*.local.test` domains.

---

## 📁 Modified Files

| File                                        | Changes                    |
| :------------------------------------------ | :------------------------- |
| `docker-compose.yml`                        | Added gateway service      |
| `gateway/nginx.conf`                        | Nginx reverse proxy config |
| `keycloak-setup/docker-compose.yml`         | Added KC_HOSTNAME_URL      |
| `auth-service/config/index.js`              | Added FRONTEND_AUTH_URL    |
| `auth-service/services/passport.service.js` | Fixed OAuth URLs           |
| `auth-service/services/jwt.service.js`      | Fixed JWT issuer           |

---

## 🔧 Configuration Details

### 1. Nginx Gateway (`gateway/nginx.conf`)

```nginx
events {
  worker_connections 1024;
}

http {
  # SSL Settings
  ssl_certificate     /etc/nginx/certs/cert.pem;
  ssl_certificate_key /etc/nginx/certs/key.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  # Proxy Headers
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto https;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Real-IP $remote_addr;
  
  # Timeout settings (CRITICAL for OAuth callback)
  proxy_connect_timeout 60s;
  proxy_send_timeout 60s;
  proxy_read_timeout 60s;
  
  # Buffer settings (for large JWT tokens)
  proxy_buffer_size 128k;
  proxy_buffers 4 256k;
  proxy_busy_buffers_size 256k;

  # HTTP -> HTTPS Redirect
  server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
  }

  # Admin Dashboard
  server {
    listen 443 ssl;
    server_name admin.local.test;
    location / { proxy_pass http://auth-ui:80; }
  }

  # Account UI (Login)
  server {
    listen 443 ssl;
    server_name account.local.test;
    location / { proxy_pass http://centralized-login:80; }
  }

  # Auth Service API
  server {
    listen 443 ssl;
    server_name auth.local.test;
    location / { proxy_pass http://auth-service:4000; }
  }
}
```

**Important Notes:**
- Proxy timeout must be 60s+ (token exchange takes time)
- Buffer size must be large for JWT tokens (~2KB)
- Without these settings, OAuth callbacks return 502

---

### 2. Keycloak Configuration (`keycloak-setup/docker-compose.yml`)

```yaml
environment:
  KC_HOSTNAME: keycloak.local.test
  KC_HOSTNAME_URL: https://keycloak.local.test:8443
  KC_HOSTNAME_STRICT: "false"
  KC_HOSTNAME_STRICT_HTTPS: "false"
  KC_HTTP_ENABLED: "true"
```

**Key Setting:** `KC_HOSTNAME_URL` forces Keycloak to advertise the HTTPS URL as the issuer in tokens.

---

### 3. Auth-Service Configuration

#### `config/index.js`
```javascript
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:8080';
const FRONTEND_AUTH_URL = process.env.FRONTEND_AUTH_URL || 'https://keycloak.local.test:8443';

module.exports = {
  KEYCLOAK_URL,        // Internal Docker communication
  FRONTEND_AUTH_URL,   // Browser-facing OAuth URLs
  // ...
};
```

#### `services/passport.service.js`
```javascript
const { KEYCLOAK_URL, FRONTEND_AUTH_URL } = require('../config');

new OpenIdConnectStrategy({
  issuer: `${FRONTEND_AUTH_URL}/realms/${realm}`,           // Browser URL
  authorizationURL: `${FRONTEND_AUTH_URL}/realms/.../auth`, // Browser URL
  tokenURL: `${KEYCLOAK_URL}/realms/.../token`,             // Internal URL
  skipUserProfile: true,  // Required - avoids issuer mismatch on userinfo
});
```

#### `services/jwt.service.js`
```javascript
const { KEYCLOAK_URL, FRONTEND_AUTH_URL } = require('../config');

jwt.verify(token, getKey, {
  issuer: `${FRONTEND_AUTH_URL}/realms/${realm}`,  // Match token issuer
  algorithms: ['RS256'],
});
```

---

### 4. Database Updates

#### Client Redirect URLs
```sql
UPDATE clients SET 
  callback_url = 'https://auth.local.test/auth/callback/account-ui',
  redirect_url = 'https://account.local.test/callback'
WHERE client_key = 'account-ui';

UPDATE clients SET 
  callback_url = 'https://auth.local.test/auth/callback/admin-ui',
  redirect_url = 'https://admin.local.test/callback'
WHERE client_key = 'admin-ui';
```

#### Missing Schema Column
```sql
ALTER TABLE organization_memberships 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
```

---

## 🌐 URL Architecture

```
BROWSER URLs:
  https://account.local.test     → centralized-login:80
  https://admin.local.test       → auth-ui:80
  https://auth.local.test        → auth-service:4000
  https://keycloak.local.test:8443 → keycloak:8443

INTERNAL Docker URLs:
  http://centralized-login:80
  http://auth-ui:80
  http://auth-service:4000
  http://keycloak:8080
```

---

## 🔐 OAuth Flow

1. User visits `https://account.local.test/login`
2. Gateway proxies to `centralized-login:80`
3. Frontend calls `https://auth.local.test/auth/login/account-ui`
4. Auth-service redirects to `https://keycloak.local.test:8443/auth`
5. User logs in at Keycloak
6. Keycloak redirects to `https://auth.local.test/auth/callback/account-ui?code=...`
7. Auth-service exchanges code for tokens (calls `http://keycloak:8080/token` internally)
8. Auth-service redirects to `https://account.local.test/callback?access_token=...`
9. Frontend stores token and fetches profile

---

## 🧪 Verification Commands

```bash
# Check containers
sudo docker ps

# Check Keycloak issuer
curl -k https://keycloak.local.test:8443/realms/my-projects/.well-known/openid-configuration | jq .issuer

# Test gateway health
curl -k https://auth.local.test/health

# View auth-service logs
sudo docker logs sso-auth-service --tail 50

# View gateway logs
sudo docker logs sso-gateway --tail 50
```

---

## ⚠️ Common Issues

| Issue                                | Cause                       | Solution                    |
| :----------------------------------- | :-------------------------- | :-------------------------- |
| Browser shows `http://keycloak:8080` | Wrong OAuth URL             | Use `FRONTEND_AUTH_URL`     |
| 401 on userinfo                      | Issuer mismatch             | Set `skipUserProfile: true` |
| 502 on callback                      | Nginx timeout               | Add 60s timeout settings    |
| JWT verification failed              | Wrong issuer in jwt.service | Use `FRONTEND_AUTH_URL`     |
| Profile 500 error                    | Missing DB column           | Add `status` column         |

---

## 📋 Setup Checklist

- [ ] Generate TLS certs: `cd keycloak-setup && ./setup-https.sh`
- [ ] Add to `/etc/hosts`:
  ```
  127.0.0.1 account.local.test admin.local.test auth.local.test keycloak.local.test
  ```
- [ ] Set environment variables:
  ```
  KEYCLOAK_URL=http://keycloak:8080
  FRONTEND_AUTH_URL=https://keycloak.local.test:8443
  ```
- [ ] Update database redirect URLs
- [ ] Start services: `sudo docker compose up -d`
- [ ] Test login flow

---

## 📝 Environment Variables

| Variable            | Value                              | Used By                 |
| :------------------ | :--------------------------------- | :---------------------- |
| `KEYCLOAK_URL`      | `http://keycloak:8080`             | auth-service (internal) |
| `FRONTEND_AUTH_URL` | `https://keycloak.local.test:8443` | auth-service (browser)  |
| `KC_HOSTNAME_URL`   | `https://keycloak.local.test:8443` | keycloak                |

---

*Last updated: 2026-01-27*
