/**
 * @fileoverview Client Request Service - API service for client registration requests
 * @description Provides CRUD operations for client registration requests
 */

import { auth } from '@spidy092/auth-client';
import { extractData } from './api';

const BASE_PATH = '/auth/admin/client-requests';

/**
 * Service for client request API operations
 */
const clientRequestService = {
    /**
     * Get all client requests with optional status filter
     * @param {string} [status='pending'] - Filter by status (pending|approved|rejected|all)
     * @returns {Promise<Array>} List of client requests
     */
    async getAll(status = 'pending') {
        const res = await auth.api.get(`${BASE_PATH}?status=${status}`);
        const data = extractData(res);
        return data?.requests || (Array.isArray(data) ? data : []);
    },

    /**
     * Get a single client request by ID
     * @param {string|number} id - Request ID
     * @returns {Promise<Object>} Client request details
     */
    async getById(id) {
        const res = await auth.api.get(`${BASE_PATH}/${id}`);
        const data = extractData(res);
        return data?.request || data;
    },

    /**
     * Create a new client request
     * @param {Object} requestData - Client request data
     * @returns {Promise<Object>} Created request
     */
    async create(requestData) {
        const res = await auth.api.post('/auth/client-requests', requestData);
        return extractData(res);
    },

    /**
     * Update a client request
     * @param {string|number} id - Request ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated request
     */
    async update(id, updateData) {
        const res = await auth.api.put(`${BASE_PATH}/${id}`, updateData);
        return extractData(res);
    },

    /**
     * Delete a client request
     * @param {string|number} id - Request ID
     * @returns {Promise<Object>} Deletion result
     */
    async delete(id) {
        const res = await auth.api.delete(`${BASE_PATH}/${id}`);
        return extractData(res);
    },

    /**
     * Approve a client request
     * @param {string|number} id - Request ID
     * @returns {Promise<Object>} Approval result
     */
    async approve(id) {
        const res = await auth.api.post(`${BASE_PATH}/${id}/approve`);
        return extractData(res);
    },

    /**
     * Reject a client request
     * @param {string|number} id - Request ID
     * @param {string} reason - Rejection reason
     * @returns {Promise<Object>} Rejection result
     */
    async reject(id, reason) {
        const res = await auth.api.post(`${BASE_PATH}/${id}/reject`, { reason });
        return extractData(res);
    },

    /**
     * Get request statistics (counts by status)
     * @returns {Promise<Object>} Stats object with pending, approved, rejected counts
     */
    async getStats() {
        const [pending, approved, rejected] = await Promise.all([
            this.getAll('pending'),
            this.getAll('approved'),
            this.getAll('rejected')
        ]);

        return {
            pending: pending.length,
            approved: approved.length,
            rejected: rejected.length,
            total: pending.length + approved.length + rejected.length
        };
    }
};

export default clientRequestService;
