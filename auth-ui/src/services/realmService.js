/**
 * @fileoverview Realm Service
 * @description Handles all realm-related API calls and data normalization
 */

import api, { extractData } from './api';

class RealmService {
  /**
   * Normalize realm data from Keycloak format to app format
   * @param {Object} realm - Raw realm data from API
   * @returns {Object} Normalized realm data
   */
  _normalizeRealm(realm) {
    if (!realm) return null;

    // Extract the key fields first
    const realmName = realm.realm || realm.realm_name;
    const displayName = realm.displayName || realm.display_name || realm.realm;

    return {
      // Keep ALL original fields (including realm and displayName for compatibility)
      ...realm,

      // Override with normalized fields to ensure they take precedence
      realm_name: realmName,
      display_name: displayName,
    };
  }

  /**
   * Get all realms
   * @returns {Promise<Array>} Array of normalized realm objects
   */
  async getAllRealms() {
    try {
      const res = await api.get('/api/admin/realms');
      const data = extractData(res);

      let realmsArray = [];
      if (Array.isArray(data)) {
        realmsArray = data;
      } else {
        console.error('Unexpected API response structure:', data);
        return [];
      }

      // Normalize each realm
      const normalized = realmsArray.map(realm => this._normalizeRealm(realm));
      return normalized;
    } catch (error) {
      console.error('Failed to fetch realms:', error);
      throw error;
    }
  }

  /**
   * Get realm settings by name
   * @param {string} realmName - Name of the realm
   * @returns {Promise<Object>} Normalized realm object
   */
  async getRealmSettings(realmName) {
    try {
      const res = await api.get(`/api/admin/realms/${realmName}`);
      const realmData = extractData(res);
      return this._normalizeRealm(realmData);
    } catch (error) {
      console.error(`Failed to fetch realm settings for ${realmName}:`, error);
      throw error;
    }
  }

  /**
   * Create new realm
   * @param {Object} realmData - Realm creation data
   * @returns {Promise<Object>} Created realm
   */
  async createRealm(realmData) {
    try {
      const res = await api.post('/api/admin/realms', {
        realm_name: realmData.realm_name,
        display_name: realmData.display_name
      });
      return extractData(res);
    } catch (error) {
      console.error('Failed to create realm:', error);
      throw error;
    }
  }

  /**
   * Update realm settings
   * @param {string} realmName - Name of the realm
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Updated realm
   */
  async updateRealmSettings(realmName, settings) {
    try {
      const res = await api.patch(`/api/admin/realms/${realmName}`, settings);
      return extractData(res);
    } catch (error) {
      console.error(`Failed to update realm ${realmName}:`, error);
      throw error;
    }
  }

  /**
   * Toggle realm enabled/disabled status
   * @param {string} realmName - Name of the realm
   * @param {boolean} enabled - New enabled status
   * @returns {Promise<Object>} Updated realm
   */
  async toggleRealmStatus(realmName, enabled) {
    try {
      const res = await api.patch(`/api/admin/realms/${realmName}/enabled`, { enabled });
      return extractData(res);
    } catch (error) {
      console.error(`Failed to toggle realm ${realmName}:`, error);
      throw error;
    }
  }

  /**
   * Delete realm
   * @param {string} realmName - Name of the realm to delete
   * @returns {Promise<void>}
   */
  async deleteRealm(realmName) {
    try {
      await api.delete(`/api/admin/realms/${realmName}`);
    } catch (error) {
      console.error(`Failed to delete realm ${realmName}:`, error);
      throw error;
    }
  }

  async getRealmUsers(realmName) {
    try {
      const res = await api.get(`/api/admin/${realmName}/users`);
      return extractData(res);
    } catch (error) {
      console.error(`Failed to fetch users for ${realmName}:`, error);
      return [];
    }
  }

  /**
   * Get clients for a specific realm
   * @param {string} realmName - Name of the realm
   * @returns {Promise} Array of clients
   */
  async getRealmClients(realmName) {
    try {
      const res = await api.get(`/api/admin/${realmName}/clients`);
      return extractData(res);
    } catch (error) {
      console.error(`Failed to fetch clients for ${realmName}:`, error);
      return [];
    }
  }

  /**
   * Clone a realm
   * @param {string} sourceRealm - Name of the realm to clone
   * @param {string} newRealmName - Name of the new realm
   * @returns {Promise<Object>} The new realm
   */
  async cloneRealm(sourceRealm, newRealmName) {
    try {
      const res = await api.post(`/api/admin/realms/${sourceRealm}/clone`, { newRealmName: newRealmName });
      return extractData(res);
    } catch (error) {
      console.error(`Failed to clone realm ${sourceRealm}:`, error);
      throw error;
    }
  }
}

export default new RealmService();
