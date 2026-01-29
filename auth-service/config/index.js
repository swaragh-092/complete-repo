const dotenv = require('dotenv');
dotenv.config();

const { Client, Realm } = require('./database');

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8081';
// FRONTEND_AUTH_URL: Browser-accessible Keycloak URL (for OAuth redirects)
const FRONTEND_AUTH_URL = process.env.FRONTEND_AUTH_URL || KEYCLOAK_URL;
const KEYCLOAK_ADMIN_CLIENT_ID = process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli';
const KEYCLOAK_ADMIN_USERNAME = process.env.KEYCLOAK_ADMIN_USERNAME || 'admin';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin123';

// SECURITY: No fallback - this MUST be set via environment variable
const KEYCLOAK_ACCOUNT_UI_CLIENT_SECRET = process.env.KEYCLOAK_ACCOUNT_UI_CLIENT_SECRET;
if (!KEYCLOAK_ACCOUNT_UI_CLIENT_SECRET) {
  console.error('CRITICAL: KEYCLOAK_ACCOUNT_UI_CLIENT_SECRET environment variable is not set!');
  // Allow startup to continue for development, but log a warning
}

async function loadClients() {
  const clients = await Client.findAll({
    include: [{
      model: Realm,
      required: true, // INNER JOIN to ensure Realm exists
    }]
  });

  // console.log('Loaded clients:', JSON.stringify(clients, null, 2));
  return clients.reduce((acc, client) => {
    if (!client.Realm) {
      console.warn(`Client ${client.client_key} has no associated Realm, skipping`);
      return acc;
    }

    acc[client.client_key] = {
      realm: client.Realm.realm_name,
      realm_id: client.Realm.id,
      client_id: client.client_id,
      client_secret: client.client_secret,
      callback_url: client.callback_url,
      redirect_url: client.redirect_url,
      requires_tenant: client.requires_tenant || false,
      requires_organization: client.requires_organization || false,
      // Include full Realm object for backward compatibility
      Realm: client.Realm,
    };
    return acc;
  }, {});
}

// Centralized URL Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ACCOUNT_UI_URL = process.env.ACCOUNT_UI_URL || 'http://localhost:5174';
const APP_URL = process.env.APP_URL || 'http://localhost:4000';
const REDIRECT_URL_SUCCESS = process.env.REDIRECT_URL_SUCCESS || `${FRONTEND_URL}/auth/success`;

const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://admin.local.test:5173',
  'https://account.local.test:5174'
];

// Lazy-loaded Keycloak Service instances
// IMPORTANT: We use lazy loading to avoid importing KeycloakService before
// the undici global dispatcher is configured in server.js
let KeycloakService = null;
const keycloakInstances = new Map();

function getKeycloakServiceClass() {
  if (!KeycloakService) {
    KeycloakService = require('../services/keycloak.service');
  }
  return KeycloakService;
}

/**
 * Get a cached, initialized KeycloakService instance for a realm.
 * Avoids repeated initialization overhead.
 * @param {string} realm - The Keycloak realm name
 * @returns {Promise<KeycloakService>} Initialized KeycloakService instance
 */
async function getKeycloakService(realm = 'master') {
  if (keycloakInstances.has(realm)) {
    return keycloakInstances.get(realm);
  }

  const KcService = getKeycloakServiceClass();
  const kc = new KcService(realm);
  await kc.initialize();
  keycloakInstances.set(realm, kc);
  return kc;
}

module.exports = {
  KEYCLOAK_URL,
  FRONTEND_AUTH_URL,
  KEYCLOAK_ADMIN_CLIENT_ID,
  KEYCLOAK_ADMIN_USERNAME,
  KEYCLOAK_ADMIN_PASSWORD,
  loadClients,
  KEYCLOAK_ACCOUNT_UI_CLIENT_SECRET,
  FRONTEND_URL,
  ACCOUNT_UI_URL,
  APP_URL,
  REDIRECT_URL_SUCCESS,
  CORS_ORIGINS,
  DEFAULT_DEV_ORIGINS,
  getKeycloakService
};