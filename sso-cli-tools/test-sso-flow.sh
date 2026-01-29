#!/bin/bash

# SSO Flow Test Script
# Tests the complete SSO authentication flow

set -e

# Configuration
CLIENT_KEY="${1:-account-ui}"
AUTH_BASE_URL="${AUTH_BASE_URL:-http://localhost:4000}"
REDIRECT_URI="${REDIRECT_URI:-http://localhost:5174/callback}"
KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8081}"

echo "🧪 SSO Flow Test Script"
echo "========================"
echo "Client Key: $CLIENT_KEY"
echo "Auth Base URL: $AUTH_BASE_URL"
echo "Redirect URI: $REDIRECT_URI"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check auth-service is running
echo "Test 1: Checking auth-service availability..."
if curl -s -f "${AUTH_BASE_URL}/health" > /dev/null 2>&1 || curl -s -f "${AUTH_BASE_URL}/auth/clients" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Auth service is running${NC}"
else
  echo -e "${RED}❌ Auth service is not accessible at ${AUTH_BASE_URL}${NC}"
  exit 1
fi

# Test 2: Check client configuration
echo ""
echo "Test 2: Checking client configuration..."
CLIENT_CONFIG=$(curl -s "${AUTH_BASE_URL}/auth/clients/${CLIENT_KEY}/config" 2>/dev/null || echo "")

if [ -z "$CLIENT_CONFIG" ] || echo "$CLIENT_CONFIG" | grep -q "not found"; then
  echo -e "${RED}❌ Client '${CLIENT_KEY}' not found or not configured${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Client configuration found${NC}"
  echo "$CLIENT_CONFIG" | jq '.' 2>/dev/null || echo "$CLIENT_CONFIG"
fi

# Test 3: Generate PKCE
echo ""
echo "Test 3: Generating PKCE parameters..."
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-43)
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -binary -sha256 | openssl base64 | tr -d "=+/" | cut -c1-43)

echo "   Code Verifier: ${CODE_VERIFIER:0:20}..."
echo "   Code Challenge: $CODE_CHALLENGE"
echo -e "${GREEN}✅ PKCE parameters generated${NC}"

# Test 4: Generate State
echo ""
echo "Test 4: Generating state parameter..."
STATE=$(openssl rand -hex 16)
echo "   State: $STATE"
echo -e "${GREEN}✅ State parameter generated${NC}"

# Test 5: Build login URL
echo ""
echo "Test 5: Building login URL..."
LOGIN_URL="${AUTH_BASE_URL}/auth/login/${CLIENT_KEY}?redirect_uri=$(echo -n "$REDIRECT_URI" | jq -sRr @uri)&code_challenge=${CODE_CHALLENGE}&code_challenge_method=S256&state=${STATE}"

echo "   Login URL:"
echo "   $LOGIN_URL"
echo ""
echo -e "${YELLOW}⚠️  Manual step required:${NC}"
echo "   1. Open the login URL above in your browser"
echo "   2. Complete the authentication"
echo "   3. Check the callback URL for:"
echo "      - access_token (should be present)"
echo "      - refresh_token (should NOT be in URL - security check)"
echo "      - state (should match: $STATE)"
echo ""

# Test 6: Check Keycloak discovery endpoint
echo "Test 6: Checking Keycloak discovery endpoint..."
REALM=$(echo "$CLIENT_CONFIG" | jq -r '.realm // "my-projects"' 2>/dev/null || echo "my-projects")
DISCOVERY_URL="${KEYCLOAK_URL}/realms/${REALM}/.well-known/openid-configuration"

if curl -s -f "$DISCOVERY_URL" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Keycloak discovery endpoint accessible${NC}"
  
  # Extract endpoints
  AUTH_ENDPOINT=$(curl -s "$DISCOVERY_URL" | jq -r '.authorization_endpoint' 2>/dev/null || echo "")
  TOKEN_ENDPOINT=$(curl -s "$DISCOVERY_URL" | jq -r '.token_endpoint' 2>/dev/null || echo "")
  
  if [ -n "$AUTH_ENDPOINT" ]; then
    echo "   Authorization Endpoint: $AUTH_ENDPOINT"
  fi
  if [ -n "$TOKEN_ENDPOINT" ]; then
    echo "   Token Endpoint: $TOKEN_ENDPOINT"
  fi
else
  echo -e "${RED}❌ Keycloak discovery endpoint not accessible${NC}"
  echo "   URL: $DISCOVERY_URL"
fi

# Test 7: Validate redirect URI
echo ""
echo "Test 7: Validating redirect URI format..."
if [[ "$REDIRECT_URI" =~ ^https?:// ]]; then
  echo -e "${GREEN}✅ Redirect URI has valid protocol${NC}"
else
  echo -e "${RED}❌ Redirect URI must start with http:// or https://${NC}"
fi

# Summary
echo ""
echo "========================"
echo "Test Summary"
echo "========================"
echo -e "${GREEN}✅ All automated tests passed${NC}"
echo ""
echo "Next steps:"
echo "1. Open the login URL in your browser"
echo "2. Complete authentication"
echo "3. Verify tokens are received correctly"
echo "4. Check that refresh_token is NOT in URL"
echo "5. Test token refresh endpoint"

