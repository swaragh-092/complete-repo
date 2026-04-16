'use strict';

const RequestService = require('../../services/request.service');
const { OrganizationRequest, Organization, UserMetadata } = require('../../../../config/database');
const { AppError } = require('../../../../middleware/errorHandler');

jest.mock('../../../../config/database', () => ({
    OrganizationRequest: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn()
    },
    Organization: {},
    UserMetadata: {}
}));

describe('RequestService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createRequest()', () => {
        it('should create a pending request', async () => {
            const mockData = {
                type: 'limit_increase',
                details: { requested_setting: 'max_workspaces', requested_value: 10, reason: 'Scaling up' }
            };

            OrganizationRequest.create.mockResolvedValue({ id: 'req-1', ...mockData, status: 'pending' });

            const result = await RequestService.createRequest('org-1', 'user-1', mockData);

            expect(result.id).toEqual('req-1');
            expect(OrganizationRequest.create).toHaveBeenCalledWith({
                org_id: 'org-1',
                requested_by: 'user-1',
                type: 'limit_increase',
                details: mockData.details,
                status: 'pending'
            });
        });
    });

    describe('resolveRequest()', () => {
        it('should approve a pending request', async () => {
            const mockRequest = {
                id: 'req-1',
                status: 'pending',
                details: {},
                save: jest.fn().mockResolvedValue(true)
            };

            OrganizationRequest.findByPk.mockResolvedValue(mockRequest);

            const result = await RequestService.resolveRequest('req-1', 'approved', 'admin-user-1', 'Approved scaling request');

            expect(result.status).toEqual('approved');
            expect(result.resolved_by).toEqual('admin-user-1');
            expect(result.details.resolution_reason).toEqual('Approved scaling request');
            expect(mockRequest.save).toHaveBeenCalled();
        });

        it('should throw error if request not found', async () => {
            OrganizationRequest.findByPk.mockResolvedValue(null);
            await expect(RequestService.resolveRequest('req-1', 'approved', 'admin')).rejects.toThrow(AppError);
        });

        it('should throw error if request is already resolved', async () => {
            OrganizationRequest.findByPk.mockResolvedValue({ id: 'req-1', status: 'approved' });
            await expect(RequestService.resolveRequest('req-1', 'rejected', 'admin')).rejects.toThrow(AppError);
        });
    });

});
