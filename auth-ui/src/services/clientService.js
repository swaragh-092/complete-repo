/**
 * @fileoverview Client Service - Enterprise-grade API service for client management
 * @description Provides centralized client operations with proper error handling
 */

import api, { extractData, extractPaginatedData } from './api';

/**
 * Service class for client-related API operations
 * @class ClientService
 */
class ClientService {
  /**
   * Fetch all clients with pagination
   * @param {Object} params - Query parameters
   * @param {number} [params.page=1] - Page number (1-based)
   * @param {number} [params.limit=10] - Items per page
   * @param {string} [params.search] - Search query
   * @param {string} [params.sortBy='clientId'] - Sort field
   * @param {string} [params.sortOrder='asc'] - Sort direction
   * @param {string} [params.realm] - Filter by realm
   * @returns {Promise<Object>} Paginated client data
   */
  async getAllClients({ page = 1, limit = 10, search = '', sortBy = 'clientId', sortOrder = 'asc', realm = '' } = {}) {
    const endpoint = realm ? `/api/admin/${realm}/clients` : '/api/admin/clients';
    const res = await api.get(endpoint, {
      params: { page, limit, search, sortBy, sortOrder }
    });
    return extractPaginatedData(res);
  }

  /**
   * Get client by ID
   * @param {string} clientId - The client identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Client details
   */
  /**
   * Get client by ID
   * @param {string} clientId - The client identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Client details
   */
  async getClient(clientId, realm) {
    const res = await api.get(`/api/admin/${realm}/clients/${clientId}`);
    return extractData(res);
  }

  /**
   * Create a new client
   * @param {Object} clientData - Client creation data
   * @param {string} clientData.realm - Realm name
   * @returns {Promise<Object>} Created client data
   */
  async createClient(clientData) {
    const realm = clientData.realm || 'master';
    const res = await api.post(`/api/admin/${realm}/clients`, clientData);
    return extractData(res);
  }

  /**
   * Update client settings
   * @param {string} clientId - The client identifier
   * @param {Object} updates - Client data to update
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Updated client data
   */
  async updateClient(clientId, updates, realm) {
    const res = await api.patch(`/api/admin/${realm}/clients/${clientId}`, updates);
    return extractData(res);
  }

  /**
   * Delete a client
   * @param {string} clientId - The client identifier
   * @param {string} realm - The realm name
   * @returns {Promise<void>}
   */
  async deleteClient(clientId, realm) {
    await api.delete(`/api/admin/${realm}/clients/${clientId}`);
  }

  /**
   * Toggle client enabled/disabled status
   * @param {string} clientId - The client identifier
   * @param {boolean} enabled - New enabled state
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Updated client data
   */
  async toggleClientStatus(clientId, enabled, realm) {
    return this.updateClient(clientId, { enabled }, realm);
  }

  /**
   * Get client secret
   * @param {string} clientId - The client identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} Client secret data
   */
  async getClientSecret(clientId, realm) {
    const res = await api.get(`/api/admin/${realm}/clients/${clientId}/secret`);
    return extractData(res);
  }

  /**
   * Regenerate client secret
   * @param {string} clientId - The client identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Object>} New client secret
   */
  async regenerateClientSecret(clientId, realm) {
    const res = await api.post(`/api/admin/${realm}/clients/${clientId}/secret/regenerate`, {});
    return extractData(res);
  }

  /**
   * Get client roles
   * @param {string} clientId - The client identifier
   * @param {string} realm - The realm name
   * @returns {Promise<Array>} Client roles
   */
  async getClientRoles(clientId, realm) {
    const res = await api.get(`/api/admin/${realm}/clients/${clientId}/roles`);
    return extractData(res);
  }

  /**
   * Get protocol mappers for a client
   * @param {string} realm - Realm name
   * @param {string} clientId - Client ID (UUID)
   * @returns {Promise<Array>} List of protocol mappers
   */
  async getProtocolMappers(realm, clientId) {
    try {
      const res = await api.get(`/api/admin/${realm}/clients/${clientId}/mappers`);
      return extractData(res);
    } catch (error) {
      console.error(`Failed to fetch mappers for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Create protocol mapper
   * @param {string} realm - Realm name
   * @param {string} clientId - Client ID (UUID)
   * @param {Object} mapperData - Mapper configuration
   * @returns {Promise<Object>} Created mapper
   */
  async createProtocolMapper(realm, clientId, mapperData) {
    try {
      const res = await api.post(`/api/admin/${realm}/clients/${clientId}/mappers`, mapperData);
      return extractData(res);
    } catch (error) {
      console.error(`Failed to create mapper for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Update protocol mapper
   * @param {string} realm - Realm name
   * @param {string} clientId - Client ID (UUID)
   * @param {string} mapperId - Mapper ID
   * @param {Object} mapperData - Updated configuration
   * @returns {Promise<Object>} Updated mapper
   */
  async updateProtocolMapper(realm, clientId, mapperId, mapperData) {
    try {
      const res = await api.put(`/api/admin/${realm}/clients/${clientId}/mappers/${mapperId}`, mapperData);
      return extractData(res);
    } catch (error) {
      console.error(`Failed to update mapper ${mapperId}:`, error);
      throw error;
    }
  }

  /**
   * Delete protocol mapper
   * @param {string} realm - Realm name
   * @param {string} clientId - Client ID (UUID)
   * @param {string} mapperId - Mapper ID
   * @returns {Promise<void>}
   */
  async deleteProtocolMapper(realm, clientId, mapperId) {
    try {
      await api.delete(`/api/admin/${realm}/clients/${clientId}/mappers/${mapperId}`);
    } catch (error) {
      console.error(`Failed to delete mapper ${mapperId}:`, error);
      throw error;
    }
  }
}

export default new ClientService();
