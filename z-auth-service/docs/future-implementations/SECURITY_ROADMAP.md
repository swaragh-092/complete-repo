# Future Security Implementation Roadmap

This document outlines high-priority security features planned for future implementation in the Auth Service.

## 1. 🌍 Impossible Travel Detection

**Goal**: Block or alert on logins that occur from geographically impossible distances within a short timeframe.

### Implementation Strategy
- **Service**: `ImpossibleTravelService`
- **Data Source**: MaxMind GeoLite2 (via `geoip-lite`)
- **Logic**: 
  - Store login location (lat/long) in `login_locations` table.
  - Calculate velocity between last and current login using Haversine formula.
  - Threshold: > 1000 km/h.
- **Action**: Alert first, then Soft Block (MFA), then Hard Block.

## 2. 🛡️ IP Reputation Checking

**Goal**: Prevent logins from known malicious IP addresses (botnets, abusers).

### Implementation Strategy
- **Service**: `IPReputationService`
- **Data Source**: AbuseIPDB API + Local Blocklist.
- **Logic**:
  - Check incoming IP against cache/API.
  - Risk Score > 80: Hard Block.
  - Risk Score > 60: Soft Block (MFA).
- **Table**: `ip_blocklist` for manual overrides.

## 3. 🔐 MFA Step-Up Authentication

**Goal**: Require fresh MFA verification for sensitive operations even if already logged in.

### Implementation Strategy
- **Service**: `MFAStepUpService`
- **Trigger**: Sensitive actions (Delete Account, Change Password, Unlink Provider).
- **Mechanism**:
  - Check `last_mfa_verification` timestamp.
  - If > 5 minutes, challenge user (TOTP/Backup Code).
- **Middleware**: `requireMFAStepUp(operation_name)`.

## 4. Current Status
- **Brute Force Protection**: Managed primarily by Keycloak.
- **Basic MFA**: Login-time MFA available via Keycloak/Centralized Login.
- **Social Login**: Implemented (Google, Microsoft, GitHub) but requires stability improvements.

---
*Created: 2026-01-12*
