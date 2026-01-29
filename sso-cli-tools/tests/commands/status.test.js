/**
 * @fileoverview Unit tests for status command
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';

// Mock dependencies before importing the module
vi.mock('../../lib/services/api.js', () => ({
    authApi: {
        getClientStatus: vi.fn(),
    },
}));

vi.mock('../../lib/utils/logger.js', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        step: vi.fn(),
        keyValue: vi.fn(),
        blank: vi.fn(),
        warn: vi.fn(),
        success: vi.fn(),
    },
    getStatusEmoji: vi.fn((status) => {
        const emojis = { approved: '✅', pending: '⏳', rejected: '❌' };
        return emojis[status] || '❓';
    }),
}));

// Import after mocks
import { statusCommand } from '../../lib/commands/status.js';
import { authApi } from '../../lib/services/api.js';
import { logger } from '../../lib/utils/logger.js';

describe('statusCommand', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`process.exit(${code})`);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('when client is approved', () => {
        it('should display success message', async () => {
            authApi.getClientStatus.mockResolvedValue({
                request: {
                    status: 'approved',
                    client_key: 'test-app',
                    app_name: 'Test App',
                    redirect_url: 'http://localhost:5173/callback',
                    created_at: '2024-01-01T00:00:00Z',
                    approved_at: '2024-01-02T00:00:00Z',
                },
            });

            await statusCommand('test-app');

            expect(logger.keyValue).toHaveBeenCalledWith('Status', expect.stringContaining('APPROVED'));
            expect(logger.success).toHaveBeenCalledWith('Client is approved and ready to use!');
            expect(logger.info).toHaveBeenCalledWith('Run: sso-client generate-ui');
        });
    });

    describe('when client is pending', () => {
        it('should display waiting message', async () => {
            authApi.getClientStatus.mockResolvedValue({
                request: {
                    status: 'pending',
                    client_key: 'test-app',
                    app_name: 'Test App',
                    redirect_url: 'http://localhost:5173/callback',
                    created_at: '2024-01-01T00:00:00Z',
                },
            });

            await statusCommand('test-app');

            expect(logger.keyValue).toHaveBeenCalledWith('Status', expect.stringContaining('PENDING'));
            expect(logger.info).toHaveBeenCalledWith('Waiting for admin approval...');
        });
    });

    describe('when client is rejected', () => {
        it('should display rejection reason', async () => {
            authApi.getClientStatus.mockResolvedValue({
                request: {
                    status: 'rejected',
                    client_key: 'test-app',
                    app_name: 'Test App',
                    redirect_url: 'http://localhost:5173/callback',
                    created_at: '2024-01-01T00:00:00Z',
                    rejection_reason: 'Invalid redirect URL',
                },
            });

            await statusCommand('test-app');

            expect(logger.keyValue).toHaveBeenCalledWith('Status', expect.stringContaining('REJECTED'));
            expect(logger.warn).toHaveBeenCalledWith('Rejection Reason: Invalid redirect URL');
        });
    });

    describe('when client is not found', () => {
        it('should display error and suggest init', async () => {
            authApi.getClientStatus.mockRejectedValue(new Error('Not found'));

            await expect(statusCommand('unknown-app')).rejects.toThrow(/process\.exit/);

            expect(logger.error).toHaveBeenCalledWith(
                'No registration request found for "unknown-app"'
            );
            expect(logger.info).toHaveBeenCalledWith('Run "sso-client init" to register this client');
        });
    });

    describe('when no client key provided', () => {
        it('should exit with error if no .env file', async () => {
            vi.spyOn(fs, 'existsSync').mockReturnValue(false);

            await expect(statusCommand(undefined)).rejects.toThrow(/process\.exit/);

            expect(logger.error).toHaveBeenCalledWith('Client key required');
        });

        it('should read client key from .env file', async () => {
            vi.spyOn(fs, 'existsSync').mockReturnValue(true);
            vi.spyOn(fs, 'readFileSync').mockReturnValue('VITE_CLIENT_KEY=env-client');

            authApi.getClientStatus.mockResolvedValue({
                request: {
                    status: 'approved',
                    client_key: 'env-client',
                    created_at: '2024-01-01T00:00:00Z',
                },
            });

            await statusCommand(undefined);

            expect(authApi.getClientStatus).toHaveBeenCalledWith('env-client');
        });
    });
});
