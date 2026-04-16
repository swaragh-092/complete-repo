# Social Login Enterprise Report - Auth Service

## Executive Summary

The auth-service implements a comprehensive social login system built on **Keycloak** as the Identity Broker, with support for **Google**, **Microsoft**, **GitHub**, **Apple**, and direct Keycloak authentication. The implementation includes account linking, suspicious login detection, organization-level provider restrictions, and federated identity tracking.

---

## 🏛️ Architecture Overview

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Frontend Apps     │────▶│    Auth Service     │────▶│     Keycloak        │
│  (React/Vue/etc)    │     │  (Node.js/Express)  │     │  (Identity Broker)  │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
                                      │                          │
                                      ▼                          ▼
                            ┌─────────────────────┐     ┌─────────────────────┐
                            │     PostgreSQL      │     │  Identity Providers │
                            │ - FederatedIdentity │     │ - Google            │
                            │ - UserMetadata      │     │ - Microsoft         │
                            │ - Organizations     │     │ - GitHub            │
                            └─────────────────────┘     │ - Apple             │
                                                        └─────────────────────┘
```

### Supported Providers
| Provider            | Status   | Trust Level | Auto-Verify Email |
| ------------------- | -------- | ----------- | ----------------- |
| Google              | ✅ Active | Trusted     | Yes               |
| Microsoft           | ✅ Active | Trusted     | Yes               |
| GitHub              | ✅ Active | Trusted     | Yes               |
| Apple               | ✅ Active | Trusted     | Yes               |
| Keycloak (password) | ✅ Active | N/A         | No                |

---

## 📁 Key Files Reference

| File                                                                                                              | Description                                |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [social-login.service.js](file:///home/sr-user91/Desktop/SSO/auth-service/services/social-login.service.js)       | Core social login business logic           |
| [passport.service.js](file:///home/sr-user91/Desktop/SSO/auth-service/services/passport.service.js)               | OIDC strategy & provider detection         |
| [auth.routes.js](file:///home/sr-user91/Desktop/SSO/auth-service/routes/auth/auth.routes.js)                      | OAuth callback handling (L264-724)         |
| [account.routes.js](file:///home/sr-user91/Desktop/SSO/auth-service/routes/auth/account.routes.js)                | Connected accounts management (L2104-2290) |
| [FederatedIdentityMapping.js](file:///home/sr-user91/Desktop/SSO/auth-service/models/FederatedIdentityMapping.js) | Federated identity database model          |
| [Organization.js](file:///home/sr-user91/Desktop/SSO/auth-service/models/Organization.js)                         | Org-level provider restrictions            |

---

## 🔐 Core SocialLoginService Methods

### 1. `handleAccountLinking(user, client)`
**Purpose**: Handle account linking edge cases for social login users.

**Flow**:
```
┌─────────────────────┐
│ User social login   │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Is provider         │──YES──▶ Skip (direct KC login)
│ 'keycloak'?         │
└─────────┬───────────┘
          │ NO
          ▼
┌─────────────────────┐
│ User exists in DB?  │──NO───▶ Allow (new user creation)
└─────────┬───────────┘
          │ YES
          ▼
┌─────────────────────┐
│ Same provider as    │──YES──▶ Allow (existing provider login)
│ previous logins?    │
└─────────┬───────────┘
          │ NO (account linking scenario)
          ▼
┌─────────────────────┐
│ Trusted provider?   │──YES──▶ Auto-link account
│ (Google/MS/GitHub)  │
└─────────┬───────────┘
          │ NO
          ▼
┌─────────────────────┐
│ Email verified?     │──YES──▶ Allow linking
└─────────┬───────────┘
          │ NO
          ▼
