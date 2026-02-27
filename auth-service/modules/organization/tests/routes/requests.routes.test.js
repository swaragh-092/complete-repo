'use strict';

const request = require('supertest');
const express = require('express');
const { AppError, errorHandler } = require('../../../../middleware/errorHandler');

// Mocks
jest.mock('../../../../../services/keycloak.service', () => {
    return jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
    }));
});
jest.mock('../../../middleware/authMiddleware', () => ({
    authMiddleware: (req, res, next) => {
        req.user = { id: 'test-user-id', roles: ['user'] };
        next();
    },
    requireSuperAdmin: (req, res, next) => {
        if (req.user.roles.includes('super_administrator')) return next();
        next(new AppError('Forbidden', 403, 'FORBIDDEN'));
    }
}));
jest.mock('../../services/request.service', () => ({
    createRequest: jest.fn(),
    getAllRequests: jest.fn(),
    getOrgRequests: jest.fn(),
    resolveRequest: jest.fn()
}));

const RequestService = require('../../services/request.service');
const requestsRouter = require('../../routes/requests.routes');

const app = express();
app.use(express.json());
app.use('/api/organizations/:id/requests', (req, res, next) => {
    // Simulated nested router injection since Express Router requires parent context to catch :id if not mounted at root
    req.params.id = req.originalUrl.split('/')[3];
    if (req.params.id === 'requests') req.params.id = null; // Fix for global /api/organizations/requests
    next();
}, requestsRouter);
app.use('/api/organizations/requests', requestsRouter); // Global mount
app.use(errorHandler);


describe('Requests Routes', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/organizations/requests', () => {
        it('should block non-super-admins', async () => {
            const response = await request(app).get('/api/organizations/requests');
            expect(response.status).toBe(403);
        });

        it('should allow super admins to fetch all requests', async () => {
            app.request.user = { id: 'admin-id', roles: ['super_administrator'] };
            RequestService.getAllRequests.mockResolvedValue([{ id: 'req-1' }]);

            // Note: need to bypass standard authMiddleware mock for this specific check,
            // so we define a temporary override for the app's middleware for this test block
            const adminApp = express();
            adminApp.use(express.json());
            adminApp.use((req, res, next) => {
                req.user = { id: 'admin-id', roles: ['super_administrator'] };
                next();
            });
            adminApp.use('/api/organizations/requests', requestsRouter);

            const response = await request(adminApp).get('/api/organizations/requests');
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
        });
    });

    describe('POST /api/organizations/:id/requests', () => {
        it('should validate request payload', async () => {
            const response = await request(app)
                .post('/api/organizations/org-123/requests')
                .send({ type: 'invalid_type' });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('"type" must be one of [limit_increase, feature_access, other]');
        });

        it('should successfully submit a request', async () => {
            RequestService.createRequest.mockResolvedValue({ id: 'new-req-1' });

            const payload = {
                type: 'limit_increase',
                details: { requested_setting: 'max_workspaces', requested_value: 10, reason: 'Need more spaces' }
            };

            const response = await request(app)
                .post('/api/organizations/org-123/requests')
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.data.id).toBe('new-req-1');
            expect(RequestService.createRequest).toHaveBeenCalledWith('org-123', 'test-user-id', payload);
        });
    });

});
