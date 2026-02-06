#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ============================================================================
// NEW: Import modular commands and config
// ============================================================================
import { SSO_CONFIG, THEMES, FEATURES, SESSION_CONFIG, getSelectedTheme } from '../lib/config/index.js';
import { authApi } from '../lib/services/api.js'; // Import authApi for proper API handling
import { statusCommand } from '../lib/commands/status.js';
import { linkUiCommand } from '../lib/commands/linkUi.js';
import { setupCommand } from '../lib/commands/setup.js';
import { initCommand } from '../lib/commands/init.js';

// Get current directory (ES modules compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure axios to accept self-signed certificates (for mkcert)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
axios.defaults.httpsAgent = httpsAgent;


// ============================================================================
// CENTRALIZED URL CONFIGURATION - Change these to switch between HTTP/HTTPS
// ============================================================================
// Local SSO_CONFIG definition removed - using imported SSO_CONFIG

const program = new Command();

program
  .name('sso-client')
  .description('🔐 SSO Client Integration Tool')
  .version('1.0.0');

// Helper function to replace template variables
// Helper function to replace template variables AND handle conditional blocks
function replaceTemplate(content, variables) {
  let result = content;

  // STEP 1: Handle conditional blocks {{#if VARIABLE}}...{{else}}...{{/if}}
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;

  result = result.replace(conditionalRegex, (match, varName, trueBlock, falseBlock) => {
    const value = variables[varName];
    const isTruthy = value === true || value === 'true' || (value && value !== 'false' && value !== 'none');

    if (isTruthy) {
      return trueBlock || '';
    } else {
      return falseBlock || '';
    }
  });

  // STEP 2: Replace simple template variables {{VARIABLE}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}


// ============================================================================
// Helper function to generate file from template
// ============================================================================
async function generateFile(templatePath, outputPath, variables) {
  try {
    const fullTemplatePath = path.join(__dirname, '..', 'templates', templatePath);

    if (!fs.existsSync(fullTemplatePath)) {
      console.log(chalk.yellow(`  ⚠️  Template not found: ${templatePath}`));
      return;
    }

    let content = fs.readFileSync(fullTemplatePath, 'utf-8');

    // Handle conditional blocks (Handlebars-style)
    // Support: {{#if CONDITION}}...{{/if}}
    // content = content.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, block) => {
    //   return variables[condition] ? block : '';
    // });

    content = content.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (match, condition, trueBlock, falseBlock) => {
      const value = variables[condition];
      const isTruthy = value === true || value === 'true' || (value && value !== 'false' && value !== 'none');

      if (isTruthy) {
        return trueBlock || '';
      } else {
        return falseBlock || '';
      }
    });

    // Replace simple variables
    // Support: {{VARIABLE_NAME}}
    content = content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, content);
    console.log(chalk.green(`  ✓ Generated: ${outputPath}`));

  } catch (error) {
    console.error(chalk.red(`  ✗ Failed to generate ${outputPath}:`), error.message);
  }
}



// Helper function to read template
function readTemplate(templateName) {
  const templatePath = path.join(__dirname, '..', 'templates', templateName);
  return fs.readFileSync(templatePath, 'utf8');
}

// ============================================================================
// Helper functions for Docker-aware URL generation
// These generate portless URLs for Docker deployments without affecting CLI communication
// ============================================================================
function getDockerAwareAuthUrl(useDocker) {
  // If auth-service is behind gateway OR client is dockerized, use portless gateway URL
  if (useDocker || SSO_CONFIG.authBehindGateway) {
    return `${SSO_CONFIG.protocol}://auth.${SSO_CONFIG.domain}`;
  }
  return SSO_CONFIG.authServiceUrl;
}

function getDockerAwareAccountUrl(useDocker) {
  // If auth is behind gateway OR client is dockerized, use portless gateway URL
  if (useDocker || SSO_CONFIG.authBehindGateway) {
    return `${SSO_CONFIG.protocol}://account.${SSO_CONFIG.domain}`;
  }
  return SSO_CONFIG.accountUiUrl;
}

function getDockerAwareRedirectUrl(clientKey, port, useDocker) {
  if (useDocker) {
    return `${SSO_CONFIG.protocol}://${clientKey}.${SSO_CONFIG.domain}/callback`;
  }
  return SSO_CONFIG.getRedirectUrl(clientKey, port);
}

function getDockerAwareClientUrl(clientKey, port, useDocker) {
  if (useDocker) {
    return `${SSO_CONFIG.protocol}://${clientKey}.${SSO_CONFIG.domain}`;
  }
  return SSO_CONFIG.getClientUrl(clientKey, port);
}

