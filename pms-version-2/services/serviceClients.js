// Author: Gururaj
// Created: 14th Oct 2025
// Description: Lightweight HTTP client factories for communicating with the Auth service.
// Version: 1.0.0
// Modified:

"use strict";

/**
 * Centralized Service Clients for PMS
 *
 * Single source of truth for all cross-service HTTP clients.
 * Uses lazy initialization — clients are created on first use.
 *
 * Usage:
 *   const { authClient, emailClient } = require('./serviceClients');
 *   await emailClient().post('/api/v1/email/send', payload);
 *   await authClient().post('/auth/workspaces/members/lookup', payload);
 */

const { ServiceHttpClient } = require("@spidy092/service-auth");

// Detect if running locally (outside Docker) or inside Docker
// If DOCKER_ENV is not set, we're running locally
const isLocalDevelopment = !process.env.DOCKER_ENV;

// Service URLs with smart defaults
const EMAIL_SERVICE_URL =
  process.env.EMAIL_SERVICE_URL ||
  (isLocalDevelopment ? "http://localhost:4011" : "http://email-service:4011");

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL ||
  process.env.DOMAIN_AUTH ||
  (isLocalDevelopment ? "http://localhost:4000" : "http://auth-service:4000");

// Keycloak URL - use localhost:8081 for local dev, keycloak:8080 for Docker
const KEYCLOAK_URL =
  process.env.KEYCLOAK_URL ||
  (isLocalDevelopment ? "http://localhost:8081" : "http://keycloak:8080");

// Debug logging on startup
console.log("[ServiceClients] Configuration:", {
  isLocalDevelopment,
  KEYCLOAK_URL,
  AUTH_SERVICE_URL,
  NODE_ENV: process.env.NODE_ENV,
  DOCKER_ENV: process.env.DOCKER_ENV,
});

// ── Singletons ──────────────────────────────────────────────────────────────
let _emailClient = null;
let _authClient = null;

/**
 * Get the email-service HTTP client (lazy init, cached).
 * @returns {ServiceHttpClient}
 */
function emailClient() {
  if (!_emailClient) {
    _emailClient = new ServiceHttpClient({
      keycloakUrl: KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM || "my-projects",
      clientId: process.env.SERVICE_CLIENT_ID,
      clientSecret: process.env.SERVICE_CLIENT_SECRET,
      baseUrl: EMAIL_SERVICE_URL,
    });
  }
  return _emailClient;
}

/**
 * Get the auth-service HTTP client (lazy init, cached).
 * @returns {ServiceHttpClient}
 */
function authClient() {
  if (!_authClient) {
    console.log("[authClient] Creating new ServiceHttpClient with:", {
      keycloakUrl: KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM || "my-projects",
      clientId: process.env.SERVICE_CLIENT_ID || "pms-service",
      baseUrl: AUTH_SERVICE_URL,
    });

    _authClient = new ServiceHttpClient({
      keycloakUrl: KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM || "my-projects",
      clientId: process.env.SERVICE_CLIENT_ID || "pms-service",
      clientSecret:
        process.env.SERVICE_CLIENT_SECRET || "dV2ljSAo1fiYtobOoOjrSEJiMXtcshyg",
      baseUrl: AUTH_SERVICE_URL,
    });
  } else {
    console.log("[authClient] Reusing cached ServiceHttpClient");
  }
  return _authClient;
} 

module.exports = {
  emailClient,
  authClient,
};
