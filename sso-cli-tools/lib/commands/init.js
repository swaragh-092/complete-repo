/**
 * @fileoverview Init Command
 * @description Initialize SSO client with optional organization support
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import { SSO_CONFIG, DEPENDENCIES } from '../config/index.js';
import { authApi } from '../services/api.js';
import { logger } from '../utils/logger.js';

/**
 * Check if current directory is a Vite React project
 * @returns {{ isViteReact: boolean, currentPort: string|null }}
 */
function detectViteProject() {
    let isViteReact = false;
    let currentPort = null;

    if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        isViteReact = !!(packageJson.devDependencies?.vite || packageJson.dependencies?.vite);

        if (fs.existsSync('vite.config.js')) {
            const viteConfig = fs.readFileSync('vite.config.js', 'utf8');
            const portMatch = viteConfig.match(/port:\s*(\d+)/);
            if (portMatch) {
                currentPort = portMatch[1];
            }
        }
    }

    return { isViteReact, currentPort };
}

/**
 * Prompt user for application configuration
 * @param {string|null} currentPort - Detected Vite port
 * @returns {Promise<Object>} User answers
 */
async function promptUserConfig(currentPort) {
    return inquirer.prompt([
        {
            type: 'input',
            name: 'appName',
            message: 'Application name:',
            validate: input => input.length > 0 || 'App name is required'
        },
        {
            type: 'input',
            name: 'clientKey',
            message: 'Client key:',
            default: (answers) => answers.appName.toLowerCase().replace(/\s+/g, '-'),
            validate: input => input.length > 0 || 'Client key is required'
        },
        {
            type: 'input',
            name: 'port',
            message: currentPort
                ? `Development port (current: ${currentPort}):`
                : 'Development port:',
            default: currentPort || '5173',
            validate: (input) => {
                const port = parseInt(input);
                if (isNaN(port) || port < 1000 || port > 65535) {
                    return 'Port must be a number between 1000 and 65535';
                }
                return true;
            },
            filter: (input) => parseInt(input)
        },
        {
            type: 'input',
            name: 'description',
            message: 'Brief description:',
            default: (answers) => `${answers.appName} application`
        },
        // Organization Support Questions
        {
            type: 'confirm',
            name: 'requiresOrganization',
            message: 'Does this application require users to belong to an organization/team?',
            default: false
        },
        {
            type: 'list',
            name: 'organizationModel',
            message: 'What type of organization model do you need?',
            choices: [
                { name: 'Single Organization (users belong to one org at a time)', value: 'single' },
                { name: 'Multi Organization (users can belong to multiple orgs)', value: 'multi' }
            ],
            when: (answers) => answers.requiresOrganization,
            default: 'single'
        },
        {
            type: 'checkbox',
            name: 'organizationFeatures',
            message: 'What organization features will your app need?',
            choices: [
                { name: 'User Management (invite/remove team members)', value: 'user_management' },
                { name: 'Role Management (assign roles to users)', value: 'role_management' },
                { name: 'Workspaces (projects/teams within org)', value: 'workspaces' },
                { name: 'Billing/Subscription (org-level billing)', value: 'billing' },
                { name: 'Analytics (org usage statistics)', value: 'analytics' },
                { name: 'API Access (org-level API keys)', value: 'api_access' },
                { name: 'Data Export (export org data)', value: 'data_export' },
                { name: 'Audit Logs (track org activities)', value: 'audit_logs' }
            ],
            when: (answers) => answers.requiresOrganization,
            default: ['user_management']
        },
        {
            type: 'list',
            name: 'onboardingFlow',
            message: 'How should new users join organizations?',
            choices: [
                { name: 'Create New Organization (user becomes org owner)', value: 'create_org' },
                { name: 'Join by Invitation (email-based invites)', value: 'invitation_only' },
                { name: 'Join by Domain (auto-join based on email domain)', value: 'domain_matching' },
                { name: 'Both Create and Join (user can choose)', value: 'flexible' }
            ],
            when: (answers) => answers.requiresOrganization,
            default: 'flexible'
        },
        // Docker Integration
        {
            type: 'confirm',
            name: 'generateDocker',
            message: 'Generate Docker files (Dockerfile, nginx.conf)?',
            default: SSO_CONFIG.dockerMode
        },
        // Developer Info
        {
            type: 'input',
            name: 'developerEmail',
            message: 'Your email (for approval notifications):',
            validate: input => input.includes('@') || 'Please enter valid email'
        },
        {
            type: 'input',
            name: 'developerName',
            message: 'Your name:'
        }
    ]);
}

