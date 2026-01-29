/**
 * @fileoverview Database Role Service
 * @description Service for managing database-level roles, permissions, and assignments.
 */

import api, { extractData } from './api';

class DatabaseRoleService {
    /**
     * Get all database roles
     * @returns {Promise<Array>} List of roles
     */
    async getAllRoles() {
        const res = await api.get('/db-roles');
        return extractData(res) || [];
    }

    /**
     * Create a new database role
     * @param {Object} roleData - Role data
     * @returns {Promise<Object>} Created role
     */
    async createRole(roleData) {
        const res = await api.post('/db-roles', roleData);
        return extractData(res);
    }

    /**
     * Update a database role
     * @param {string} id - Role ID
     * @param {Object} roleData - Updated data
     * @returns {Promise<Object>} Updated role
     */
    async updateRole(id, roleData) {
        const res = await api.put(`/db-roles/${id}`, roleData);
        return extractData(res);
    }

    /**
     * Delete a database role
     * @param {string} id - Role ID
     * @returns {Promise<void>}
     */
    async deleteRole(id) {
        await api.delete(`/db-roles/${id}`);
    }

    /**
     * Assign a role to a user/organization
     * @param {string} roleId - Role ID
     * @param {Object} assignmentData - Assignment data (user_id, org_id)
     * @returns {Promise<Object>} Assignment result
     */
    async assignRole(roleId, assignmentData) {
        const res = await api.post(`/db-roles/${roleId}/assign`, assignmentData);
        return extractData(res);
    }

    /**
     * Get all permissions
     * @returns {Promise<Array>} List of permissions
     */
    async getAllPermissions() {
        const res = await api.get('/permissions');
        return extractData(res) || [];
    }

    /**
     * Get users for role assignment
     * @returns {Promise<Array>} List of users
     */
    async getUsers() {
        const res = await api.get('/users');
        return extractData(res) || [];
    }

    /**
     * Get organizations for role assignment
     * @returns {Promise<Array>} List of organizations
     */
    async getOrganizations() {
        const res = await api.get('/organizations');
        return extractData(res) || [];
    }
}

export default new DatabaseRoleService();
