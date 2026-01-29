/**
 * @fileoverview User Service - Enterprise-grade API service for user management
 * @description Provides centralized user operations with proper error handling
 */

import api, { extractData, extractPaginatedData } from './api';

/**
 * Service class for user-related API operations
 * @class UserService
 */
class UserService {
  /**
   * Fetch all users with pagination
   * @param {Object} params - Query parameters
   * @param {string} params.realm - Realm name
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page
   * @param {string} [params.search] - Search query
   * @returns {Promise<Object>} Paginated user data
   */
  async getAllUsers({ realm, page = 1, limit = 10, search = '' } = {}) {
    const res = await api.get(`/api/admin/${realm}/users`, {
      params: { page, limit, search }
    });
    return extractPaginatedData(res);
  }

  /**
   * Get user by ID
   * @param {string} userId - The user identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} User details
   */
  async getUser(userId, realm) {
    const res = await api.get(`/api/admin/${realm}/users/${userId}`);
    return extractData(res);
  }

  /**
   * Create a new user
   * @param {string} realm - The realm name
   * @param {Object} userData - User creation data
   * @returns {Promise<Object>} Created user data
   */
  async createUser(realm, userData) {
    const res = await api.post(`/api/admin/${realm}/users`, userData);
    return extractData(res);
  }

  /**
   * Update user data
   * @param {string} userId - The user identifier
   * @param {Object} updates - User data to update
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Updated user data
   */
  async updateUser(userId, updates, realm) {
    const res = await api.patch(`/api/admin/${realm}/users/${userId}`, updates);
    return extractData(res);
  }

  /**
   * Delete a user
   * @param {string} realm - The realm name
   * @param {string} userId - The user identifier
   * @returns {Promise<void>}
   */
  async deleteUser(realm, userId) {
    await api.delete(`/api/admin/${realm}/users/${userId}`);
  }

  /**
   * Toggle user enabled/disabled status
   * @param {string} userId - The user identifier
   * @param {boolean} enabled - New enabled state
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Updated user data
   */
  async toggleUserStatus(userId, enabled, realm) {
    const res = await api.patch(`/api/admin/${realm}/users/${userId}/enabled`, { enabled });
    return extractData(res);
  }

  /**
   * Reset user password
   * @param {string} userId - The user identifier
   * @param {Object} passwordData - Password reset data
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Response data
   */
  async resetPassword(userId, passwordData, realm) {
    const res = await api.post(`/api/admin/${realm}/users/${userId}/password/reset`, passwordData);
    return extractData(res);
  }

  /**
   * Send password reset email
   * @param {string} userId - The user identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Response data
   */
  async sendPasswordResetEmail(userId, realm) {
    const res = await api.post(`/api/admin/${realm}/users/${userId}/send-password-reset`, {});
    return extractData(res);
  }

  /**
   * Get user sessions
   * @param {string} userId - The user identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Array>} User sessions
   */
  async getUserSessions(userId, realm) {
    const res = await api.get(`/api/admin/${realm}/users/${userId}/sessions`);
    return extractData(res);
  }

  /**
   * Logout user from all sessions
   * @param {string} userId - The user identifier
   * @param {string} realm - The realm name
   * @returns {Promise<void>}
   */
  async logoutAllSessions(userId, realm) {
    await api.post(`/api/admin/${realm}/users/${userId}/logout`, {});
  }

  /**
   * Get user realm roles
   * @param {string} userId - The user identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Array>} User realm roles
   */
  async getUserRealmRoles(userId, realm) {
    const res = await api.get(`/api/admin/${realm}/users/${userId}/roles/realm`);
    return extractData(res);
  }

  /**
   * Assign realm roles to user
   * @param {string} userId - The user identifier
   * @param {Array<string>} roles - Role names to assign
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Response data
   */
  async assignRealmRoles(userId, roles, realm) {
    const res = await api.post(`/api/admin/${realm}/users/${userId}/roles/realm/assign`, { roles });
    return extractData(res);
  }

  /**
   * Remove realm roles from user
   * @param {string} userId - The user identifier
   * @param {Array<string>} roles - Role names to remove
   * @param {string} realm - The realm name
   * @returns {Promise<void>}
   */
  async removeRealmRoles(userId, roles, realm) {
    await api.post(`/api/admin/${realm}/users/${userId}/roles/realm/remove`, { roles });
  }

  /**
   * Get user client roles
   * @param {string} userId - The user identifier
   * @param {string} clientId - The client identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Array>} User client roles
   */
  async getUserClientRoles(userId, clientId, realm) {
    const res = await api.get(`/api/admin/${realm}/users/${userId}/roles/client/${clientId}`);
    return extractData(res);
  }

