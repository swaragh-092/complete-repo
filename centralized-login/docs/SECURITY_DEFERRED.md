# Security Deferred Issues

> **Status**: PRE-PRODUCTION  
> **Last Updated**: 2026-01-08  
> **Owner**: Security Team

---

## ⚠️ CRITICAL: These issues MUST be resolved before production deployment

This document tracks intentionally deferred security hardening decisions made during active development. Each item represents a known risk with a clear remediation path.

---

## 1. Tokens Passed via URL Query Parameters

| Attribute | Value |
|-----------|-------|
| **Severity** | 🔴 HIGH |
| **Files** | `src/pages/Callback.jsx`, `src/pages/Login.jsx` |
| **Lines** | Callback.jsx:50-54, Login.jsx:52-53 |
| **Risk** | Token leakage via browser history, referer headers, access logs |

### Current Behavior
```javascript
// Callback.jsx:50-54
redirectTarget.searchParams.set('access_token', token);
if (refresh_token) {
  redirectTarget.searchParams.set('refresh_token', refresh_token);
}
```

### Why Deferred
- Required for current multi-app SSO callback flow
- Breaking change requires coordinated update across all client apps

### Production Fix
- Use URL fragments (`#access_token=`) instead of query params
- OR implement HTTP-only cookie-based token transport
- Coordinate with all client applications before deployment

---

## 2. Session Storage for Security-Critical State

| Attribute | Value |
|-----------|-------|
| **Severity** | 🟠 MEDIUM |
| **Files** | `src/pages/Callback.jsx` |
| **Lines** | Callback.jsx:19-20 |
| **Risk** | XSS attacks can read/modify sessionStorage |

### Current Behavior
```javascript
// Callback.jsx:19-20
const originalApp = sessionStorage.getItem('originalApp');
const returnUrl = sessionStorage.getItem('returnUrl');
```

### Why Deferred
- Simple implementation for development
- No XSS vectors currently present (but must be validated)

### Production Fix
- Use signed/encrypted state parameters passed through OAuth flow
- Validate state against server-side session on callback

---

## 3. Unvalidated Redirect URLs

| Attribute | Value |
|-----------|-------|
| **Severity** | 🔴 HIGH |
| **Files** | `src/pages/Callback.jsx` |
| **Lines** | Callback.jsx:38-48 |
| **Risk** | Open redirect vulnerability enables phishing attacks |

### Current Behavior
```javascript
// Callback.jsx:38-48
if (returnUrl) {
  redirectTarget = new URL(returnUrl);  // No validation
}
```

### Why Deferred
- Development requires flexible redirect for testing
- Validation requires defining allowed origins list

### Production Fix
- Validate `returnUrl` against an explicit allowlist of origins
- Reject any redirect to unknown domains
- Log and alert on validation failures

---

## 4. Console Logging of Auth Configuration

| Attribute | Value |
|-----------|-------|
| **Severity** | 🟡 LOW |
| **Files** | `src/config/authConfig.js` |
| **Lines** | authConfig.js:22, 163-168 |
| **Risk** | Exposes auth configuration in browser console |

### Current Behavior
```javascript
// authConfig.js:22
console.log('🔑 Auth config:', config);
```

### Why Deferred
- Helpful for development debugging

### Production Fix
- Remove all console.log statements OR
- Use environment-aware logging that disables in production
- Add lint rule: `no-console` in production builds

---

## 5. ~~Minimal Route Protection~~ ✅ RESOLVED

| Attribute | Value |
|-----------|-------|
| **Severity** | ~~🟠 MEDIUM~~ ✅ RESOLVED |
| **Files** | `src/components/ProtectedRoute.jsx`, `src/context/AuthContext.jsx` |
| **Resolution Date** | 2026-01-08 |
| **Resolution** | RBAC infrastructure implemented |

### Implementation

The following RBAC infrastructure has been implemented:

- **`src/utils/rbac.js`** - Pure utility functions for role/permission checking with wildcard support
- **`src/context/AuthContext.jsx`** - Centralized auth context with RBAC functions
- **`src/hooks/useAuth.js`** - Hook for accessing auth context
- **`src/hooks/useRoleGate.js`** - Hook for programmatic access control checks
- **`src/components/ProtectedRoute.jsx`** - Enhanced with optional `roles` and `permissions` props
- **`src/components/RoleGate.jsx`** - Conditional rendering based on roles/permissions

### Usage

```jsx
// Route protection with roles
<ProtectedRoute roles={['admin']}>
  <AdminPanel />
</ProtectedRoute>

// Conditional rendering
<RoleGate permissions={['billing:manage']}>
  <BillingSettings />
</RoleGate>
```

---

## Pre-Production Checklist

Before deploying to production, ALL of the following must be completed:

- [ ] Item 1: Tokens removed from URL query parameters
- [ ] Item 2: sessionStorage replaced with signed state
- [ ] Item 3: Redirect URL validation implemented
- [ ] Item 4: Console logging removed/disabled
- [x] Item 5: RBAC route protection implemented ✅
- [ ] Security audit completed
- [ ] Penetration test passed

---

## Approval Required

Production deployment requires sign-off from:
- [ ] Security Team Lead
- [ ] Engineering Manager
- [ ] Product Owner