// ✅ FIXED: Single createViteFiles function with organization support
async function createViteFiles(answers) {
  // Determine if we should use Docker-style portless URLs for generated files
  const useDockerUrls = answers.generateDocker || SSO_CONFIG.dockerMode;

  // 1. Create .env file with organization configuration and URLs
  const envTemplate = readTemplate('.env.tpl');
  const envContent = replaceTemplate(envTemplate, {
    CLIENT_KEY: answers.clientKey,
    PORT: answers.port,
    APP_NAME: answers.appName,
    // URLs - use Docker-aware helpers for portless URLs when Docker is selected
    AUTH_BASE_URL: getDockerAwareAuthUrl(useDockerUrls),
    ACCOUNT_UI_URL: getDockerAwareAccountUrl(useDockerUrls),
    REDIRECT_URI: getDockerAwareRedirectUrl(answers.clientKey, answers.port, useDockerUrls),
    // Organization settings
    REQUIRES_ORGANIZATION: answers.requiresOrganization ? 'true' : 'false',
    ORGANIZATION_MODEL: answers.organizationModel || 'none',
    ONBOARDING_FLOW: answers.onboardingFlow || 'none'
  });

  fs.writeFileSync('.env', envContent);
  console.log(chalk.green('✅ Created .env file with organization configuration'));

  // 1b. Create sso-client.config.json example file
  const ssoConfigExample = {
    "$schema": "./sso-client.config.schema.json",
    "theme": "default",
    "features": {
      "enableIdleTimeout": true,
      "enableCrossTabSync": true,
      "enableDarkMode": true,
      "enableSessionValidation": true
    },
    "session": {
      "idleTimeoutMs": 1800000,
      "tokenRefreshBuffer": 120,
      "sessionValidationInterval": 300000
    }
  };
  fs.writeFileSync('sso-client.config.json', JSON.stringify(ssoConfigExample, null, 2));
  console.log(chalk.green('✅ Created sso-client.config.json (customize as needed)'));

  // 1c. Copy schema file for IDE autocomplete
  const schemaPath = path.join(__dirname, '..', 'sso-client.config.schema.json');
  if (fs.existsSync(schemaPath)) {
    fs.copyFileSync(schemaPath, 'sso-client.config.schema.json');
    console.log(chalk.green('✅ Created sso-client.config.schema.json (for IDE autocomplete)'));
  }

  // 2. Create auth config
  const configTemplate = readTemplate('config/authConfig.tpl');  // ✅ Changed
  const configContent = replaceTemplate(configTemplate, {
    CLIENT_KEY: answers.clientKey,
    APP_NAME: answers.appName
  });

  fs.mkdirSync('src/config', { recursive: true });
  fs.writeFileSync('src/config/authConfig.js', configContent);
  console.log(chalk.green('✅ Created src/config/authConfig.js'));

  // 3. Create pages and components directories
  fs.mkdirSync('src/pages', { recursive: true });
  fs.mkdirSync('src/components', { recursive: true });

  // 4. Create Login component
  const loginTemplate = readTemplate('pages/Login.tpl');
  fs.writeFileSync('src/pages/Login.jsx', replaceTemplate(loginTemplate, {
    APP_NAME: answers.appName,
    REQUIRES_ORGANIZATION: answers.requiresOrganization
  }));
  console.log(chalk.green('✅ Created src/pages/Login.jsx'));

  // 5. Create Callback component
  const callbackTemplate = readTemplate('pages/Callback.tpl');  // ✅ Changed
  const callbackContent = replaceTemplate(callbackTemplate, {
    REQUIRES_ORGANIZATION: answers.requiresOrganization  // ✅ Added for conditional
  });
  fs.writeFileSync('src/pages/Callback.jsx', callbackContent);
  console.log(chalk.green('✅ Created src/pages/Callback.jsx'));

  // 6. Create Dashboard with organization support
  const dashboardTemplate = readTemplate('pages/Dashboard.tpl');  // ✅ Changed
  const dashboardContent = replaceTemplate(dashboardTemplate, {
    CLIENT_KEY: answers.clientKey,
    APP_NAME: answers.appName,
    REQUIRES_ORGANIZATION: answers.requiresOrganization,
    ORGANIZATION_MODEL: answers.organizationModel || 'none'
  });

  fs.writeFileSync('src/pages/Dashboard.jsx', dashboardContent);
  console.log(chalk.green(`✅ Created Dashboard with ${answers.requiresOrganization ? 'organization' : 'personal'} features`));

  // NOTE: Dashboard.css removed - MUI is used for styling

  // 8. Create organization-specific components if needed
  if (answers.requiresOrganization) {
    // Organization onboarding component
    const onboardingTemplate = readTemplate('pages/OrganizationOnboarding.tpl');  // ✅ Changed
    const onboardingContent = replaceTemplate(onboardingTemplate, {
      APP_NAME: answers.appName,
      ORGANIZATION_MODEL: answers.organizationModel,
      ONBOARDING_FLOW: answers.onboardingFlow
    });

    fs.writeFileSync('src/pages/OrganizationOnboarding.jsx', onboardingContent);

    // NOTE: CSS removed - MUI is used for styling
    console.log(chalk.green('✅ Created OrganizationOnboarding component'));

    // Organization management components
    fs.mkdirSync('src/components/organization', { recursive: true });

    const orgManagerTemplate = readTemplate('components/OrganizationManager.tpl');  // ✅ Changed
    const orgManagerContent = replaceTemplate(orgManagerTemplate, {
      ORGANIZATION_MODEL: answers.organizationModel
    });
    fs.writeFileSync('src/components/organization/OrganizationManager.jsx', orgManagerContent);

    const orgSwitcherTemplate = readTemplate('components/OrganizationSwitcher.tpl');  // ✅ Changed
    fs.writeFileSync('src/components/organization/OrganizationSwitcher.jsx', orgSwitcherTemplate);

    // NOTE: Organization CSS removed - MUI is used for styling
    console.log(chalk.green('✅ Created organization management components'));

    // ✅ Create OrganizationContext
    fs.mkdirSync('src/context', { recursive: true });
    const orgContextTemplate = readTemplate('context/OrganizationContext.tpl');
    fs.writeFileSync('src/context/OrganizationContext.jsx', orgContextTemplate);
    console.log(chalk.green('✅ Created OrganizationContext'));

    // ✅ Create api/organizations helper
    fs.mkdirSync('src/api', { recursive: true });
    const orgApiTemplate = readTemplate('api/organizations.tpl');
    fs.writeFileSync('src/api/organizations.js', orgApiTemplate);
    console.log(chalk.green('✅ Created api/organizations helper'));

    // ✅ Create SelectOrganization page
    const selectOrgTemplate = readTemplate('pages/SelectOrganization.tpl');
    const selectOrgContent = replaceTemplate(selectOrgTemplate, {
      APP_NAME: answers.appName
    });
    fs.writeFileSync('src/pages/SelectOrganization.jsx', selectOrgContent);
    console.log(chalk.green('✅ Created SelectOrganization page'));

    // ✅ Create CreateOrganization page
    const createOrgTemplate = readTemplate('pages/CreateOrganization.tpl');
    const createOrgContent = replaceTemplate(createOrgTemplate, {
      APP_NAME: answers.appName
    });
    fs.writeFileSync('src/pages/CreateOrganization.jsx', createOrgContent);
    console.log(chalk.green('✅ Created CreateOrganization page'));

    // NOTE: OrganizationScreens CSS removed - MUI is used for styling

    // ✅ Create InviteMembers page (for org owners/admins)
    const inviteMembersTemplate = readTemplate('pages/InviteMembers.tpl');
    fs.writeFileSync('src/pages/InviteMembers.jsx', inviteMembersTemplate);
    console.log(chalk.green('✅ Created InviteMembers page'));

    // ✅ Create Workspace API helper
    const workspacesApiTemplate = readTemplate('api/workspaces.tpl');
    fs.writeFileSync('src/api/workspaces.js', workspacesApiTemplate);
    console.log(chalk.green('✅ Created api/workspaces helper'));

    // ✅ Create OrganizationWorkspaces component
    const orgWorkspacesTemplate = readTemplate('components/OrganizationWorkspaces.tpl');
    fs.writeFileSync('src/components/organization/OrganizationWorkspaces.jsx', orgWorkspacesTemplate);
    console.log(chalk.green('✅ Created OrganizationWorkspaces component'));

    // ============================================================================
    // ✅ NEW: Generate RBAC (Role-Based Access Control) files
    // ============================================================================
    console.log(chalk.blue('\n🔐 Generating RBAC (authorization) files...'));

    // Create constants directory
    fs.mkdirSync('src/constants', { recursive: true });

    // Permission constants
    const permissionsTemplate = readTemplate('rbac/permissions.tpl');
    fs.writeFileSync('src/constants/permissions.js', replaceTemplate(permissionsTemplate, {
      clientId: answers.clientKey
    }));
    console.log(chalk.green('✅ Created src/constants/permissions.js'));

    // Permission hooks
    fs.mkdirSync('src/hooks', { recursive: true });
    const usePermissionsTemplate = readTemplate('rbac/usePermissions.tpl');
    fs.writeFileSync('src/hooks/usePermissions.jsx', replaceTemplate(usePermissionsTemplate, {
      clientId: answers.clientKey
    }));
    console.log(chalk.green('✅ Created src/hooks/usePermissions.jsx'));

    // Roles API client
    const rolesApiTemplate = readTemplate('api/roles.tpl');
    fs.writeFileSync('src/api/roles.js', replaceTemplate(rolesApiTemplate, {
      clientId: answers.clientKey
    }));
    console.log(chalk.green('✅ Created src/api/roles.js'));

    // Role Manager component
    const roleManagerTemplate = readTemplate('components/organization/RoleManager.tpl');
    fs.writeFileSync('src/components/organization/RoleManager.jsx', roleManagerTemplate);
    console.log(chalk.green('✅ Created src/components/organization/RoleManager.jsx'));

    // Member Role Assignment component
    const memberRoleTemplate = readTemplate('components/organization/MemberRoleAssignment.tpl');
    fs.writeFileSync('src/components/organization/MemberRoleAssignment.jsx', memberRoleTemplate);
    console.log(chalk.green('✅ Created src/components/organization/MemberRoleAssignment.jsx'));

    // Sample RBAC definitions (for reference)
    const rbacDefsTemplate = readTemplate('rbac/rbac-definitions.json.tpl');
    fs.writeFileSync('rbac-definitions.sample.json', replaceTemplate(rbacDefsTemplate, {
      clientId: answers.clientKey
    }));
    console.log(chalk.green('✅ Created rbac-definitions.sample.json (for reference)'));

    console.log(chalk.cyan('\n📖 Role Management Features:'));
    console.log(chalk.white('   • RoleManager - Create/edit/delete custom roles'));
    console.log(chalk.white('   • MemberRoleAssignment - Assign roles to members'));
    console.log(chalk.white('   • Permission constants for frontend checks'));
    console.log(chalk.white(''));
    console.log(chalk.white('   Add RoleManager to your dashboard/settings:'));
    console.log(chalk.white('   import RoleManager from "./components/organization/RoleManager";'));
  }

  // 9. Create Header and ProtectedLayout components
  const headerTpl = readTemplate('components/Header.tpl');  // ✅ Changed

  fs.writeFileSync('src/components/Header.jsx',
    replaceTemplate(headerTpl, {
      APP_NAME: answers.appName,
      REQUIRES_ORGANIZATION: answers.requiresOrganization
    }));

  const protectedLayoutTpl = readTemplate('components/ProtectedLayout.tpl');  // ✅ Changed
  fs.writeFileSync('src/components/ProtectedLayout.jsx',
    replaceTemplate(protectedLayoutTpl, { REQUIRES_ORGANIZATION: answers.requiresOrganization }));
  console.log(chalk.green('✅ Created Header and ProtectedLayout components'));

  // 9.5 Create Layout.jsx (MUI responsive layout)
  const layoutTpl = readTemplate('components/Layout.tpl');
  fs.writeFileSync('src/components/Layout.jsx',
    replaceTemplate(layoutTpl, {
      APP_NAME: answers.appName,
      REQUIRES_ORGANIZATION: answers.requiresOrganization
    }));
  console.log(chalk.green('✅ Created Layout component (MUI responsive)'));

  // 10. Create App.jsx with conditional routing
  const appTemplate = readTemplate('App.tpl');  // ✅ Stays in root
  const appContent = replaceTemplate(appTemplate, {
    APP_NAME: answers.appName,
    REQUIRES_ORGANIZATION: answers.requiresOrganization
  });
  fs.writeFileSync('src/App.jsx', appContent);
  console.log(chalk.green('✅ Updated App.jsx with conditional routing'));

  // 11. Create main.jsx if needed
  if (!fs.existsSync('src/main.jsx')) {
    const mainTemplate = readTemplate('main.tpl');  // ✅ Stays in root
    fs.writeFileSync('src/main.jsx', mainTemplate);
    console.log(chalk.green('✅ Created src/main.jsx'));
  }

  // 12. Create/Update vite.config.js with selected port
  await createOrUpdateViteConfig(answers.port, answers.clientKey);
  console.log(chalk.green(`✅ Configured vite.config.js for ${answers.clientKey}.${SSO_CONFIG.domain}:${answers.port}`));

  // 13. Generate Docker files if requested (or if in Docker mode)
  if (answers.generateDocker || SSO_CONFIG.dockerMode) {
    console.log(chalk.blue('\n🐳 Generating Docker infrastructure files...'));

    // Docker files should ALWAYS use portless URLs (behind gateway)
    const dockerAuthUrl = getDockerAwareAuthUrl(true);
    const dockerAccountUrl = getDockerAwareAccountUrl(true);
    const dockerCallbackUrl = getDockerAwareRedirectUrl(answers.clientKey, answers.port, true);

    // Generate Dockerfile
    await generateFile('Dockerfile.tpl', 'infrastructure/Dockerfile', {
      APP_NAME: answers.appName,
      CLIENT_KEY: answers.clientKey,
      AUTH_BASE_URL: dockerAuthUrl,
      API_URL: `${dockerAuthUrl}/api/admin`,
      AUTH_URL: `${dockerAuthUrl}/auth`,
      ACCOUNT_UI_URL: dockerAccountUrl,
      CALLBACK_URL: dockerCallbackUrl
    });

    // Generate Nginx config
    await generateFile('nginx.conf.tpl', 'infrastructure/nginx.conf', {});

    // Generate docker-compose snippet
    await generateFile('docker-compose.service.tpl', 'docker-compose.snippet.yml', {
      SERVICE_NAME: answers.clientKey,
      DIRECTORY_NAME: answers.clientKey,
      CLIENT_KEY: answers.clientKey,
      AUTH_BASE_URL: dockerAuthUrl,
      API_URL: `${dockerAuthUrl}/api/admin`,
      AUTH_URL: `${dockerAuthUrl}/auth`,
      ACCOUNT_UI_URL: dockerAccountUrl,
      CALLBACK_URL: dockerCallbackUrl
    });

    // Generate gateway snippet
    await generateFile('gateway-server-block.tpl', 'gateway-nginx.snippet.conf', {
      APP_HUMAN_NAME: answers.appName,
      CLIENT_KEY: answers.clientKey,
      DOMAIN: SSO_CONFIG.domain,
      SAFE_SERVICE_NAME: answers.clientKey.replace(/-/g, '_'),
      SERVICE_NAME: answers.clientKey
    });

    // Generate .dockerignore for the project
    await generateFile('dockerignore.tpl', '.dockerignore', {});

    console.log(chalk.green('✅ Generated Docker infrastructure files'));
    console.log(chalk.yellow('  👉 Copy content from docker-compose.snippet.yml to your root docker-compose.yml'));
    console.log(chalk.yellow('  👉 Copy content from gateway-nginx.snippet.conf to your gateway/nginx.conf'));
  }

  // Generate .gitignore (always good to have)
  if (!fs.existsSync('.gitignore')) {
    await generateFile('gitignore.tpl', '.gitignore', {});
    console.log(chalk.green('✅ Created .gitignore'));
  }
}

