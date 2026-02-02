/**
 * @fileoverview Setup Command
 * @description Display setup guide for SSO client integration
 */

import { SSO_CONFIG, DEPENDENCIES } from '../config/index.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

/**
 * Execute setup command
 * Displays step-by-step setup guide
 */
export async function setupCommand() {
    logger.step('🚀 SSO Client Setup Guide\n');

    console.log(chalk.cyan('Step-by-step setup process:\n'));

    console.log(chalk.yellow('1. Create a new Vite React project:'));
    console.log(chalk.gray('   npm create vite@latest my-app -- --template react'));
    console.log(chalk.gray('   cd my-app'));
    console.log(chalk.gray('   npm install\n'));

    console.log(chalk.yellow('2. Install required dependencies:'));
    console.log(chalk.gray(`   ${DEPENDENCIES.getInstallCommand()}\n`));

    console.log(chalk.yellow('3. Initialize SSO client:'));
    console.log(chalk.gray('   sso-client init\n'));

    console.log(chalk.yellow('4. Wait for admin approval, then run:'));
    console.log(chalk.gray('   sso-client link-ui'));
    console.log(chalk.gray('   sso-client generate-ui\n'));

    console.log(chalk.yellow('5. Start your development server:'));
    console.log(chalk.gray('   npm run dev\n'));

    logger.blank();
    console.log(chalk.cyan('📋 Available Commands:\n'));
    console.log(chalk.white('   sso-client init          # Initialize and register SSO client'));
    console.log(chalk.white('   sso-client status        # Check registration status'));
    console.log(chalk.white('   sso-client link-ui       # Verify approval'));
    console.log(chalk.white('   sso-client generate-ui   # Generate UI files'));
    console.log(chalk.white('   sso-client setup         # Show this guide'));

    logger.blank();
    console.log(chalk.cyan('🔗 Service URLs:\n'));
    logger.keyValue('Auth Service', SSO_CONFIG.authServiceUrl);
    logger.keyValue('Account UI', SSO_CONFIG.accountUiUrl);

    logger.blank();
    console.log(chalk.cyan('⚙️  Current Configuration:\n'));
    logger.keyValue('Docker Mode', SSO_CONFIG.dockerMode ? 'Enabled' : 'Disabled');
    logger.keyValue('Auth Behind Gateway', SSO_CONFIG.authBehindGateway ? 'Yes (default)' : 'No');
    logger.keyValue('Domain', SSO_CONFIG.domain);
    logger.keyValue('Protocol', SSO_CONFIG.protocol);

    if (!SSO_CONFIG.authBehindGateway) {
        logger.keyValue('Auth Port', SSO_CONFIG.authServicePort.toString());
        logger.keyValue('Account UI Port', SSO_CONFIG.accountUiPort.toString());
    }

    logger.blank();
    console.log(chalk.cyan('📚 Documentation:\n'));
    console.log(chalk.gray('   See README.md for detailed documentation'));
    console.log(chalk.gray('   See docs/DEPLOYMENT_MODES.md for deployment options'));
}

export default setupCommand;
