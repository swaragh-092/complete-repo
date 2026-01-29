// Note: undici global dispatcher is configured in server.js to accept self-signed certs

let KeycloakAdminClient;
let keycloakModuleLoaded = false;

// Async IIFE to load the module
const loadKeycloakModule = (async () => {
  const module = await import("@keycloak/keycloak-admin-client");
  KeycloakAdminClient = module.default;
  keycloakModuleLoaded = true;
})();


const https = require('https');
const {
  KEYCLOAK_URL,
  KEYCLOAK_ADMIN_CLIENT_ID,
  KEYCLOAK_ADMIN_USERNAME,
  KEYCLOAK_ADMIN_PASSWORD,
  KEYCLOAK_ACCOUNT_UI_CLIENT_SECRET,
  loadClients,
} = require("../config");
const logger = require("../utils/logger");
const { AppError } = require("../middleware/errorHandler");
const { log } = require('console');

// Custom HTTPS agent to accept self-signed certificates (legacy fallback)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

console.log(KEYCLOAK_URL,
  KEYCLOAK_ADMIN_CLIENT_ID,
  KEYCLOAK_ADMIN_USERNAME,
  KEYCLOAK_ADMIN_PASSWORD,
  KEYCLOAK_ACCOUNT_UI_CLIENT_SECRET,);


class KeycloakService {
  constructor(realm) {
    // Defer client creation until module is loaded
    this._realm = realm;
    this.client = null;
  }

  async _ensureClient() {
    if (this.client) return;

    // Wait for module to load
    if (!keycloakModuleLoaded) {
      await loadKeycloakModule;
    }

    this.client = new KeycloakAdminClient({
      baseUrl: KEYCLOAK_URL,
      realmName: this._realm,
    });
    this.realm = this._realm;
  }

  async initialize() {
    // Ensure client is created (waits for module to load)
    await this._ensureClient();

    const maxRetries = 3;
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        this.client.setConfig({ realmName: "master" });
        await this.client.auth({
          username: KEYCLOAK_ADMIN_USERNAME,
          password: KEYCLOAK_ADMIN_PASSWORD,
          grantType: "password",
          clientId: KEYCLOAK_ADMIN_CLIENT_ID || "admin-cli",
        });
        this.client.setConfig({ realmName: this.realm });
        this._lastAuthTime = Date.now();
        logger.info(
          `Keycloak Admin Client initialized for realm: ${this.realm}`
        );
        return;
      } catch (error) {
        logger.error(
          `Failed to initialize Keycloak Admin Client (attempt ${attempt}): ${error.message}`
        );
        if (attempt === maxRetries)
          throw new AppError(`Keycloak initialization failed: ${error.message}`);
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Enterprise-level wrapper that handles 401 errors with automatic re-authentication
   * @param {Function} operation - Async function to execute
   * @param {string} operationName - Name of the operation for logging
   * @returns {Promise<*>} Result of the operation
   */
  async withReauth(operation, operationName = 'operation') {
    try {
      return await operation();
    } catch (error) {
      // Handle 401 Unauthorized - admin token may have expired
      const is401 = error.response?.status === 401 ||
        error.message?.includes('401') ||
        error.message?.includes('Unauthorized');

      if (is401) {
        logger.warn(`Admin token expired during ${operationName}, re-authenticating...`);
        try {
          await this.initialize(); // Re-authenticate
          const result = await operation(); // Retry
          logger.info(`${operationName} succeeded after re-auth`);
          return result;
        } catch (retryError) {
          logger.error(`${operationName} failed after re-auth: ${retryError.message}`);
          throw retryError;
        }
      }
      throw error;
    }
  }

  async createRealm({ realm_name, display_name }) {
    return this.withReauth(async () => {
      await this.client.realms.create({
        id: realm_name,
        realm: realm_name,
        displayName: display_name,
        enabled: true,
        sslRequired: "none",
      });
      logger.info(`Realm created: ${realm_name}`);
    }, 'createRealm');
  }

  async getServiceAccessToken(clientKey) {
    const clients = await loadClients();
    const client = clients[clientKey];

    if (!client) throw new AppError(`Invalid client: ${clientKey}`);

    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: client.client_id,
      client_secret: client.client_secret,
    });

