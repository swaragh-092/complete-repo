#!/usr/bin/env node
'use strict';

/**
 * Keycloak Service Client Registration CLI
 *
 * Reusable tool to create confidential clients in Keycloak with
 * Service Accounts Enabled (Client Credentials grant).
 *
 * Usage:
 *   node setup-service-client.js --name=pms-service --realm=my-projects
 *   node setup-service-client.js --name=notification-service --realm=my-projects
 *
 * Env vars required:
 *   - KEYCLOAK_ADMIN_URL   (default: http://localhost:8080)
 *   - KEYCLOAK_ADMIN_USER  (default: admin)
 *   - KEYCLOAK_ADMIN_PASS  (required)
 *
 * Output:
 *   Prints the generated client_secret and required env vars.
 */

const KcAdminClient = require('@keycloak/keycloak-admin-client').default;

// ── Parse CLI Args ──────────────────────────────────────────────────────────

function parseArgs() {
    const args = {};
    process.argv.slice(2).forEach(arg => {
        const match = arg.match(/^--(\w+)=(.+)$/);
        if (match) {
            args[match[1]] = match[2];
        }
    });

    if (!args.name) {
        console.error('❌ Usage: node setup-service-client.js --name=<service-name> --realm=<realm>');
        console.error('   Example: node setup-service-client.js --name=pms-service --realm=my-projects');
        process.exit(1);
    }

    return {
        clientName: args.name,
        realm: args.realm || 'my-projects',
    };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
    const { clientName, realm } = parseArgs();

    const adminUrl = process.env.KEYCLOAK_ADMIN_URL || 'http://localhost:8080';
    const adminUser = process.env.KEYCLOAK_ADMIN_USER || 'admin';
    const adminPass = process.env.KEYCLOAK_ADMIN_PASS;

    if (!adminPass) {
        console.error('❌ KEYCLOAK_ADMIN_PASS env var is required');
        process.exit(1);
    }

    console.log(`\n🔑 Setting up Keycloak service client...`);
    console.log(`   Client:  ${clientName}`);
    console.log(`   Realm:   ${realm}`);
    console.log(`   Admin:   ${adminUrl}\n`);

    // ── Connect to Keycloak Admin ───────────────────────────────────────
    const kcAdmin = new KcAdminClient({
        baseUrl: adminUrl,
        realmName: 'master', // Admin lives in master realm
    });

    try {
        await kcAdmin.auth({
            username: adminUser,
            password: adminPass,
            grantType: 'password',
            clientId: 'admin-cli',
        });
    } catch (err) {
        console.error('❌ Failed to authenticate with Keycloak admin:', err.message);
        process.exit(1);
    }

    console.log('✅ Authenticated with Keycloak admin');

    // ── Check if client already exists ──────────────────────────────────
    kcAdmin.setConfig({ realmName: realm });

    const existing = await kcAdmin.clients.find({ clientId: clientName });
    if (existing.length > 0) {
        console.log(`⚠️  Client "${clientName}" already exists in realm "${realm}"`);

        // Retrieve existing secret
        const secret = await kcAdmin.clients.getClientSecret({ id: existing[0].id });
        printEnvVars(clientName, secret.value, adminUrl, realm);
        return;
    }

    // ── Create new confidential client ──────────────────────────────────
    const newClient = await kcAdmin.clients.create({
        clientId: clientName,
        name: clientName,
        enabled: true,
        protocol: 'openid-connect',

        // Confidential client (has a secret)
        publicClient: false,
        clientAuthenticatorType: 'client-secret',

        // Enable Service Accounts (Client Credentials grant)
        serviceAccountsEnabled: true,

        // Standard flow disabled (no browser login needed for services)
        standardFlowEnabled: false,
        implicitFlowEnabled: false,
        directAccessGrantsEnabled: false,
    });

    console.log(`✅ Client "${clientName}" created`);

    // ── Retrieve generated secret ───────────────────────────────────────
    const secret = await kcAdmin.clients.getClientSecret({ id: newClient.id });

    printEnvVars(clientName, secret.value, adminUrl, realm);
}

function printEnvVars(clientName, clientSecret, keycloakUrl, realm) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  📋 Add these to your service\'s .env file:');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`SERVICE_CLIENT_ID=${clientName}`);
    console.log(`SERVICE_CLIENT_SECRET=${clientSecret}`);
    console.log(`KEYCLOAK_URL=${keycloakUrl}`);
    console.log(`KEYCLOAK_REALM=${realm}`);
    console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
});
