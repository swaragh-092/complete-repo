/**
 * @fileoverview Status Command
 * @description Check SSO client registration status
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
 * Execute status command
 * @param {string|undefined} clientKeyArg - Optional client key argument
 */
export async function statusCommand(clientKeyArg) {
    const clientKey = getClientKey(clientKeyArg);

    if (!clientKey) {
        logger.error('Client key required');
        logger.info('Usage: sso-client status [clientKey]');
        logger.info('Or run from a directory with .env file containing VITE_CLIENT_KEY');
        process.exit(1);
    }

    logger.step(`🔍 Checking status for: ${clientKey}\n`);

    try {
        const { request } = await authApi.getClientStatus(clientKey);

        logger.keyValue('Status', `${getStatusEmoji(request.status)} ${request.status.toUpperCase()}`);
        logger.keyValue('Client Key', request.client_key);

        // requested_at is the correct field name from API
        if (request.requested_at) {
            logger.keyValue('Requested At', new Date(request.requested_at).toLocaleString());
        }

        if (request.approved_at) {
            logger.keyValue('Approved At', new Date(request.approved_at).toLocaleString());
        }

        if (request.status === 'rejected' && request.rejection_reason) {
            logger.blank();
            logger.warn(`Rejection Reason: ${request.rejection_reason}`);
        }

        if (request.status === 'pending') {
            logger.blank();
            logger.info('Waiting for admin approval...');
            logger.info('Ask your admin to approve this client in the Auth UI');
        }

        if (request.status === 'approved') {
            logger.blank();
            logger.success('Client is approved and ready to use!');
            logger.info('Run: sso-client generate-ui');
        }

    } catch (error) {
        if (error.message.includes('Not found')) {
            logger.error(`No registration request found for "${clientKey}"`);
            logger.info('Run "sso-client init" to register this client');
        } else {
            logger.error('Failed to check status:', error.message);
        }
        process.exit(1);
    }
}

export default statusCommand;