    const response = await fetch(
      `${KEYCLOAK_URL}/realms/${client.realm}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      throw new AppError(`Keycloak token request failed: ${response.statusText}`);
    }

    const { access_token } = await response.json();
    return access_token;
  }

  async createUser({ username, email, firstName, lastName, password, org_id }) {
    return this.withReauth(async () => {
      const user = await this.client.users.create({
        username,
        email,
        firstName,
        lastName,
        enabled: true,
        credentials: [{ type: "password", value: password, temporary: false }],
        attributes: org_id ? { tenant_id: org_id } : {},
      });
      logger.info(`User created in Keycloak: ${user.id}`);
      return user;
    }, 'createUser');
  }

  async getUser(userId) {
    return this.withReauth(async () => {
      const user = await this.client.users.findOne({ id: userId });
      if (!user) throw new AppError(`User not found: ${userId}`);
      logger.info(`Retrieved user: ${userId}`);
      return user;
    }, 'getUser');
  }

  async getAllUser({ first = 0, max = 100, search = '' } = {}) {
    return this.withReauth(async () => {
      const users = await this.client.users.find({ first, max, search: search || undefined });
      if (!users) throw new AppError(`Users not found`);
      return users;
    }, 'getAllUser');
  }

  async countUsers() {
    return this.withReauth(async () => {
      const count = await this.client.users.count();
      return count;
    }, 'countUsers');
  }

  async updateUser(
    userId,
    { username, email, firstName, lastName, enabled, org_id, attributes }
  ) {
    return this.withReauth(async () => {
      await this.client.users.update(
        { id: userId },
        {
          username,
          email,
          firstName,
          lastName,
          enabled,
          attributes: {
            ...attributes,        // include bio, locale, etc.
            ...(org_id ? { tenant_id: org_id } : {})
          }
        }
      );
      logger.info(`User updated: ${userId}`);
    }, 'updateUser');
  }

  async deleteUser(userId) {
    return this.withReauth(async () => {
      await this.client.users.del({ id: userId });
      logger.info(`User deleted: ${userId}`);
    }, 'deleteUser');
  }

  async resetUserPassword(userId, newPassword) {
    return this.withReauth(async () => {
      const user = await this.client.users.findOne({ id: userId });
      if (!user) throw new AppError(`User not found: ${userId}`);
      await this.client.users.resetPassword(
        { id: userId },
        {
          type: "password",
          value: newPassword,
          temporary: false,
        }
      );
      logger.info(`Password reset for user: ${userId}`);
    }, 'resetUserPassword');
  }

  async setUserPassword(userId, password, temporary = false) {
    return this.withReauth(async () => {
      const passwordCredential = {
        type: 'password',
        value: password,
        temporary: temporary  // false for permanent password
      };

      await this.client.users.resetPassword({
        id: userId,
        credential: passwordCredential
      });

      logger.info(`User password set: ${userId} (temporary: ${temporary})`);
    }, 'setUserPassword');
  }


  async getUserRoles(userId, clientId) {
    return this.withReauth(async () => {
      const user = await this.client.users.findOne({ id: userId });
      if (!user) throw new AppError(`User not found: ${userId}`);
      const client = await this.client.clients.find({ clientId });
      if (!client[0]) throw new AppError(`Client not found: ${clientId}`);
      const roles = await this.client.users.listClientRoleMappings({
        id: userId,
        clientUniqueId: client[0].id,
      });
      logger.info(`Roles for user ${userId} in client ${clientId}: ${roles}`);
      return roles;
    }, 'getUserRoles');
  }

  async assignRole(userId, roleName, clientId) {
    return this.withReauth(async () => {
      const client = await this.client.clients.find({ clientId });
      if (!client[0]) throw new AppError(`Client not found: ${clientId}`);
      const role = await this.client.clients.findRole({ clientId, roleName });
      if (!role) throw new AppError(`Role not found: ${roleName}`);
      await this.client.users.addClientRoleMappings({
        id: userId,
        clientUniqueId: client[0].id,
        roles: [{ id: role.id, name: role.name }],
      });
      logger.info(`Role ${roleName} assigned to user ${userId}`);
    }, 'assignRole');
  }

  async createClientRole(clientIdOrUuid, roleName, description = "") {
    return this.withReauth(async () => {
      // Check if it looks like a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientIdOrUuid);
      let clientUniqueId = clientIdOrUuid;

      if (!isUuid) {
        // Find client by clientId string
        const clients = await this.client.clients.find({ clientId: clientIdOrUuid });
        if (!clients.length) throw new AppError(`Client not found: ${clientIdOrUuid}`);
        clientUniqueId = clients[0].id;
      }

      await this.client.clients.createRole({
        id: clientUniqueId,
        name: roleName,
        description,
      });
      logger.info(`Client role created: ${roleName} for client ${clientIdOrUuid}`);
      return { clientId: clientIdOrUuid, roleName };
    }, 'createClientRole');
  }

  async getClientRoles(clientIdOrUuid) {
    return this.withReauth(async () => {
      // Check if it looks like a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientIdOrUuid);
      let clientUniqueId = clientIdOrUuid;

      if (isUuid) {
        // If UUID, use it directly as the internal id
        clientUniqueId = clientIdOrUuid;
      } else {
        // Find client by clientId string
        const clients = await this.client.clients.find({ clientId: clientIdOrUuid });
        if (!clients.length) {
          throw new AppError(`Client not found: ${clientIdOrUuid}`);
        }
        clientUniqueId = clients[0].id;
      }

      const roles = await this.client.clients.listRoles({ id: clientUniqueId });

      logger.info(`Fetched ${roles.length} roles for client: ${clientIdOrUuid}`);
      return roles;
    }, 'getClientRoles');
  }

  async getAllRealms() {
    return this.withReauth(async () => {
      // Only accessible if authenticated as a user with proper privileges in the master realm
      const realms = await this.client.realms.find();
      logger.info(`Fetched ${realms.length} realms`);
      return realms;
    }, 'getAllRealms');
  }

  /**
 * Update realm settings
 * @param {string} realmName - Name of the realm
 * @param {object} settings - Realm settings to update
 */
  /**
   * Update realm settings
   * @param {string} realmName - Name of the realm
   * @param {object} settings - Realm settings to update
   */
  async updateRealm(realmName, settings) {
    return this.withReauth(async () => {
      // Log what we're trying to update
      logger.info(`Updating realm ${realmName} with settings:`, JSON.stringify(settings, null, 2));

      // Clean up settings - remove undefined and null values
      const cleanSettings = {};
      Object.keys(settings).forEach(key => {
        if (settings[key] !== undefined && settings[key] !== null) {
          cleanSettings[key] = settings[key];
        }
      });

      // Special handling for SMTP server - Keycloak expects strings
      if (cleanSettings.smtpServer) {
        const smtp = cleanSettings.smtpServer;
        cleanSettings.smtpServer = {
          host: String(smtp.host || ''),
          port: String(smtp.port || ''),
          from: String(smtp.from || ''),
          fromDisplayName: String(smtp.fromDisplayName || ''),
          replyTo: String(smtp.replyTo || smtp.from || ''),
          replyToDisplayName: String(smtp.replyToDisplayName || smtp.fromDisplayName || ''),
          auth: String(smtp.auth === true || smtp.auth === 'true'),
          ssl: String(smtp.ssl === true || smtp.ssl === 'true'),
          starttls: String(smtp.starttls === true || smtp.starttls === 'true'),
          user: String(smtp.user || ''),
          envelopeFrom: String(smtp.from || '')
        };

        // Only include password if provided
        if (smtp.password) {
          cleanSettings.smtpServer.password = String(smtp.password);
        }

        // Remove empty SMTP if no host configured
        if (!cleanSettings.smtpServer.host) {
          delete cleanSettings.smtpServer;
        }
      }

      // Special handling for password policy
      if (cleanSettings.passwordPolicy && typeof cleanSettings.passwordPolicy === 'string') {
        // Clean up the policy string
        cleanSettings.passwordPolicy = cleanSettings.passwordPolicy
          .split(' and ')
          .filter(part => part && !part.includes('undefined'))
          .join(' and ');

        // Remove if empty
        if (!cleanSettings.passwordPolicy.trim()) {
          delete cleanSettings.passwordPolicy;
        }
      }

      // Remove read-only fields that Keycloak doesn't allow updating
      const readOnlyFields = [
        'id', 'realm', 'notBefore', 'defaultRole', 'requiredCredentials',
        'otpPolicyType', 'otpPolicyAlgorithm', 'otpPolicyInitialCounter',
        'otpPolicyDigits', 'otpPolicyLookAheadWindow', 'otpPolicyPeriod',
        'otpPolicyCodeReusable', 'otpSupportedApplications',
        'browserFlow', 'registrationFlow', 'directGrantFlow',
        'resetCredentialsFlow', 'clientAuthenticationFlow',
        'dockerAuthenticationFlow', 'firstBrokerLoginFlow',
        'clientProfiles', 'clientPolicies', 'attributes',
        'browserSecurityHeaders', 'webAuthnPolicyRpEntityName',
        'webAuthnPolicySignatureAlgorithms', 'realm_name', 'display_name'
      ];

      readOnlyFields.forEach(field => delete cleanSettings[field]);

      logger.info(`Cleaned settings to send to Keycloak:`, JSON.stringify(cleanSettings, null, 2));

      await this.client.realms.update(
        { realm: realmName },
        cleanSettings
      );

      logger.info(`Successfully updated realm: ${realmName}`);
      return true;
    }, 'updateRealm');
  }



  formatPasswordPolicy(policy) {
    const policies = [];
    if (policy.minLength) policies.push(`length(${policy.minLength})`);
    if (policy.requireSpecial) policies.push("specialChars(1)");
    if (policy.requireUppercase) policies.push("upperCase(1)");
    if (policy.requireLowercase) policies.push("lowerCase(1)");
    if (policy.requireDigit) policies.push("digits(1)");
    return policies.join(" and ");
  }

  // Helper to format SMTP settings
  formatSmtpServer(smtp) {
    return {
      host: smtp.host || "",
      port: smtp.port ? String(smtp.port) : "",
      from: smtp.from || "",
      ssl: smtp.ssl ? "true" : "false",
      starttls: smtp.starttls ? "true" : "false",
      auth: smtp.auth
        ? {
          enable: "true",
          username: smtp.username || "",
          password: smtp.password || "",
        }
        : undefined,
    };
  }

  async getRealmSettings(realmName) {
    return this.withReauth(async () => {
      const settings = await this.client.realms.findOne({ realm: realmName });
      if (!settings) throw new AppError(`Realm not found: ${realmName}`);
      logger.info(`Retrieved settings for realm: ${realmName}`);
      return settings;
    }, 'getRealmSettings');
  }

  async updateUserAttributes(userId, attributes) {
    return this.withReauth(async () => {
      // Get current user data to include required fields
      const currentUser = await this.client.users.findOne({ id: userId });
      if (!currentUser) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Process attributes to ensure proper date formatting
      const processedAttributes = {};
      Object.entries(attributes).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          // Check if this looks like a date attribute
          if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
            // Convert ISO datetime to YYYY-MM-DD format
            const dateValue = new Date(value[0]);
            if (!isNaN(dateValue.getTime())) {
              processedAttributes[key] = [dateValue.toISOString().split('T')[0]];
            } else {
              processedAttributes[key] = value;
            }
          } else {
            processedAttributes[key] = value;
          }
        } else {
          processedAttributes[key] = value;
        }
      });

      // Merge processed attributes with existing ones
      const updatedAttributes = {
        ...currentUser.attributes,
        ...processedAttributes
      };

      // Include required fields in the update payload
      const updatePayload = {
        username: currentUser.username,
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        attributes: updatedAttributes
      };

      await this.client.users.update({ id: userId }, updatePayload);
      logger.info(`User attributes updated: ${userId}`);
    }, 'updateUserAttributes');
  }




  async createClient({ clientId, secret, redirectUris }) {
    return this.withReauth(async () => {
      const clientConfig = {
        clientId,
        secret,
        redirectUris,
        protocol: "openid-connect",
        publicClient: false,
        enabled: true,
        serviceAccountsEnabled: true,
        standardFlowEnabled: true,
        directAccessGrantsEnabled: true, // Enable for refresh token support
        // Enable refresh tokens
        attributes: {
          'access.token.lifespan': '300', // 5 minutes
          'refresh.token.lifespan': '2592000', // 30 days
          'client.session.idle.timeout': '1800', // 30 minutes
          'client.session.max.lifespan': '36000', // 10 hours
        },
        // Enable offline_access scope (required for refresh tokens)
        defaultClientScopes: ['web-origins', 'role_list', 'profile', 'roles', 'email', 'offline_access'],
        optionalClientScopes: ['address', 'phone', 'offline_access', 'microprofile-jwt'],
      };

      await this.client.clients.create(clientConfig);

      // Ensure offline_access scope is assigned to the client
      try {
        const clients = await this.client.clients.find({ clientId });
        if (clients && clients.length > 0) {
          const clientUuid = clients[0].id;
          const scopes = await this.client.clients.listDefaultClientScopes({ id: clientUuid });

          // Check if offline_access is in default scopes
          const hasOfflineAccess = scopes.some(s => s.name === 'offline_access');

          if (!hasOfflineAccess) {
            // Add offline_access as optional scope
            const optionalScopes = await this.client.clients.listOptionalClientScopes({ id: clientUuid });
            const offlineScope = optionalScopes.find(s => s.name === 'offline_access');

            if (offlineScope) {
              await this.client.clients.addOptionalClientScope({
                id: clientUuid,
                clientScopeId: offlineScope.id,
              });
              logger.info(`Added offline_access scope to client: ${clientId}`);
            }
          }
        }

        // ✅ FIX: Add 'sub' protocol mapper to ensure access tokens include user subject ID
        // Uses 'oidc-usermodel-property-mapper' with 'id' property - this is the Keycloak user UUID
        try {
          const clients = await this.client.clients.find({ clientId });
          if (clients && clients.length > 0) {
            const clientUuid = clients[0].id;

            await this.client.clients.addProtocolMapper({
              id: clientUuid,
              name: 'subject',
              protocol: 'openid-connect',
              protocolMapper: 'oidc-usermodel-property-mapper',
              config: {
                'user.attribute': 'id',
                'claim.name': 'sub',
                'jsonType.label': 'String',
                'id.token.claim': 'true',
                'access.token.claim': 'true',
                'userinfo.token.claim': 'true'
              }
            });
            logger.info(`Added 'sub' protocol mapper to client: ${clientId}`);
          }
        } catch (subMapperError) {
          // Mapper might already exist, or there's an issue - log but don't fail
          logger.warn(`Could not add 'sub' mapper for ${clientId}: ${subMapperError.message}`);
        }
      } catch (scopeError) {
        logger.warn(`Could not configure offline_access scope: ${scopeError.message}`);
      }

      // await this.createTenantIdMapper(clientId);
      logger.info(`Client created with refresh token support: ${clientId}`);
    }, 'createClient');
  }

  async getClients({ first = 0, max = 100, search = '' } = {}) {
    return this.withReauth(async () => {
      const clients = await this.client.clients.find({ first, max, search: search || undefined });
      const realm = this.realm || this.client.realmName || "unknown";

      const clientsWithRealm = clients
        .filter((client) => !/^\$\{.*\}$/.test(client.name || client.clientId)) // Exclude placeholder names
        .map((client) => ({
          ...client,
          realm,
        }));

      return clientsWithRealm;
    }, 'getClients');
  }

  async countClients() {
    return this.withReauth(async () => {
      // Keycloak client API doesn't have a direct count method, so we fetch all and count
      const clients = await this.client.clients.find();
      return clients.filter((client) => !/^\$\{.*\}$/.test(client.name || client.clientId)).length;
    }, 'countClients');
  }

  async getClientById(clientIdOrUuid) {
    return this.withReauth(async () => {
      // Check if it looks like a UUID (matches UUID format)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientIdOrUuid);

      if (isUuid) {
        // Try to find by internal id first
        try {
          const client = await this.client.clients.findOne({ id: clientIdOrUuid });
          if (client) return client;
        } catch (e) {
          // Internal ID lookup failed, will try by clientId next
          logger.debug(`Client not found by UUID, trying by clientId`, { clientIdOrUuid });
        }
      }

      // Fallback: find by clientId string
      const clients = await this.client.clients.find({ clientId: clientIdOrUuid });
      if (!clients.length) throw new AppError(`Client not found: ${clientIdOrUuid}`);
      return clients[0];
    }, 'getClientById');
  }

  async updateClient(clientIdOrUuid, updates) {
    return this.withReauth(async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientIdOrUuid);
      let client;

      if (isUuid) {
        client = await this.client.clients.findOne({ id: clientIdOrUuid });
        if (!client) throw new AppError(`Client not found: ${clientIdOrUuid}`);
      } else {
        const clients = await this.client.clients.find({ clientId: clientIdOrUuid });
        if (!clients.length) throw new AppError(`Client not found: ${clientIdOrUuid}`);
        client = clients[0];
      }

      const updatedClient = {
        ...client,
        ...updates,
      };

      await this.client.clients.update({ id: client.id }, updatedClient);
      logger.info(`Client updated: ${clientIdOrUuid}`);
      return updatedClient;
    }, 'updateClient');
  }

  async userSession(userId) {
    return this.withReauth(async () => {
      const sessions = await this.client.users.listSessions({ id: userId });
      logger.info(`User sessions retrieved for user: ${userId}, count: ${sessions?.length || 0}`);
      return sessions || [];
    }, 'userSession');
  }


  async validateCurrentPassword(username, currentPassword, clientId = 'account-ui') {
    try {
      logger.info(`Validating current password for user: ${username}`);

      const clientSecret = KEYCLOAK_ACCOUNT_UI_CLIENT_SECRET;

      if (!clientSecret) {
        logger.error('KEYCLOAK_ACCOUNT_UI_CLIENT_SECRET is not set!');
        return false;
      }

      const tokenRequestData = new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        username: username,
        password: currentPassword,
        client_secret: clientSecret
      });

      logger.debug('Validating password via token endpoint', {
        url: `${KEYCLOAK_URL}/realms/${this.realm}/protocol/openid-connect/token`,
        client_id: clientId,
        username: username,
        realm: this.realm
      });

      const response = await fetch(
        `${KEYCLOAK_URL}/realms/${this.realm}/protocol/openid-connect/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: tokenRequestData
        }
      );

      if (response.ok) {
        logger.info(`Password validation successful for user: ${username}`);
        return true;
      } else {
        const errorData = await response.json();
        logger.warn(`Password validation failed for user: ${username}`, {
          error: errorData.error,
          error_description: errorData.error_description,
          status: response.status
        });
        return false;
      }

    } catch (error) {
      logger.error(`🔐 Password validation error for user: ${username}`, {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  async getUserEvents(realm, userId, { max = 20, first = 0 } = {}) {
    return this.withReauth(async () => {
      const user = await this.client.users.findOne({ id: userId });
      if (!user) throw new AppError(`User not found: ${userId}`);
      const events = await this.client.realms.findEvents({
        realm: realm,
        max: 50,
        first: 0,
        user: userId   // optional filter to only get events for this user
      });
      // const events = await this.client.users.listEvents({ id: userId, max, first });
      logger.info(`Retrieved ${events.length} events for user: ${userId}`);
      return events;
    }, 'getUserEvents');
  }


  async deleteUserSession(userId, sessionId) {
    return this.withReauth(async () => {
      // Handle composite session ID format: "sessionId-clientUUID"
      // The GET /sessions endpoint returns IDs in this format for uniqueness
      // We need to extract just the sessionId (first UUID) for Keycloak
      let actualSessionId = sessionId;

      // Check if this is a composite ID (contains two UUIDs separated by a hyphen)
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars)
      if (sessionId && sessionId.length > 36) {
        // Split at position 36 (full UUID + hyphen separator)
        actualSessionId = sessionId.substring(0, 36);
        logger.debug(`Extracted session ID from composite: ${sessionId} -> ${actualSessionId}`);
      }

      // First check if user has sessions
      let sessions = [];
      try {
        sessions = await this.client.users.listSessions({ id: userId });
      } catch (listError) {
        // If error fetching sessions, user may have no sessions
        logger.warn(`Could not list sessions for user ${userId}: ${listError.message}`);
      }

      logger.debug('Current sessions for user', { userId, count: sessions.length });

      // If no sessions exist, return success (nothing to delete)
      if (!sessions || sessions.length === 0) {
        logger.info(`No sessions found for user ${userId} - nothing to delete`);
        return { deleted: false, reason: 'no_sessions' };
      }

      // Find the specific session
      const session = sessions.find((s) => s.id === actualSessionId);
      if (!session) {
        logger.warn(`Session ${actualSessionId} not found for user ${userId}`);
        return { deleted: false, reason: 'session_not_found' };
      }

      // Use realms.deleteSession to delete specific session (correct API)
      try {
        await this.client.realms.deleteSession({
          realm: this.realm,
          session: actualSessionId
        });
        logger.info(`Deleted session ${actualSessionId} for user ${userId}`);
        return { deleted: true, sessionId: actualSessionId };
      } catch (deleteError) {
        // Fallback: logout all sessions for the user
        logger.warn(`Failed to delete specific session, falling back to logout all: ${deleteError.message}`);
        await this.client.users.logout({ id: userId });
        logger.info(`All sessions for user ${userId} have been terminated (including session: ${actualSessionId})`);
        return { deleted: true, sessionId: actualSessionId, fallback: 'logout_all' };
      }
    }, 'deleteUserSession');
  }

  async logoutUser(userId) {
    return this.withReauth(async () => {
      // First check if user has sessions
      let sessions = [];
      try {
        sessions = await this.client.users.listSessions({ id: userId });
      } catch (listError) {
        // If error fetching sessions, user may have no sessions
        logger.warn(`Could not list sessions for user ${userId}: ${listError.message}`);
      }

      // If no sessions exist, return success (nothing to logout)
      if (!sessions || sessions.length === 0) {
        logger.info(`No active sessions for user ${userId} - already logged out`);
        return { loggedOut: true, sessionCount: 0 };
      }

      // Use the simple logout API which terminates all sessions
      await this.client.users.logout({ id: userId });

      logger.info(`Logged out user ${userId} from ${sessions.length} sessions`);
      return { loggedOut: true, sessionCount: sessions.length };
    }, 'logoutUser');
  }

  /* ========================================================================
     IDENTITY PROVIDERS (IdP)
     ======================================================================== */

  async getIdentityProviders() {
    return this.withReauth(async () => {
      const idps = await this.client.identityProviders.find({ realm: this.realm });
      logger.info(`Fetched ${idps.length} identity providers for realm ${this.realm}`);
      return idps;
    }, 'getIdentityProviders');
  }

  async getIdentityProvider(alias) {
    return this.withReauth(async () => {
      const idp = await this.client.identityProviders.findOne({ realm: this.realm, alias });
      if (!idp) throw new AppError(`Identity provider not found: ${alias}`);
      return idp;
    }, 'getIdentityProvider');
  }

  async createIdentityProvider(idpConfig) {
    return this.withReauth(async () => {
      await this.client.identityProviders.create({
        realm: this.realm,
        ...idpConfig
      });
      logger.info(`Created identity provider ${idpConfig.alias} in realm ${this.realm}`);
      return await this.getIdentityProvider(idpConfig.alias);
    }, 'createIdentityProvider');
  }

  async updateIdentityProvider(alias, idpConfig) {
    return this.withReauth(async () => {
      await this.client.identityProviders.update(
        { realm: this.realm, alias },
        idpConfig
      );
      logger.info(`Updated identity provider ${alias} in realm ${this.realm}`);
      return await this.getIdentityProvider(alias);
    }, 'updateIdentityProvider');
  }

  async deleteIdentityProvider(alias) {
    return this.withReauth(async () => {
      await this.client.identityProviders.del({ realm: this.realm, alias });
      logger.info(`Deleted identity provider ${alias} from realm ${this.realm}`);
    }, 'deleteIdentityProvider');
  }

  /* ========================================================================
     CLIENT PROTOCOL MAPPERS
     ======================================================================== */

  async getProtocolMappers(clientId) {
    return this.withReauth(async () => {
      const client = await this.getClientById(clientId);
      const mappers = await this.client.clients.listProtocolMappers({ id: client.id });
      return mappers;
    }, 'getProtocolMappers');
  }

  async addProtocolMapper(clientId, mapperConfig) {
    return this.withReauth(async () => {
      const client = await this.getClientById(clientId);
      const mapper = await this.client.clients.addProtocolMapper({
        id: client.id,
        ...mapperConfig
      });
      logger.info(`Added protocol mapper to client ${clientId}`);
      return mapper;
    }, 'addProtocolMapper');
  }

  async updateProtocolMapper(clientId, mapperId, mapperConfig) {
    return this.withReauth(async () => {
      const client = await this.getClientById(clientId);
      await this.client.clients.updateProtocolMapper(
        { id: client.id, mapperId },
        mapperConfig
      );
      logger.info(`Updated protocol mapper ${mapperId} for client ${clientId}`);
      // Fetch updated mapper to return
      const mappers = await this.client.clients.listProtocolMappers({ id: client.id });
      return mappers.find(m => m.id === mapperId);
    }, 'updateProtocolMapper');
  }

  async deleteProtocolMapper(clientId, mapperId) {
    return this.withReauth(async () => {
      const client = await this.getClientById(clientId);
      await this.client.clients.delProtocolMapper({ id: client.id, mapperId });
      logger.info(`Deleted protocol mapper ${mapperId} from client ${clientId}`);
    }, 'deleteProtocolMapper');
  }

  /* ========================================================================
     REALM CLONING
     ======================================================================== */

  async cloneRealm(sourceRealmName, newRealmName, newDisplayName) {
    return this.withReauth(async () => {
      // 1. Get source realm config
      const sourceRealm = await this.client.realms.findOne({ realm: sourceRealmName });
      if (!sourceRealm) throw new AppError(`Source realm not found: ${sourceRealmName}`);

      // 2. Prepare new realm config
      // Remove fields that shouldn't be cloned or need reset
      const {
        id,
        realm,
        displayName,
        publicKey,
        privateKey,
        certificate,
        ...cloneConfig
      } = sourceRealm;

      const newRealmConfig = {
        ...cloneConfig,
        realm: newRealmName,
        displayName: newDisplayName || newRealmName,
        enabled: true,
        id: newRealmName
      };

      // 3. Create new realm
      await this.client.realms.create(newRealmConfig);
      logger.info(`Cloned realm ${sourceRealmName} to ${newRealmName}`);

      return newRealmConfig;
    }, 'cloneRealm');
  }

  /* ========================================================================
     ANALYTICS & STATS
     ======================================================================== */

  async getSessionStats() {
    return this.withReauth(async () => {
      // Note: Keycloak Admin API doesn't have a direct "get all sessions count" for realm
      // We have to iterate clients or use a specific endpoint if available.
      // For now, we'll try to get client session stats for all clients and aggregate.

      const clients = await this.getClients();
      let activeSessions = 0;
      let offlineSessions = 0;

      // This can be slow for many clients. 
      // Optimization: Keycloak has a 'client-session-stats' endpoint but it's per realm
      const stats = await this.client.realms.getClientSessionStats({ realm: this.realm });

      stats.forEach(stat => {
        activeSessions += parseInt(stat.active || 0);
        offlineSessions += parseInt(stat.offline || 0);
      });

      return {
        activeSessions,
        offlineSessions,
        lastUpdated: new Date().toISOString()
      };
    }, 'getSessionStats');
  }

  async getLoginStats(from, to) {
    return this.withReauth(async () => {
      // Fetch LOGIN and LOGIN_ERROR events
      const events = await this.client.realms.findEvents({
        realm: this.realm,
        type: ['LOGIN', 'LOGIN_ERROR'],
        dateFrom: from,
        dateTo: to,
        max: 1000 // Limit to avoid overload
      });

      // Group by date
      const statsByDate = {};

      events.forEach(event => {
        const date = new Date(event.time).toISOString().split('T')[0];
        if (!statsByDate[date]) {
          statsByDate[date] = { date, success: 0, failed: 0 };
        }

        if (event.type === 'LOGIN') {
          statsByDate[date].success++;
        } else {
          statsByDate[date].failed++;
        }
      });

      // Convert to array and sort by date
      const chartData = Object.values(statsByDate).sort((a, b) => a.date.localeCompare(b.date));

      return chartData;
    }, 'getLoginStats');
  }



  /**
  * Mark user's email as verified in Keycloak
  * Use this for social login users (Google, Microsoft, etc.)
  */
  async verifyUserEmail(keycloakUserId) {
    return this.withReauth(async () => {
      // Get current user data
      const currentUser = await this.client.users.findOne({ id: keycloakUserId });

      if (!currentUser) {
        throw new AppError(`User not found: ${keycloakUserId} `);
      }

      // Check if already verified
      if (currentUser.emailVerified) {
        logger.info(`Email already verified for user: ${keycloakUserId} `);
        return { success: true, alreadyVerified: true };
      }

      // Update user to mark email as verified
      await this.client.users.update(
        { id: keycloakUserId },
        {
          username: currentUser.username,
          email: currentUser.email,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          enabled: currentUser.enabled,
          emailVerified: true,  // ← The key change
          attributes: currentUser.attributes || {}
        }
      );

      logger.info(`Email verified for user: ${keycloakUserId} `);

      return { success: true, alreadyVerified: false };
    }, 'verifyUserEmail');
  }

  async sendVerificationEmail(userId) {
    return this.withReauth(async () => {
      await this.client.users.executeActionsEmail({
        id: userId,
        actions: ['VERIFY_EMAIL']
      });
      logger.info(`Verification email sent to user: ${userId}`);
    }, 'sendVerificationEmail');
  }

  async sendPasswordResetEmail(userId) {
    return this.withReauth(async () => {
      await this.client.users.executeActionsEmail({
        id: userId,
        actions: ['UPDATE_PASSWORD']
      });
      logger.info(`Password reset email sent to user: ${userId}`);
    }, 'sendPasswordResetEmail');
  }


  async forceLogoutAllUserSessions(userId) {
    return this.withReauth(async () => {
      // Get all user sessions
      const sessions = await this.client.users.listSessions({ id: userId });

      logger.info(`Found ${sessions.length} sessions for user ${userId}`);

      // Delete each session individually
      for (const session of sessions) {
        try {
          await this.client.realms.deleteSession({
            realm: this.realm,
            session: session.id
          });
          logger.info(`Deleted session ${session.id} for user ${userId}`);
        } catch (sessionError) {
          logger.warn(`Failed to delete session ${session.id}: `, sessionError.message);
        }
      }

      logger.info(`All sessions deleted for user ${userId}`);
      return sessions.length;
    }, 'forceLogoutAllUserSessions');
  }


  async logoutUserSession(userId) {
    return this.withReauth(async () => {
      await this.client.users.logout({ id: userId });
    }, 'logoutUserSession');
  }

  async clearUserCache(userId) {
    return this.withReauth(async () => {
      const user = await this.client.users.findOne({ id: userId });
      if (!user) throw new AppError(`User not found: ${userId} `);

      await this.client.users.clearCache({ id: userId });
      logger.info(`User cache cleared: ${userId} `);
    }, 'clearUserCache');
  }

  async createTenantIdMapper(clientId) {
    return this.withReauth(async () => {
      const client = await this.client.clients.find({ clientId });
      if (!client[0]) throw new AppError(`Client not found: ${clientId} `);
      const clientScopeId = `${clientId} -dedicated`;
      await this.client.clientScopes.create({
        name: clientScopeId,
        protocol: "openid-connect",
      });
      await this.client.clients.addClientScopeMappings({
        id: client[0].id,
        clientScopeId,
      });
      await this.client.clientScopes.createProtocolMapper({
        id: clientScopeId,
        name: "tenant_id",
        protocol: "openid-connect",
        protocolMapper: "oidc-usermodel-attribute-mapper",
        config: {
          "user.attribute": "tenant_id",
          "claim.name": "tenant_id",
          "id.token.claim": "true",
          "access.token.claim": "true",
          "userinfo.token.claim": "true",
        },
      });
      logger.info(`Created tenant_id mapper for client: ${clientId} `);
    }, 'createTenantIdMapper');
  }

  async addAssociatedRolesToCompositeRole(compositeRoleName, roleNames) {
    return this.withReauth(async () => {
      // Step 1: Get the composite (parent) role
      const compositeRole = await this.client.roles.findOneByName({
        realm: this.realm,
        name: compositeRoleName,
      });

      if (!compositeRole)
        throw new AppError(`Composite role not found: ${compositeRoleName} `);

      // Step 2: Fetch the roles you want to associate
      const allRoles = await this.client.roles.find({ realm: this.realm });

      const rolesToAssociate = allRoles.filter((role) =>
        roleNames.includes(role.name)
      );

      if (rolesToAssociate.length === 0)
        throw new AppError(`No matching roles found to associate`);

      // Step 3: Add them as composites
      await this.client.roles.addComposites({
        realm: this.realm,
        roleName: compositeRole.name,
        roles: rolesToAssociate.map((role) => ({
          id: role.id,
          name: role.name,
        })),
      });

      logger.info(
        `Associated roles[${roleNames.join(
          ", "
        )
        }] to composite role ${compositeRoleName} `
      );
    }, 'addAssociatedRolesToCompositeRole');
  }

  async deleteRealm(realmName) {
    return this.withReauth(async () => {
      await this.client.realms.del({ realm: realmName });
      logger.info(`Realm deleted: ${realmName} `);
    }, 'deleteRealm');
  }

  async getAssociatedRoles(compositeRoleName) {
    return this.withReauth(async () => {
      const roles = await this.client.roles.getCompositeRealmRoles({
        realm: this.realm,
        roleName: compositeRoleName,
      });

      logger.info(
        `Fetched ${roles.length} associated roles for ${compositeRoleName}`
      );
      return roles;
    }, 'getAssociatedRoles');
  }

  async removeAssociatedRoles(compositeRoleName, roleNamesToRemove) {
    return this.withReauth(async () => {
      const compositeRole = await this.client.roles.findOneByName({
        realm: this.realm,
        name: compositeRoleName,
      });

      if (!compositeRole)
        throw new AppError(`Composite role not found: ${compositeRoleName} `);

      const allRoles = await this.client.roles.find({ realm: this.realm });

      const rolesToRemove = allRoles.filter((role) =>
        roleNamesToRemove.includes(role.name)
      );

      if (rolesToRemove.length === 0)
        throw new AppError(`No matching roles found to remove`);

      await this.client.roles.delComposites({
        realm: this.realm,
        roleName: compositeRole.name,
        roles: rolesToRemove.map((role) => ({
          id: role.id,
          name: role.name,
        })),
      });

      logger.info(
        `Removed roles[${roleNamesToRemove.join(
          ", "
        )
        }] from composite role ${compositeRoleName} `
      );
    }, 'removeAssociatedRoles');
  }

  async getUsersInRealmRole(roleName, realmName) {
    return this.withReauth(async () => {
      const users = await this.client.roles.findUsersWithRole({
        realm: this.realm,
        roleName: roleName,
      });

      return users; // array of user objects
    }, 'getUsersInRealmRole');
  }

  // Simple update by clientId only (use updateClient for UUID support)
  async updateClientSimple(clientId, updates) {
    return this.withReauth(async () => {
      const clients = await this.client.clients.find({ clientId });
      if (!clients.length) throw new AppError(`Client not found: ${clientId} `);

      const client = clients[0];
      const updatedClient = {
        ...client,
        ...updates,
      };

      await this.client.clients.update({ id: client.id }, updatedClient);
      logger.info(`Client updated: ${clientId} `);
      return updatedClient;
    }, 'updateClientSimple');
  }

  async deleteClient(clientIdOrUuid) {
    return this.withReauth(async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientIdOrUuid);
      let clientUniqueId = clientIdOrUuid;

      if (!isUuid) {
        const clients = await this.client.clients.find({ clientId: clientIdOrUuid });
        if (!clients.length) throw new AppError(`Client not found: ${clientIdOrUuid}`);
        clientUniqueId = clients[0].id;
      }

      await this.client.clients.del({ id: clientUniqueId });
      logger.info(`Client deleted: ${clientIdOrUuid}`);
    }, 'deleteClient');
  }

  async getClientSecret(clientIdOrUuid) {
    return this.withReauth(async () => {
      // Check if it looks like a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientIdOrUuid);
      let clientUniqueId = clientIdOrUuid;

      if (!isUuid) {
        // Find client by clientId string
        const clients = await this.client.clients.find({ clientId: clientIdOrUuid });
        if (!clients.length) throw new AppError(`Client not found: ${clientIdOrUuid}`);
        clientUniqueId = clients[0].id;
      }

      const secret = await this.client.clients.getClientSecret({
        id: clientUniqueId,
      });

      logger.info(`Client secret retrieved for: ${clientIdOrUuid}`);
      return secret;
    }, 'getClientSecret');
  }

  async regenerateClientSecret(clientIdOrUuid) {
    return this.withReauth(async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientIdOrUuid);
      let clientUniqueId = clientIdOrUuid;

      if (!isUuid) {
        const clients = await this.client.clients.find({ clientId: clientIdOrUuid });
        if (!clients.length) throw new AppError(`Client not found: ${clientIdOrUuid}`);
        clientUniqueId = clients[0].id;
      }

      const newSecret = await this.client.clients.generateNewClientSecret({
        id: clientUniqueId,
      });

      logger.info(`Client secret regenerated for: ${clientIdOrUuid}`);
      return newSecret;
    }, 'regenerateClientSecret');
  }

  // Add to your KeycloakService class
  async getUserCredentials(userId) {
    return this.withReauth(async () => {
      const credentials = await this.client.users.getCredentials({ id: userId });
      return credentials;
    }, 'getUserCredentials');
  }
  async finalizeTOTPSetup(userId) {
    return this.withReauth(async () => {
      const currentUser = await this.client.users.findOne({ id: userId });
      const credentials = await this.client.users.getCredentials({ id: userId });
      const hasTOTP = credentials.some(cred => cred.type === 'otp');

      if (hasTOTP && currentUser.requiredActions?.includes('CONFIGURE_TOTP')) {
        // Remove CONFIGURE_TOTP from required actions
        const updatedActions = currentUser.requiredActions.filter(action => action !== 'CONFIGURE_TOTP');

        await this.client.users.update({ id: userId }, {
          requiredActions: updatedActions
        });

        logger.info(`✅ Removed CONFIGURE_TOTP after setup for user: ${userId} `);
      }
    }, 'finalizeTOTPSetup');
  }



  // Delete specific user credential
  async deleteUserCredential(userId, credentialId) {
    return this.withReauth(async () => {
      await this.client.users.deleteCredential({
        id: userId,
        credentialId: credentialId,
        realm: this.realm,
      });
    }, 'deleteUserCredential');
  }

  async getRealmRoles() {
    return this.withReauth(async () => {
      const roles = await this.client.roles.find({ realm: this.realm });
      logger.info(`Fetched ${roles.length} realm roles from ${this.realm} `);
      return roles;
    }, 'getRealmRoles');
  }

  // Get role by ID
  // Get role by ID
  async getRoleById(roleId) {
    return this.withReauth(async () => {
      const role = await this.client.roles.findOneById({
        realm: this.realm,
        id: roleId,
      });
      if (!role) throw new AppError(`Role not found: ${roleId} `);
      logger.info(`Retrieved role: ${roleId} `);
      return role;
    }, 'getRoleById');
  }

  // Get role by name
  // Get role by name
  async getRoleByName(roleName) {
    return this.withReauth(async () => {
      const role = await this.client.roles.findOneByName({
        realm: this.realm,
        name: roleName,
      });
      if (!role) throw new AppError(`Role not found: ${roleName} `);
      logger.info(`Retrieved role: ${roleName} `);
      return role;
    }, 'getRoleByName');
  }

  // Create realm role
  // Create realm role
  async createRealmRole(name, description = "") {
    return this.withReauth(async () => {
      const role = await this.client.roles.create({
        realm: this.realm,
        name: name,
        description: description,
      });
      logger.info(`Realm role created: ${name} in ${this.realm} `);
      return role;
    }, 'createRealmRole');
  }

  // Update realm role
  // Update realm role
  async updateRealmRole(roleId, updates) {
    return this.withReauth(async () => {
      await this.client.roles.updateById(
        {
          realm: this.realm,
          id: roleId,
        },
        updates
      );
      logger.info(`Realm role updated: ${roleId} `);
      return { id: roleId, ...updates };
    }, 'updateRealmRole');
  }

  // Delete realm role
  // Delete realm role
  async deleteRealmRole(roleId) {
    return this.withReauth(async () => {
      await this.client.roles.delById({
        realm: this.realm,
        id: roleId,
      });
      logger.info(`Realm role deleted: ${roleId} `);
    }, 'deleteRealmRole');
  }

  // Assign realm role to user
  // Assign realm role to user
  async assignRealmRoleToUser(userId, roleName) {
    return this.withReauth(async () => {
      const role = await this.getRoleByName(roleName);

      await this.client.users.addRealmRoleMappings({
        id: userId,
        realm: this.realm,
        roles: [
          {
            id: role.id,
            name: role.name,
          },
        ],
      });

      logger.info(`Realm role ${roleName} assigned to user ${userId} `);
    }, 'assignRealmRoleToUser');
  }

  // Remove realm role from user
  // Remove realm role from user
  async removeRealmRoleFromUser(userId, roleName) {
    return this.withReauth(async () => {
      const role = await this.getRoleByName(roleName);

      await this.client.users.delRealmRoleMappings({
        id: userId,
        realm: this.realm,
        roles: [
          {
            id: role.id,
            name: role.name,
          },
        ],
      });

      logger.info(`Realm role ${roleName} removed from user ${userId} `);
    }, 'removeRealmRoleFromUser');
  }

  // Get user's realm roles
  // Get user's realm roles
  async getUserRealmRoles(userId) {
    return this.withReauth(async () => {
      const roles = await this.client.users.listRealmRoleMappings({
        id: userId,
        realm: this.realm,
      });
      logger.info(`Retrieved ${roles.length} realm roles for user ${userId}`);
      return roles;
    }, 'getUserRealmRoles');
  }

  // Get available realm roles for user (roles not yet assigned)
  // Get available realm roles for user (roles not yet assigned)
  async getAvailableRealmRolesForUser(userId) {
    return this.withReauth(async () => {
      const availableRoles =
        await this.client.users.listAvailableRealmRoleMappings({
          id: userId,
          realm: this.realm,
        });
      logger.info(
        `Retrieved ${availableRoles.length} available realm roles for user ${userId}`
      );
      return availableRoles;
    }, 'getAvailableRealmRolesForUser');
  }

  // Create composite role with associated roles
  // Create composite role with associated roles
  async createCompositeRole(roleName, description, associatedRoleNames = []) {
    return this.withReauth(async () => {
      // First create the role
      const role = await this.createRealmRole(roleName, description);

      // If associated roles are provided, add them as composites
      if (associatedRoleNames.length > 0) {
        await this.addAssociatedRolesToCompositeRole(
          roleName,
          associatedRoleNames
        );
      }

      logger.info(
        `Composite role created: ${roleName} with ${associatedRoleNames.length} associated roles`
      );
      return role;
    }, 'createCompositeRole');
  }

  // Get roles with statistics
  async getRolesWithStats() {
    try {
      const roles = await this.getRealmRoles();

      const rolesWithStats = await Promise.all(
        roles.map(async (role) => {
          try {
            const usersWithRole = await this.getUsersInRealmRole(role.name);
            const compositeRoles = role.composite
              ? await this.getAssociatedRoles(role.name)
              : [];

            return {
              ...role,
              stats: {
                userCount: usersWithRole.length,
                compositeRoleCount: compositeRoles.length,
                isComposite: role.composite || false,
              },
            };
          } catch (error) {
            logger.warn(
              `Failed to get stats for role ${role.name}: ${error.message} `
            );
            return {
              ...role,
              stats: {
                userCount: 0,
                compositeRoleCount: 0,
                isComposite: false,
              },
            };
          }
        })
      );

      logger.info(`Retrieved ${rolesWithStats.length} roles with statistics`);
      return rolesWithStats;
    } catch (error) {
      logger.error(`Failed to get roles with stats: ${error.message} `);
      throw error;
    }
  }


  async requireUserTOTPSetup(userId) {
    return this.withReauth(async () => {
      const currentUser = await this.client.users.findOne({ id: userId });
      const existingActions = currentUser.requiredActions || [];

      if (!existingActions.includes('CONFIGURE_TOTP')) {
        const updatedActions = [...existingActions, 'CONFIGURE_TOTP'];
        await this.client.users.update({ id: userId }, {
          requiredActions: updatedActions
        });
        logger.info(`✅ CONFIGURE_TOTP required action set for user: ${userId} `);
      }
    }, 'requireUserTOTPSetup');
  }

  // ✅ CORRECT: Send email for TOTP configuration
  async sendTOTPConfigurationEmail(userId) {
    return this.withReauth(async () => {
      await this.client.users.executeActionsEmail({
        id: userId,
        actions: ['CONFIGURE_TOTP'],
        lifespan: 43200, // 12 hours
        redirectUri: process.env.FRONTEND_URL || 'http://localhost:5173'
      });
      logger.info(`✅ TOTP configuration email sent to user: ${userId} `);
    }, 'sendTOTPConfigurationEmail');
  }

  // ✅ CORRECT: Check TOTP status
  async getUserTOTPStatus(userId) {
    return this.withReauth(async () => {
      const credentials = await this.client.users.getCredentials({ id: userId });
      const totpCredentials = credentials.filter(cred => cred.type === 'otp');
      const currentUser = await this.client.users.findOne({ id: userId });
      const hasRequiredAction = currentUser.requiredActions?.includes('CONFIGURE_TOTP') || false;

      return {
        enabled: totpCredentials.length > 0,
        setupRequired: hasRequiredAction,
        credentials: totpCredentials
      };
    }, 'getUserTOTPStatus');
  }

  // ✅ CORRECT: Remove TOTP credentials
  async removeTOTPCredential(userId, credentialId) {
    return this.withReauth(async () => {
      await this.client.users.deleteCredential({
        id: userId,
        credentialId: credentialId
      });
      logger.info(`✅ TOTP credential deleted for user: ${userId} `);
    }, 'removeTOTPCredential');
  }

  /* --------- Role Management Methods --------- */

  async getRealmRole(roleName) {
    return this.withReauth(async () => {
      const role = await this.client.roles.findOneByName({
        realm: this.realm,
        name: roleName
      });
      return role;
    }, 'getRealmRole');
  }

  async getClientRole(clientIdOrUuid, roleName) {
    return this.withReauth(async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientIdOrUuid);
      let clientUniqueId = clientIdOrUuid;

      if (!isUuid) {
        const clients = await this.client.clients.find({ clientId: clientIdOrUuid });
        if (!clients.length) throw new AppError(`Client not found: ${clientIdOrUuid}`);
        clientUniqueId = clients[0].id;
      }

      const role = await this.client.clients.findRole({
        id: clientUniqueId,
        roleName
      });
      return role;
    }, 'getClientRole');
  }

  async updateClientRole(clientIdOrUuid, roleName, updates) {
    return this.withReauth(async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientIdOrUuid);
      let clientUniqueId = clientIdOrUuid;

      if (!isUuid) {
        const clients = await this.client.clients.find({ clientId: clientIdOrUuid });
        if (!clients.length) throw new AppError(`Client not found: ${clientIdOrUuid}`);
        clientUniqueId = clients[0].id;
      }

      await this.client.clients.updateRole({
        id: clientUniqueId,
        roleName
      }, updates);

      return updates;
    }, 'updateClientRole');
  }

  async deleteClientRole(clientIdOrUuid, roleName) {
    return this.withReauth(async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientIdOrUuid);
      let clientUniqueId = clientIdOrUuid;

      if (!isUuid) {
        const clients = await this.client.clients.find({ clientId: clientIdOrUuid });
        if (!clients.length) throw new AppError(`Client not found: ${clientIdOrUuid}`);
        clientUniqueId = clients[0].id;
      }

      await this.client.clients.delRole({
        id: clientUniqueId,
        roleName
      });
    }, 'deleteClientRole');
  }

  // Get all roles (realm + client) for user
  async getAllUserRoles(userId) {
    return this.withReauth(async () => {
      const realmRoles = await this.client.users.listRealmRoleMappings({ id: userId, realm: this.realm });

      // We need to fetch client roles for all clients, or maybe just list all role mappings
      // listRoleMappings returns both realm and client roles
      const allRoles = await this.client.users.listRoleMappings({ id: userId, realm: this.realm });

      return {
        realmRoles: allRoles.realmMappings || [],
        clientRoles: allRoles.clientMappings || {}
      };
    }, 'getAllUserRoles');
  }

  async assignRealmRolesToUser(userId, roleNames) {
    return this.withReauth(async () => {
      const rolesToAssign = [];
      for (const roleName of roleNames) {
        try {
          const role = await this.client.roles.findOneByName({
            realm: this.realm,
            name: roleName
          });
          if (role) rolesToAssign.push({ id: role.id, name: role.name });
        } catch (e) {
          logger.warn(`Realm role not found: ${roleName}`);
        }
      }

      if (rolesToAssign.length === 0) throw new AppError('No valid roles found to assign', 400, 'ROLES_NOT_FOUND');

      await this.client.users.addRealmRoleMappings({
        id: userId,
        roles: rolesToAssign
      });
    }, 'assignRealmRolesToUser');
  }

  async removeRealmRolesFromUser(userId, roleNames) {
    return this.withReauth(async () => {
      const rolesToRemove = [];
      for (const roleName of roleNames) {
        try {
          const role = await this.client.roles.findOneByName({
            realm: this.realm,
            name: roleName
          });
          if (role) rolesToRemove.push({ id: role.id, name: role.name });
        } catch (e) {
          logger.warn(`Realm role not found: ${roleName}`);
        }
      }

      if (rolesToRemove.length === 0) throw new AppError('No valid roles found to remove', 400, 'ROLES_NOT_FOUND');

      await this.client.users.delRealmRoleMappings({
        id: userId,
        roles: rolesToRemove
      });
    }, 'removeRealmRolesFromUser');
  }

  async getUserClientRoles(userId, clientUniqueId) {
    return this.withReauth(async () => {
      const roles = await this.client.users.listClientRoleMappings({
        id: userId,
        clientUniqueId: clientUniqueId
      });
      return roles;
    }, 'getUserClientRoles');
  }

  async assignClientRolesToUser(userId, clientId, roleNames) {
    return this.withReauth(async () => {
      const clients = await this.client.clients.find({ clientId });
      if (!clients.length) throw new AppError(`Client not found: ${clientId}`);
      const client = clients[0];

      const rolesToAssign = [];
      for (const roleName of roleNames) {
        try {
          const role = await this.client.clients.findRole({
            id: client.id,
            roleName
          });
          if (role) rolesToAssign.push({ id: role.id, name: role.name });
        } catch (e) {
          logger.warn(`Role not found: ${roleName}`);
        }
      }

      if (rolesToAssign.length === 0) throw new AppError(`No valid roles found to assign`);

      await this.client.users.addClientRoleMappings({
        id: userId,
        clientUniqueId: client.id,
        roles: rolesToAssign
      });
    }, 'assignClientRolesToUser');
  }

  async removeClientRolesFromUser(userId, clientId, roleNames) {
    return this.withReauth(async () => {
      const clients = await this.client.clients.find({ clientId });
      if (!clients.length) throw new AppError(`Client not found: ${clientId}`);
      const client = clients[0];

      const rolesToRemove = [];
      for (const roleName of roleNames) {
        try {
          const role = await this.client.clients.findRole({
            id: client.id,
            roleName
          });
          if (role) rolesToRemove.push({ id: role.id, name: role.name });
        } catch (e) {
          logger.warn(`Role not found: ${roleName}`);
        }
      }

      if (rolesToRemove.length === 0) throw new AppError(`No valid roles found to remove`);

      await this.client.users.delClientRoleMappings({
        id: userId,
        clientUniqueId: client.id,
        roles: rolesToRemove
      });
    }, 'removeClientRolesFromUser');
  }
}

module.exports = KeycloakService;
