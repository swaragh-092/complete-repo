const request = require('supertest');
const express = require('express');

// Mock dependencies before requiring the router
jest.mock('../../../middleware/authMiddleware', () => ({
    authMiddleware: (req, res, next) => {
        req.user = { id: 'test-user-id', roles: ['admin'] };
        next();
    },
    requireSuperAdmin: () => (req, res, next) => next(),
    requireRole: () => (req, res, next) => next(),
}));

jest.mock('../../../config/database', () => {
    const SequelizeMock = require('sequelize');
    return {
        Organization: { findAll: jest.fn(), findByPk: jest.fn(), count: jest.fn(), create: jest.fn() },
        OrganizationMembership: { count: jest.fn(), findAll: jest.fn(), findOne: jest.fn() },
        UserMetadata: { count: jest.fn(), findAll: jest.fn(), findOne: jest.fn() },
        Role: { findOne: jest.fn() },
        Client: { findOne: jest.fn() },
        AuditLog: { create: jest.fn() },
        sequelize: {
            transaction: jest.fn(() => ({ commit: jest.fn(), rollback: jest.fn() })),
            Op: SequelizeMock.Op,
            fn: jest.fn(),
            col: jest.fn(),
            literal: jest.fn()
        },
        Sequelize: SequelizeMock
    };
});

jest.mock('../../../services/email-client', () => ({
    send: jest.fn()
}));

jest.mock('../../../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}));

const db = require('../../../config/database');
// Require the existing routes (to simulate that they exist or we test the refactored one once moved)
// Let's test the segregated routes
const organizationsRouter = require('../routes/organizations.routes');

const app = express();
app.use(express.json());
app.use('/api/organizations', organizationsRouter);

describe('Organization Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/organizations', () => {
        it('should return a list of organizations', async () => {
            db.Organization.findAll.mockResolvedValue([
                { id: 'org-1', name: 'Org 1', tenant_id: 'tenant-1' }
            ]);
            db.OrganizationMembership.count.mockResolvedValue(5);
            db.UserMetadata.count.mockResolvedValue(2);

            const response = await request(app).get('/api/organizations');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toBe('Org 1');
            expect(response.body.data[0].total_users).toBe(7);
        });
    });
});