/**
 * Display configuration summary
 * @param {Object} answers - User answers
 */
function showConfigSummary(answers) {
    logger.section('Configuration Summary');
    logger.keyValue('App Name', answers.appName);
    logger.keyValue('Client Key', answers.clientKey);
    logger.keyValue('Port', answers.port.toString());

    if (answers.requiresOrganization) {
        logger.keyValue('Organization Support', '✅ Enabled');
        logger.keyValue('Organization Model', answers.organizationModel);
        logger.keyValue('Onboarding Flow', answers.onboardingFlow);
        logger.keyValue('Features', answers.organizationFeatures.join(', '));
    } else {
        logger.keyValue('Organization Support', '❌ Disabled (personal app)');
    }
}

/**
 * Execute init command
 * Initializes SSO client with optional organization support
 * @param {Object} options - Command options
 * @param {Function} createViteFiles - Optional file creation function (injected for testability)
 */
export async function initCommand(options = {}, createViteFiles = null) {
    logger.step('🔐 SSO Client Setup with Organization Support\n');

    // Check if we're in a proper Vite React project
    const { isViteReact, currentPort } = detectViteProject();

    if (!isViteReact) {
        logger.warn("This doesn't appear to be a Vite React project.\n");
        console.log(chalk.cyan('For best results, please run:'));
        console.log(chalk.white('1. npm create vite@latest my-app -- --template react'));
        console.log(chalk.white('2. cd my-app'));
        console.log(chalk.white('3. npm install'));
        console.log(chalk.white('4. sso-client init\n'));

        const { proceed } = await inquirer.prompt([{
            type: 'confirm',
            name: 'proceed',
            message: 'Continue anyway? (Not recommended)',
            default: false
        }]);

        if (!proceed) {
            logger.info('Great choice! Create a Vite React app first, then come back.');
            process.exit(0);
        }
    }

    const answers = await promptUserConfig(currentPort);

    try {
        // 1. Create local files with organization support (if function provided)
        if (createViteFiles) {
            logger.step('📝 Creating configuration files...\n');
            await createViteFiles(answers);
        }

        // 2. Submit registration request with organization details
        logger.step('📤 Submitting registration request...\n');

        const requestData = {
            name: answers.appName,
            clientKey: answers.clientKey,
            redirectUrl: SSO_CONFIG.getRedirectUrl(answers.clientKey, answers.port),
            callbackUrl: SSO_CONFIG.getCallbackUrl(answers.clientKey),
            description: answers.description,
            developerEmail: answers.developerEmail,
            developerName: answers.developerName,
            framework: 'React + Vite',
            purpose: 'Development',
            // Organization Configuration
            requiresOrganization: answers.requiresOrganization || false,
            organizationModel: answers.organizationModel || null,
            organizationFeatures: answers.organizationFeatures || [],
            onboardingFlow: answers.onboardingFlow || null
        };

        const response = await authApi.registerClient(requestData);

        // Show configuration summary
        logger.success('Setup complete!\n');
        showConfigSummary(answers);

        logger.section('Next Steps');
        console.log(chalk.white(`1. ${DEPENDENCIES.getInstallCommand()}`));
        console.log(chalk.yellow(`2. Add to /etc/hosts: 127.0.0.1 ${answers.clientKey}.${SSO_CONFIG.domain}`));
        console.log(chalk.gray(`   Run: echo "127.0.0.1 ${answers.clientKey}.${SSO_CONFIG.domain}" | sudo tee -a /etc/hosts`));
        console.log(chalk.white(`3. Registration request submitted (ID: ${response?.request?.id || 'pending'})`));
        console.log(chalk.white("4. Wait for admin approval (you'll receive an email)"));
        console.log(chalk.white('5. Check status: sso-client status'));
        console.log(chalk.white('6. Once approved, run: sso-client link-ui'));
        console.log(chalk.white(`7. npm run dev → opens at ${SSO_CONFIG.getClientUrl(answers.clientKey, answers.port)}`));

    } catch (error) {
        if (error.message.includes('409') || error.message.includes('already exists')) {
            logger.warn('Client key already exists or is pending approval');
            logger.info(`Check status: sso-client status ${answers.clientKey}`);
        } else {
            logger.error('Setup failed:', error.message);
        }
    }
}

export default initCommand;