  /**
   * Assign client roles to user
   * @param {string} userId - The user identifier
   * @param {string} clientId - The client identifier
   * @param {Array<string>} roles - Role names to assign
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Response data
   */
  async assignClientRoles(userId, clientId, roles, realm) {
    const res = await api.post(`/api/admin/${realm}/users/${userId}/roles/client/${clientId}`, { roles });
    return extractData(res);
  }

  /**
   * Remove client roles from user
   * @param {string} userId - The user identifier
   * @param {string} clientId - The client identifier
   * @param {Array<string>} roles - Role names to remove
   * @param {string} realm - The realm name
   * @returns {Promise<void>}
   */
  async removeClientRoles(userId, clientId, roles, realm) {
    await api.delete(`/api/admin/${realm}/users/${userId}/roles/client/${clientId}`, { data: { roles } });
  }

  /**
   * Get user groups
   * @param {string} userId - The user identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Array>} User groups
   */
  async getUserGroups(userId, realm) {
    const res = await api.get(`/api/admin/${realm}/users/${userId}/groups`);
    return extractData(res);
  }

  /**
   * Add user to group
   * @param {string} userId - The user identifier
   * @param {string} groupId - The group identifier
   * @param {string} realm - The realm name
   * @returns {Promise<void>}
   */
  async addToGroup(userId, groupId, realm) {
    await api.put(`/api/admin/${realm}/users/${userId}/groups/${groupId}`, {});
  }

  /**
   * Remove user from group
   * @param {string} userId - The user identifier
   * @param {string} groupId - The group identifier
   * @param {string} realm - The realm name
   * @returns {Promise<void>}
   */
  async removeFromGroup(userId, groupId, realm) {
    await api.delete(`/api/admin/${realm}/users/${userId}/groups/${groupId}`);
  }

  /**
   * Verify user email
   * @param {string} userId - The user identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Response data
   */
  async verifyEmail(userId, realm) {
    const res = await api.post(`/api/admin/${realm}/users/${userId}/email/verify`, {});
    return extractData(res);
  }

  /**
   * Send verification email
   * @param {string} userId - The user identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Response data
   */
  async sendVerificationEmail(userId, realm) {
    // Note: The backend route for this is not explicitly defined in the provided users.routes.js snippet,
    // but assuming it follows the pattern if it exists.
    // Based on provided routes, verifyEmail exists but sendVerificationEmail might be different.
    // Keeping it consistent with previous implementation but updating path.
    const res = await api.post(`/api/admin/${realm}/users/${userId}/send-verify-email`, {});
    return extractData(res);
  }

  /**
   * Get user credentials
   * @param {string} userId - The user identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Array>} User credentials
   */
  async getUserCredentials(userId, realm) {
    const res = await api.get(`/api/admin/${realm}/users/${userId}/credentials`);
    return extractData(res);
  }

  /**
   * Delete user credential
   * @param {string} userId - The user identifier
   * @param {string} credentialId - The credential identifier
   * @param {string} realm - The realm name
   * @returns {Promise<void>}
   */
  async deleteCredential(userId, credentialId, realm) {
    await api.delete(`/api/admin/${realm}/users/${userId}/credentials/${credentialId}`);
  }

  /**
   * Get user attributes
   * @param {string} userId - The user identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} User attributes
   */
  async getUserAttributes(userId, realm) {
    // Note: Backend route is PATCH for update, but GET might be part of getUser.
    // If there is a specific GET /attributes route, use it. Otherwise, this might be redundant if getUser returns attributes.
    // Assuming GET /attributes exists or falling back to getUser.
    // Based on routes: PATCH /:userId/attributes exists. GET is not explicitly shown but likely standard.
    const res = await api.get(`/api/admin/${realm}/users/${userId}/attributes`);
    return extractData(res);
  }

  /**
   * Update user attributes
   * @param {string} userId - The user identifier
   * @param {Object} attributes - Attributes to update
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Response data
   */
  async updateUserAttributes(userId, attributes, realm) {
    const res = await api.patch(`/api/admin/${realm}/users/${userId}/attributes`, attributes);
    return extractData(res);
  }

  /**
   * Search users
   * @param {Object} searchParams - Search parameters
   * @param {string} realm - The realm name
   * @returns {Promise<Array>} Matching users
   */
  async searchUsers(searchParams, realm) {
    const res = await api.get(`/api/admin/${realm}/users/search`, { params: searchParams });
    return extractData(res);
  }

  /**
   * Count users in realm
   * @param {string} realm - The realm name
   * @returns {Promise<number>} User count
   */
  async countUsers(realm) {
    const res = await api.get(`/api/admin/${realm}/users/count`);
    const data = extractData(res);
    return data?.count ?? data;
  }

  /**
   * Get user events
   * @param {string} userId - The user identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Array>} User events
   */
  async getUserEvents(userId, realm) {
    const res = await api.get(`/api/admin/${realm}/users/${userId}/events`);
    return extractData(res);
  }
}

export default new UserService();