┌─────────────────────┐
│ Block: EMAIL_NOT_   │
│ VERIFIED            │
└─────────────────────┘
```

**Edge Cases Handled**:
- ✅ Brand new user (create account)
- ✅ Existing user same provider (normal login)
- ✅ Existing user + new trusted provider (auto-link)
- ✅ Existing user + untrusted provider + verified email (manual link)
- ✅ Existing user + untrusted provider + unverified email (BLOCKED)

---

### 2. `trackFederatedLogin(user, req)`
**Purpose**: Track federated identity mappings and auto-verify emails for trusted providers.

**Key Features**:
- Creates/updates `FederatedIdentityMapping` records
- Auto-verifies email in Keycloak for trusted providers (Google, Microsoft, GitHub, Apple)
- Updates `last_login_provider` on `UserMetadata`
- Stores metadata: `isWorkspace`, `emailVerified`, `givenName`, `familyName`

**Database Schema**:
```sql
federated_identity_mapping (
  id UUID PRIMARY KEY,
  user_id UUID → user_metadata.id,
  provider VARCHAR(50),        -- 'google', 'microsoft', etc.
  provider_user_id VARCHAR(255),
  provider_email VARCHAR(255),
  linked_at TIMESTAMP,
  last_login TIMESTAMP,
  metadata JSON
)
```

---

### 3. `detectSuspiciousLogin(user, req)`
**Purpose**: Detect rapid provider switching (potential account takeover).

**Detection Rules**:
| Alert                      | Condition                                  |
| -------------------------- | ------------------------------------------ |
| `RAPID_PROVIDER_SWITCHING` | >3 different provider logins within 1 hour |

> [!WARNING]
> **Gap Identified**: Currently only checks for rapid provider switching. Missing:
> - Impossible travel detection
> - New device + new provider combination
> - Login from known compromised IPs
> - Time-zone based anomaly detection

---

### 4. `validateProviderForOrganization(user, orgId)`
**Purpose**: Enforce organization-level provider restrictions.

**Organization Settings**:
```javascript
// Organization model fields
allowed_providers: ['google', 'microsoft', 'github', 'keycloak'],
email_domain_restriction: '@company.com',
enforce_provider_domain: true,  // Require workspace accounts (not personal)
require_workspace_email: true   // Block personal emails entirely
```

**Edge Cases**:
- ✅ No org context → Allow all providers
- ✅ Org not found → Block with `ORG_NOT_FOUND`
- ✅ Provider not in `allowed_providers` → Block with `PROVIDER_NOT_ALLOWED`

---

## 🔄 OAuth Callback Flow (auth.routes.js)

### Flow Sequence
```
1. Social Login Checks
   └── handleAccountLinking()

2. Track Federated Login
   └── trackFederatedLogin()

3. Suspicious Login Detection
   └── detectSuspiciousLogin()

4. Device Trust Check
   └── TrustedDevicesService.isDeviceTrusted()
   └── TrustedDevicesService.registerDevice()

5. Pending Invitation Check
   └── AuthCallbackService.handlePendingInvitations()

6. Tenant Requirements Check
   └── AuthCallbackService.checkTenantRequirements()

7. Organization Context
   └── AuthCallbackService.getUserOrganizationContext()

8. Token Storage
   └── RefreshTokenService.storeToken()

9. Audit Logging
   └── AuditService.log('USER_LOGIN', ...)
