/**
 * @fileoverview Role Service - Enterprise-grade API service for role management
 * @description Provides centralized role operations with proper error handling
 */

import api, { extractData } from './api';

/**
 * Service class for role-related API operations
 * @class RoleService
 */
class RoleService {
  /**
   * Get all realm roles
   * @param {string} realm - The realm name
   * @returns {Promise<Array>} List of realm roles
   */
  async getRealmRoles(realm) {
    const res = await api.get(`/api/admin/${realm}/roles`);
    return extractData(res);
  }

  /**
   * Get realm role by name
   * @param {string} roleName - The role name
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Role details
   */
  async getRealmRole(roleName, realm) {
    const res = await api.get(`/api/admin/${realm}/roles/${roleName}`);
    return extractData(res);
  }

  /**
   * Create a new realm role
   * @param {Object} roleData - Role creation data
   * @param {string} roleData.name - Role name
   * @param {string} [roleData.description] - Role description
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Created role data
   */
  async createRealmRole(roleData, realm) {
    const res = await api.post(`/api/admin/${realm}/roles`, roleData);
    return extractData(res);
  }

  /**
   * Update realm role
   * @param {string} roleName - The role name
   * @param {Object} updates - Role data to update
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Updated role data
   */
  async updateRealmRole(roleName, updates, realm) {
    const res = await api.patch(`/api/admin/${realm}/roles/${roleName}`, updates);
    return extractData(res);
  }

  /**
   * Delete realm role
   * @param {string} roleName - The role name
   * @param {string} realm - The realm name
   * @returns {Promise<void>}
   */
  async deleteRealmRole(roleName, realm) {
    await api.delete(`/api/admin/${realm}/roles/${roleName}`);
  }

  /**
   * Get all client roles
   * @param {string} clientId - The client identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Array>} List of client roles
   */
  async getClientRoles(clientId, realm) {
    // Note: Client roles are usually accessed via client endpoint or roles endpoint depending on backend structure
    // Assuming /api/admin/:realm/clients/:clientId/roles based on clients.routes.js
    const res = await api.get(`/api/admin/${realm}/clients/${clientId}/roles`);
    return extractData(res);
  }

  /**
   * Get client role by name
   * @param {string} clientId - The client identifier
   * @param {string} roleName - The role name
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Role details
   */
  async getClientRole(clientId, roleName, realm) {
    // Assuming /api/admin/:realm/clients/:clientId/roles/:roleName
    const res = await api.get(`/api/admin/${realm}/clients/${clientId}/roles/${roleName}`);
    return extractData(res);
  }

  /**
   * Create a new client role
   * @param {string} clientId - The client identifier
   * @param {Object} roleData - Role creation data
   * @param {string} roleData.name - Role name
   * @param {string} [roleData.description] - Role description
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Created role data
   */
  async createClientRole(clientId, roleData, realm) {
    const res = await api.post(`/api/admin/${realm}/clients/${clientId}/roles`, roleData);
    return extractData(res);
  }

  /**
   * Update client role
   * @param {string} clientId - The client identifier
   * @param {string} roleName - The role name
   * @param {Object} updates - Role data to update
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Updated role data
   */
  async updateClientRole(clientId, roleName, updates, realm) {
    const res = await api.patch(`/api/admin/${realm}/clients/${clientId}/roles/${roleName}`, updates);
    return extractData(res);
  }

  /**
   * Delete client role
   * @param {string} clientId - The client identifier
   * @param {string} roleName - The role name
   * @param {string} realm - The realm name
   * @returns {Promise<void>}
   */
  async deleteClientRole(clientId, roleName, realm) {
    await api.delete(`/api/admin/${realm}/clients/${clientId}/roles/${roleName}`);
  }

  /**
   * Get users in realm role
   * @param {string} roleName - The role name
   * @param {string} realm - The realm name
   * @returns {Promise<Array>} List of users with this role
   */
  async getRealmRoleUsers(roleName, realm) {
    const res = await api.get(`/api/admin/${realm}/roles/${roleName}/users`);
    return extractData(res);
  }
}

export default new RoleService();
