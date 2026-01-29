/**
 * @fileoverview Link-UI Command
 * @description Verify client is approved and ready for use
 */

import { authApi } from '../services/api.js';
import { logger, getStatusEmoji } from '../utils/logger.js';
import fs from 'fs';

/**
 * Get client key from .env file or argument
 * @param {string|undefined} clientKeyArg - CLI argument
 * @returns {string|null} Client key or null
 */
function getClientKey(clientKeyArg) {
    if (clientKeyArg) return clientKeyArg;

    if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf-8');
        const match = envContent.match(/VITE_CLIENT_KEY=(.+)/);
        if (match) return match[1].trim();
    }

    return null;
}

/**
 * Execute link-ui command
 * Verifies client is approved and ready for use
 * @param {string|undefined} clientKeyArg - Optional client key argument
 */
export async function linkUiCommand(clientKeyArg) {
    const clientKey = getClientKey(clientKeyArg);

    if (!clientKey) {
        logger.error('Client key required');
        logger.info('Usage: sso-client link-ui [clientKey]');
        logger.info('Or run from a directory with .env file containing VITE_CLIENT_KEY');
        process.exit(1);
    }

    logger.step(`🔍 Checking client approval status for: ${clientKey}\n`);

    try {
        const { request } = await authApi.getClientStatus(clientKey);

        if (request.status !== 'approved') {
            logger.error(`Client "${clientKey}" is not approved yet`);
            logger.keyValue('Current Status', `${getStatusEmoji(request.status)} ${request.status.toUpperCase()}`);

            if (request.status === 'pending') {
                logger.blank();
                logger.warn('Please wait for admin approval');
            } else if (request.status === 'rejected') {
                logger.blank();
                logger.error(`Rejection reason: ${request.rejection_reason || 'No reason provided'}`);
            }
            return;
        }

        logger.success('Client is approved and registered in the system');
        logger.blank();
        logger.step('🎉 Your SSO client is ready to use!');
        logger.blank();
        logger.info('The account-ui now fetches client configs from the backend API.');
        logger.info('No manual file updates are needed.');

    } catch (error) {
        if (error.message.includes('Not found')) {
            logger.error(`No registration request found for "${clientKey}"`);
            logger.info('Please run "sso-client init" first');
        } else {
            logger.error('Failed to check client status:', error.message);
        }
    }
}

export default linkUiCommand;