```

---

## ⚙️ Provider Detection Logic (passport.service.js)

| Token Claim                                 | Provider Detected               |
| ------------------------------------------- | ------------------------------- |
| `identity_provider`                         | Value from claim                |
| Issuer contains `accounts.google.com`       | `google`                        |
| Issuer contains `login.microsoftonline.com` | `microsoft`                     |
| Issuer contains `github.com`                | `github`                        |
| `broker_session_id` present                 | `identity_provider` or `google` |
| Default                                     | `keycloak`                      |

**Workspace Detection**:
```javascript
isWorkspace: claims.hd ? true : false,  // Google Workspace hosted domain
workspaceDomain: claims.hd ?? null
```

---

## 🛡️ Edge Case Analysis

### ✅ Handled Edge Cases

| Edge Case                                         | Handling                        | Location                            |
| ------------------------------------------------- | ------------------------------- | ----------------------------------- |
| Email collision (same email, different providers) | Auto-link for trusted providers | `handleAccountLinking()`            |
| Unverified email linking                          | Block for untrusted providers   | `handleAccountLinking()`            |
| Rapid provider switching                          | Alert logged                    | `detectSuspiciousLogin()`           |
| Org-level provider restrictions                   | Block with error                | `validateProviderForOrganization()` |
| Missing refresh token                             | Warning logged, continues       | Callback flow L618                  |
| Keycloak session mismatch                         | Logs debug info                 | Callback flow L358                  |
| Workspace vs personal email                       | Tracked in metadata             | `isWorkspace` flag                  |
| First-time social user                            | Keycloak creates account        | `handleAccountLinking()` CASE 1     |
| Single login method unlink prevention             | Block                           | Account routes L2188                |

### ⚠️ Missing Edge Cases (Enterprise Gaps)

| Gap                                       | Risk Level | Recommendation                                   |
| ----------------------------------------- | ---------- | ------------------------------------------------ |
| **No impossible travel detection**        | 🔴 High     | Add geo-IP based velocity check                  |
| **No IP reputation check**                | 🟡 Medium   | Integrate IP reputation API                      |
| **No device + provider correlation**      | 🟡 Medium   | Flag new device + new provider combo             |
| **No time-based anomaly detection**       | 🟢 Low      | Add unusual login time warnings                  |
| **Limited suspicious patterns**           | 🟡 Medium   | Expand to multiple patterns                      |
| **No MFA enforcement for social**         | 🔴 High     | Require 2FA for sensitive ops after social login |
| **No social login rate limiting**         | 🟡 Medium   | Add per-user social login rate limits            |
| **No provider-specific session timeouts** | 🟢 Low      | Configure per-provider session policies          |

---

## 📊 Database Models

### FederatedIdentityMapping
```
┌────────────────────────────────────────────────┐
│ federated_identity_mapping                     │
├────────────────────────────────────────────────┤
│ id: UUID (PK)                                  │
│ user_id: UUID (FK → user_metadata)             │
│ provider: VARCHAR(50)                          │
│ provider_user_id: VARCHAR(255)                 │
│ provider_email: VARCHAR(255)                   │
│ linked_at: TIMESTAMP                           │
│ last_login: TIMESTAMP                          │
│ metadata: JSON                                 │
│   - isWorkspace: BOOLEAN                       │
│   - workspaceDomain: STRING                    │
│   - emailVerified: BOOLEAN                     │
│   - givenName: STRING                          │
│   - familyName: STRING                         │
├────────────────────────────────────────────────┤
│ UNIQUE INDEX: (provider, provider_user_id)     │
│ INDEX: user_id                                 │
│ INDEX: provider                                │
│ INDEX: provider_email                          │
└────────────────────────────────────────────────┘
```

### UserMetadata (social login fields)
```
user_metadata
├── last_login_provider: VARCHAR(50)
└── last_login_ip: VARCHAR(45)
```

### Organization (social login controls)
```
organizations
├── allowed_providers: JSON (default: ['google', 'microsoft', 'github', 'keycloak'])
├── email_domain_restriction: VARCHAR(100)
├── enforce_provider_domain: BOOLEAN
└── require_workspace_email: BOOLEAN
```

---

## 📡 API Endpoints

### Social Login Management

| Method | Endpoint                                    | Description                          |
| ------ | ------------------------------------------- | ------------------------------------ |
| GET    | `/api/account/connected-accounts`           | List all linked social providers     |
| DELETE | `/api/account/connected-accounts/:provider` | Unlink a social provider             |
| GET    | `/api/account/login-history`                | Get login history with provider info |

### OAuth Flow

| Method | Endpoint                 | Description                  |
| ------ | ------------------------ | ---------------------------- |
| GET    | `/auth/login/:client`    | Initiate OAuth flow          |
| GET    | `/auth/callback/:client` | OAuth callback handler       |
| POST   | `/auth/logout/:client`   | Logout with provider support |

---

## 🔒 Security Considerations

### Strengths
- ✅ Email verification required for untrusted providers
- ✅ Auto-verification for trusted providers (Google, MS, GitHub)
- ✅ Workspace email detection (Google Workspace)
- ✅ Per-organization provider restrictions
- ✅ Federated identity tracking with metadata
- ✅ Audit logging for social login events
- ✅ Protection against unlinking single login method

### Weaknesses
- ❌ No MFA enforcement post-social-login
- ❌ Limited suspicious activity patterns
- ❌ No geo-IP velocity checks
- ❌ Missing rate limiting on social auth

---

## 🚀 Recommendations

### High Priority
1. **Add impossible travel detection** - Block logins from geographically impossible locations
2. **Implement MFA step-up** - Require 2FA for sensitive operations after social login
3. **Add IP reputation checking** - Block known malicious IPs

### Medium Priority
4. **Expand suspicious patterns** - Add more detection rules (concurrent sessions, unusual devices)
5. **Add rate limiting** - Limit social login attempts per user/IP
6. **Provider-specific session policies** - Different session durations per provider

### Low Priority
7. **Time-based anomaly detection** - Flag logins at unusual hours
8. **Provider health monitoring** - Alert when IdP is unavailable

---

## ✅ Conclusion

The auth-service social login implementation is **production-ready** with solid fundamentals:
- Keycloak-based identity brokering with 5 providers
- Proper account linking with email verification
- Organization-level provider controls
- Federated identity tracking

**Maturity Level**: 🟡 **Production-Ready (with gaps)**

For enterprise-grade security, address the high-priority recommendations, particularly MFA enforcement and geo-IP detection.
