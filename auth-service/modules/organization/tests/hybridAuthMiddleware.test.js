'use strict';

/**
 * Tests for the hybridAuthMiddleware token detection helpers.
 *
 * We mock the heavy dependencies (jwt.service, authMiddleware) to avoid
 * pulling in the entire database stack during unit tests.
 */

// ─── Mock heavy dependencies BEFORE importing ────────────────────────────────
jest.mock('../../../services/jwt.service', () => ({
    verifyJwt: jest.fn(),
}));

jest.mock('../../../middleware/authMiddleware', () => ({
    authMiddleware: jest.fn((req, res, next) => next()),
}));

jest.mock('../../../utils/helper', () => ({
    extractRealmFromToken: jest.fn(() => 'my-projects'),
}));

jest.mock('../../../utils/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

const { isServiceToken, peekToken } = require('../../../middleware/hybridAuthMiddleware');

// ─── Unit Tests for Detection Logic ───────────────────────────────────────────

describe('hybridAuthMiddleware — detection helpers', () => {

    describe('isServiceToken()', () => {
        it('should return true for a Keycloak service account token', () => {
            expect(isServiceToken({
                sub: 'service-uuid',
                azp: 'pms-service',
                preferred_username: 'service-account-pms-service',
                realm_access: { roles: ['uma_authorization'] },
                // No email field
            })).toBe(true);
        });

        it('should return true when clientId claim is present and no email', () => {
            expect(isServiceToken({
                sub: 'service-uuid',
                clientId: 'auth-service',
                preferred_username: 'custom-name',
                // No email field
            })).toBe(true);
        });

        it('should return false for a user token with email', () => {
            expect(isServiceToken({
                sub: 'user-uuid',
                email: 'john@example.com',
                preferred_username: 'johndoe',
                azp: 'my-app',
            })).toBe(false);
        });

        it('should return false for null/undefined', () => {
            expect(isServiceToken(null)).toBe(false);
            expect(isServiceToken(undefined)).toBe(false);
        });

        it('should return false for user without email but without service prefix or clientId', () => {
            expect(isServiceToken({
                sub: 'user-uuid',
                preferred_username: 'johndoe',
                azp: 'my-app',
            })).toBe(false);
        });

        it('should return true for service-account prefix even without clientId', () => {
            expect(isServiceToken({
                sub: 'service-uuid',
                preferred_username: 'service-account-notification-service',
                azp: 'notification-service',
            })).toBe(true);
        });
    });

    describe('peekToken()', () => {
        const jwt = require('jsonwebtoken');

        it('should decode a valid JWT without verification', () => {
            const token = jwt.sign(
                { sub: 'test', email: 'test@example.com' },
                'fake-secret',
                { algorithm: 'HS256' }
            );
            const payload = peekToken(token);
            expect(payload.sub).toBe('test');
            expect(payload.email).toBe('test@example.com');
        });

        it('should return null for garbage input', () => {
            expect(peekToken('not-a-jwt')).toBeNull();
            expect(peekToken('')).toBeNull();
        });
    });
});