// Helper function for vite config with .local.test domain support and HTTPS
async function createOrUpdateViteConfig(port, clientKey) {
  const viteConfigPath = 'vite.config.js';
  const hostname = `${clientKey}.${SSO_CONFIG.domain}`;

  // Always create new HTTPS-enabled config
  const viteConfigTemplate = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
// Custom hostname: Access your app at https://${hostname}:${port}
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
    port: ${port},
    host: '${hostname}',
    strictPort: true
  }
})
`;

  fs.writeFileSync(viteConfigPath, viteConfigTemplate);
}

// Helper function for status emojis
function getStatusEmoji(status) {
  switch (status) {
    case 'pending': return '⏳';
    case 'approved': return '✅';
    case 'rejected': return '❌';
    default: return '❓';
  }
}

// ✅ Init command - now uses modular implementation
// Injects local createViteFiles function for file generation
program
  .command('init')
  .description('� Initialize SSO client (with optional organization support)')
  .action(async () => await initCommand({}, createViteFiles));


// ============================================================================
// MODULAR COMMANDS (imported from lib/commands/)
// ============================================================================

// Status command - now uses modular implementation
program
  .command('status')
  .argument('[clientKey]', 'Client key to check')
  .description('📊 Check registration request status')
  .action(statusCommand);


// Link-UI command - now uses modular implementation
program
  .command('link-ui')
  .description('🔗 Verify client is approved and ready for use')
  .argument('[clientKey]', 'Client key to verify (auto-detected if not provided)')
  .action(linkUiCommand);




program
  .command('generate-ui')
  .description('🎨 Generate UI files for your SSO integration')
  .argument('[clientKey]', 'Client key (auto-detected from .env if not provided)')
  .action(async (clientKeyArg) => {
    try {
      let clientKey = clientKeyArg;

      // Try to auto-detect client key from .env
      if (!clientKey && fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf-8');
        const match = envContent.match(/VITE_CLIENT_KEY=(.+)/);
        clientKey = match?.[1]?.trim();
      }

      if (!clientKey) {
        console.error(chalk.red('❌ Client key required'));
        console.log(chalk.yellow('Usage: sso-client generate-ui [clientKey]'));
        console.log(chalk.white('Or run from a directory with .env file containing VITE_CLIENT_KEY'));
        process.exit(1);
      }

      console.log(chalk.blue(`\n🎨 Generating UI files for client: ${clientKey}...\n`));

      // ============================================================================
      // ✅ FETCH CLIENT CONFIGURATION FROM DATABASE
      // ============================================================================
      console.log(chalk.blue('📡 Fetching client configuration from server...'));

      let clientConfig;
      try {
        // Use authApi to take advantage of SSL fallback logic
        clientConfig = await authApi.getClientConfig(clientKey);

        if (!clientConfig) {
          // If null/undefined returned (e.g. error handled inside getClientConfig but returned nothing)
          // Actually api wrapper throws or returns data. getClientConfig returns response.data
          // If error, it's caught below.
        }

        console.log(chalk.green('✓ Client configuration loaded from database\n'));
      } catch (error) {
        // authApi.getClientConfig handles its own errors but we might want to catch specific CLI logic here
        // If the error was rethrown by handleApiError, it might differ from original axios error.

        if (error.message && error.message.includes('Not found')) {
          console.error(chalk.red(`❌ Client "${clientKey}" not found or not approved`));
          console.log(chalk.yellow('Please ensure:'));
          console.log(chalk.white('  1. Client has been registered (run: sso-client init)'));
          console.log(chalk.white('  2. Admin has approved the request'));
          console.log(chalk.white('  3. Check status: sso-client status'));
          process.exit(1);
        }
        throw error;
      }

      // Extract port from .env or use default
      let port = '5173';
      if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf-8');
        const portMatch = envContent.match(/VITE_PORT=(\d+)/);
        port = portMatch?.[1] || port;
      }

      // ============================================================================
      // Build template variables from database config
      // ============================================================================
      const templateVars = {
        CLIENT_KEY: clientConfig.client_key || clientKey,
        APP_NAME: clientConfig.name || clientKey,
        PORT: port,
        SSO_URL: `${SSO_CONFIG.authServiceUrl}/auth`,
        REDIRECT_URL: clientConfig.redirect_url || SSO_CONFIG.getRedirectUrl(clientKey, port),
        FRAMEWORK: 'React',

        // ✅ URL variables for .env template (must match .env.tpl placeholders)
        AUTH_BASE_URL: `${SSO_CONFIG.authServiceUrl}/auth`,
        ACCOUNT_UI_URL: SSO_CONFIG.accountUiUrl,
        REDIRECT_URI: clientConfig.redirect_url || SSO_CONFIG.getRedirectUrl(clientKey, port),

        // ✅ Organization settings from database
        REQUIRES_ORGANIZATION: clientConfig.requires_organization || false,
        ORGANIZATION_MODEL: clientConfig.organization_model || 'flexible',
        ONBOARDING_FLOW: clientConfig.onboarding_flow || 'flexible',
        ORGANIZATION_FEATURES: JSON.stringify(clientConfig.organization_features || []),

        // ✅ Theme configuration from sso-client.config.json
        ...(() => {
          const theme = getSelectedTheme();
          return {
            THEME_NAME: theme.name,
            THEME_PRIMARY: theme.primary,
            THEME_SECONDARY: theme.secondary,
            THEME_GRADIENT: theme.gradient,
            THEME_GRADIENT_HOVER: theme.gradientHover,
            THEME_BG_LIGHT: theme.background?.light || theme.gradient,
            THEME_BG_DARK: theme.background?.dark || 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          };
        })(),

        // ✅ Feature flags from sso-client.config.json
        ENABLE_IDLE_TIMEOUT: FEATURES.enableIdleTimeout,
        ENABLE_CROSS_TAB_SYNC: FEATURES.enableCrossTabSync,
        ENABLE_DARK_MODE: FEATURES.enableDarkMode,
        ENABLE_SESSION_VALIDATION: FEATURES.enableSessionValidation,

        // ✅ Session config from sso-client.config.json
        IDLE_TIMEOUT_MS: SESSION_CONFIG.idleTimeoutMs,
        TOKEN_REFRESH_BUFFER: SESSION_CONFIG.tokenRefreshBuffer,
        SESSION_VALIDATION_INTERVAL: SESSION_CONFIG.sessionValidationInterval,
      };

      console.log(chalk.cyan('📋 Client Configuration:'));
      console.log(chalk.gray(`   Name: ${templateVars.APP_NAME}`));
      console.log(chalk.gray(`   Client Key: ${templateVars.CLIENT_KEY}`));
      console.log(chalk.gray(`   Port: ${templateVars.PORT}`));
      console.log(chalk.gray(`   Organization Required: ${templateVars.REQUIRES_ORGANIZATION ? '✅ Yes' : '❌ No'}`));

      if (templateVars.REQUIRES_ORGANIZATION) {
        console.log(chalk.gray(`   Organization Model: ${templateVars.ORGANIZATION_MODEL}`));
        console.log(chalk.gray(`   Onboarding Flow: ${templateVars.ONBOARDING_FLOW}`));
      }
      console.log();

      // ============================================================================
      // Generate files based on configuration
      // ============================================================================

      console.log(chalk.blue('📄 Generating core pages...'));
      await generateFile('pages/Login.tpl', 'src/pages/Login.jsx', templateVars);
      await generateFile('pages/Callback.tpl', 'src/pages/Callback.jsx', templateVars);
      await generateFile('pages/Dashboard.tpl', 'src/pages/Dashboard.jsx', templateVars);

      console.log(chalk.blue('\n🧩 Generating components...'));
      await generateFile('components/Header.tpl', 'src/components/Header.jsx', templateVars);
      await generateFile('components/Layout.tpl', 'src/components/Layout.jsx', templateVars);
      await generateFile('components/ProtectedLayout.tpl', 'src/components/ProtectedLayout.jsx', templateVars);

      console.log(chalk.blue('\n⚙️ Generating config files...'));
      await generateFile('config/authConfig.tpl', 'src/config/authConfig.js', templateVars);

      // ✅ Generate organization files if required
      if (templateVars.REQUIRES_ORGANIZATION) {
        console.log(chalk.yellow('\n📋 Organization support enabled - generating organization files...'));

        // Create necessary directories
        const apiDir = 'src/api';
        const contextDir = 'src/context';
        if (!fs.existsSync(apiDir)) {
          fs.mkdirSync(apiDir, { recursive: true });
          console.log(chalk.gray(`  ✓ Created directory: ${apiDir}`));
        }
        if (!fs.existsSync(contextDir)) {
          fs.mkdirSync(contextDir, { recursive: true });
          console.log(chalk.gray(`  ✓ Created directory: ${contextDir}`));
        }

        // API Helper
        console.log(chalk.blue('\n📡 Generating API helper...'));
        await generateFile(
          'api/organizations.tpl',
          'src/api/organizations.js',
          templateVars
        );

        // Context Provider
        console.log(chalk.blue('\n🔄 Generating context provider...'));
        await generateFile(
          'context/OrganizationContext.tpl',
          'src/context/OrganizationContext.jsx',
          templateVars
        );

        // Organization pages
        console.log(chalk.blue('\n📄 Generating organization pages...'));
        await generateFile(
          'pages/SelectOrganization.tpl',
          'src/pages/SelectOrganization.jsx',
          templateVars
        );
        await generateFile(
          'pages/CreateOrganization.tpl',
          'src/pages/CreateOrganization.jsx',
          templateVars
        );

        // Organization onboarding (legacy support)
        await generateFile(
          'pages/OrganizationOnboarding.tpl',
          'src/pages/OrganizationOnboarding.jsx',
          templateVars
        );

        // Invite Members page
        await generateFile(
          'pages/InviteMembers.tpl',
          'src/pages/InviteMembers.jsx',
          templateVars
        );

        // Create organization components directory
        const orgDir = 'src/components/organization';
        if (!fs.existsSync(orgDir)) {
          fs.mkdirSync(orgDir, { recursive: true });
          console.log(chalk.gray(`  ✓ Created directory: ${orgDir}`));
        }

        // Organization components
        await generateFile(
          'components/OrganizationSwitcher.tpl',
          'src/components/organization/OrganizationSwitcher.jsx',
          templateVars
        );

        await generateFile(
          'components/OrganizationManager.tpl',
          'src/components/organization/OrganizationManager.jsx',
          templateVars
        );

        // ✅ Create Organization Modal (for existing users to create new orgs)
        await generateFile(
          'components/CreateOrganizationModal.tpl',
          'src/components/organization/CreateOrganizationModal.jsx',
          templateVars
        );

        // ✅ NEW: Workspace components
        console.log(chalk.blue('\n📦 Generating workspace components...'));
        await generateFile(
          'api/workspaces.tpl',
          'src/api/workspaces.js',
          templateVars
        );
        await generateFile(
          'components/OrganizationWorkspaces.tpl',
          'src/components/organization/OrganizationWorkspaces.jsx',
          templateVars
        );

        // ✅ Workspace Context Provider
        await generateFile(
          'context/WorkspaceContext.tpl',
          'src/context/WorkspaceContext.jsx',
          templateVars
        );

        // ✅ Workspace Switcher Component
        await generateFile(
          'components/WorkspaceSwitcher.tpl',
          'src/components/WorkspaceSwitcher.jsx',
          templateVars
        );

        // ✅ Create Workspace Modal
        await generateFile(
          'components/organization/CreateWorkspaceModal.tpl',
          'src/components/organization/CreateWorkspaceModal.jsx',
          templateVars
        );

        // ============================================================================
        // ✅ NEW: Generate RBAC (Role Management) files
        // ============================================================================
        console.log(chalk.blue('\n🔐 Generating RBAC (role management) files...'));

        // Create constants directory
        const constantsDir = 'src/constants';
        if (!fs.existsSync(constantsDir)) {
          fs.mkdirSync(constantsDir, { recursive: true });
        }

        await generateFile('rbac/permissions.tpl', 'src/constants/permissions.js', templateVars);
        await generateFile('rbac/usePermissions.tpl', 'src/hooks/usePermissions.jsx', templateVars);
        await generateFile('api/roles.tpl', 'src/api/roles.js', templateVars);
        await generateFile('components/organization/RoleManager.tpl', 'src/components/organization/RoleManager.jsx', templateVars);
        await generateFile('components/organization/MemberRoleAssignment.tpl', 'src/components/organization/MemberRoleAssignment.jsx', templateVars);

        console.log(chalk.green('  ✓ Generated RBAC files (RoleManager, permissions, hooks)'));

        // NOTE: CSS files removed - MUI is used for styling

        // Use App.tpl with organization routes
        console.log(chalk.blue('\n📦 Generating App.jsx with organization routes...'));
        await generateFile('App.tpl', 'src/App.jsx', templateVars);
      } else {
        // Use App without organization routes
        console.log(chalk.blue('\n📦 Generating App.jsx (no organization)...'));
        await generateFile('App.tpl', 'src/App.jsx', templateVars);
      }

      // ============================================================================
      // ✅ NEW: Generate Services and Hooks (Client Registry Abstraction)
      // ============================================================================
      console.log(chalk.blue('\n🛠️ Generating services and hooks...'));

      const servicesDir = 'src/services';
      const hooksDir = 'src/hooks';

      if (!fs.existsSync(servicesDir)) {
        fs.mkdirSync(servicesDir, { recursive: true });
        console.log(chalk.gray(`  ✓ Created directory: ${servicesDir}`));
      }
      if (!fs.existsSync(hooksDir)) {
        fs.mkdirSync(hooksDir, { recursive: true });
        console.log(chalk.gray(`  ✓ Created directory: ${hooksDir}`));
      }

      await generateFile(
        'services/clientRegistryService.tpl',
        'src/services/clientRegistryService.js',
        templateVars
      );
      await generateFile(
        'hooks/useClientRegistry.tpl',
        'src/hooks/useClientRegistry.js',
        templateVars
      );

      // Root files
      console.log(chalk.blue('\n📦 Generating root files...'));
      await generateFile('main.tpl', 'src/main.jsx', templateVars);
      await generateFile('.env.tpl', '.env', templateVars);

      // Core CSS (Skipped - using Pure MUI)

      console.log(chalk.green('\n✅ UI files generated successfully!\n'));

      // Final summary
      console.log(chalk.cyan('📊 Generation Summary:'));
      console.log(chalk.gray(`   Framework: React`));
      console.log(chalk.gray(`   Client: ${templateVars.APP_NAME} (${templateVars.CLIENT_KEY})`));
      console.log(chalk.gray(`   Port: ${templateVars.PORT}`));
      console.log(chalk.gray(`   Organization Support: ${templateVars.REQUIRES_ORGANIZATION ? '✅ Enabled' : '❌ Disabled'}`));

      if (templateVars.REQUIRES_ORGANIZATION) {
        console.log(chalk.yellow('\n📋 Organization Features:'));
        console.log(chalk.gray(`   Model: ${templateVars.ORGANIZATION_MODEL}`));
        console.log(chalk.gray(`   Onboarding Flow: ${templateVars.ONBOARDING_FLOW}`));
      }

      console.log(chalk.blue('\n🚀 Next steps:'));
      console.log(chalk.gray('  1. npm install (if not done)'));
      console.log(chalk.gray('  2. npm run dev'));
      console.log(chalk.gray(`  3. Open: ${SSO_CONFIG.getClientUrl(clientKey, templateVars.PORT)}`));

    } catch (error) {
      console.error(chalk.red('\n❌ Failed to generate UI files:'), error.message);
      if (error.response) {
        console.error(chalk.red('Server response:'), error.response.data);
      }
      process.exit(1);
    }
  });

// Setup command - now uses modular implementation
program
  .command('setup')
  .description('🎯 Complete setup guide')
  .action(setupCommand);


// Config-port command
program
  .command('config-port')
  .description('🔧 Configure Vite development port')
  .argument('[port]', 'Port number to use')
  .action(async (portArg) => {
    try {
      let port = portArg;

      if (!fs.existsSync('package.json')) {
        console.error(chalk.red('❌ No package.json found. Run this command in a Vite React project.'));
        process.exit(1);
      }

      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const isViteProject = packageJson.devDependencies?.vite || packageJson.dependencies?.vite;

      if (!isViteProject) {
        console.error(chalk.red('❌ This doesn\'t appear to be a Vite project.'));
        process.exit(1);
      }

      let currentPort = '5173';
      if (fs.existsSync('vite.config.js')) {
        const viteConfig = fs.readFileSync('vite.config.js', 'utf8');
        const portMatch = viteConfig.match(/port:\s*(\d+)/);
        if (portMatch) {
          currentPort = portMatch[1];
        }
      }

      if (!port) {
        const answer = await inquirer.prompt([{
          type: 'input',
          name: 'port',
          message: `Enter development port (current: ${currentPort}):`,
          default: currentPort,
          validate: (input) => {
            const portNum = parseInt(input);
            if (isNaN(portNum) || portNum < 1000 || portNum > 65535) {
              return 'Port must be a number between 1000 and 65535';
            }
            return true;
          },
          filter: (input) => parseInt(input)
        }]);
        port = answer.port;
      } else {
        port = parseInt(port);
        if (isNaN(port) || port < 1000 || port > 65535) {
          console.error(chalk.red('❌ Port must be a number between 1000 and 65535'));
          process.exit(1);
        }
      }
      // Get clientKey from .env
      let clientKey = 'app';
      if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8');
        const clientMatch = envContent.match(/VITE_CLIENT_KEY=(.+)/);
        if (clientMatch) {
          clientKey = clientMatch[1].trim();
        }
      }

      await createOrUpdateViteConfig(port, clientKey);
      console.log(chalk.green(`✅ Updated vite.config.js for ${clientKey}.${SSO_CONFIG.domain}:${port}`));

      if (fs.existsSync('.env')) {
        let envContent = fs.readFileSync('.env', 'utf8');
        if (envContent.includes('VITE_REDIRECT_URI=')) {
          envContent = envContent.replace(
            /VITE_REDIRECT_URI=http:\/\/[^\/]+\/callback/,
            `VITE_REDIRECT_URI=${SSO_CONFIG.getRedirectUrl(clientKey, port)}`
          );
          fs.writeFileSync('.env', envContent);
          console.log(chalk.green(`✅ Updated .env redirect URI to use port ${port}`));
        }
      }

      console.log(chalk.yellow(`\n💡 Remember to:`));
      console.log(chalk.white(`1. Update your client request redirect URL to: https://localhost:${port}/callback`));
      console.log(chalk.white(`2. Update account-ui client registry if already linked`));
      console.log(chalk.white(`3. Restart your dev server: npm run dev`));

    } catch (error) {
      console.error(chalk.red('❌ Failed to configure port:'), error.message);
      process.exit(1);
    }
  });


program.parse();