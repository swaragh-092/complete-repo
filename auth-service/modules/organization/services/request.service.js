'use strict';

const { OrganizationRequest, Organization, UserMetadata } = require('../../../config/database');
const { AppError } = require('../../../middleware/errorHandler');

class RequestService {
    /**
     * Submit a new organization request (e.g., limit increase)
     */
    static async createRequest(orgId, userId, data) {
        return await OrganizationRequest.create({
            org_id: orgId,
            requested_by: userId,
            type: data.type,
            details: data.details,
            status: 'pending'
        });
    }

    /**
     * Get all pending and resolved requests for Super Admins
     */
    static async getAllRequests(filters = {}) {
        return await OrganizationRequest.findAll({
            where: filters,
            include: [
                { model: Organization, attributes: ['id', 'name', 'tenant_id'] },
                { model: UserMetadata, as: 'Requester', attributes: ['id', 'email', 'first_name', 'last_name'] }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    /**
     * Get requests for a specific organization
     */
    static async getOrgRequests(orgId, filters = {}) {
        return await OrganizationRequest.findAll({
            where: { org_id: orgId, ...filters },
            include: [
                { model: UserMetadata, as: 'Requester', attributes: ['id', 'email', 'first_name', 'last_name'] },
                { model: UserMetadata, as: 'Resolver', attributes: ['id', 'email', 'first_name', 'last_name'] }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    /**
     * Resolve (approve/reject) a request
     */
    static async resolveRequest(requestId, status, resolvedByUserId, resolutionReason = null) {
        const request = await OrganizationRequest.findByPk(requestId);
        if (!request) {
            throw new AppError('Organization request not found', 404, 'NOT_FOUND');
        }

        if (request.status !== 'pending') {
            throw new AppError(`Request has already been ${request.status}`, 400, 'ALREADY_RESOLVED');
        }

        request.status = status;
        request.resolved_by = resolvedByUserId;
        request.resolved_at = new Date();

        if (resolutionReason) {
            request.details = {
                ...request.details,
                resolution_reason: resolutionReason
            };
        }

        await request.save();
        return request;
    }
}

module.exports = RequestService;
