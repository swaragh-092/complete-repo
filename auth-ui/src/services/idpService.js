/**
 * @fileoverview Identity Provider Service
 * @description Handles all Identity Provider related API calls
 */

import api, { extractData } from './api';

class IdpService {
    /**
     * Get all identity providers for a realm
     * @param {string} realm - Realm name
     * @returns {Promise<Array>} List of identity providers
     */
    async getIdentityProviders(realm) {
        try {
            const res = await api.get(`/api/admin/${realm}/identity-provider`);
            return extractData(res);
        } catch (error) {
            console.error(`Failed to fetch identity providers for ${realm}:`, error);
            throw error;
        }
    }

    /**
     * Get specific identity provider
     * @param {string} realm - Realm name
     * @param {string} alias - IdP alias
     * @returns {Promise<Object>} Identity provider details
     */
    async getIdentityProvider(realm, alias) {
        try {
            const res = await api.get(`/api/admin/${realm}/identity-provider/${alias}`);
            return extractData(res);
        } catch (error) {
            console.error(`Failed to fetch identity provider ${alias}:`, error);
            throw error;
        }
    }

    /**
     * Create new identity provider
     * @param {string} realm - Realm name
     * @param {Object} idpData - IdP configuration
     * @returns {Promise<Object>} Created IdP
     */
    async createIdentityProvider(realm, idpData) {
        try {
            const res = await api.post(`/api/admin/${realm}/identity-provider`, idpData);
            return extractData(res);
        } catch (error) {
            console.error('Failed to create identity provider:', error);
            throw error;
        }
    }

    /**
     * Update identity provider
     * @param {string} realm - Realm name
     * @param {string} alias - IdP alias
     * @param {Object} idpData - Updated configuration
     * @returns {Promise<Object>} Updated IdP
     */
    async updateIdentityProvider(realm, alias, idpData) {
        try {
            const res = await api.put(`/api/admin/${realm}/identity-provider/${alias}`, idpData);
            return extractData(res);
        } catch (error) {
            console.error(`Failed to update identity provider ${alias}:`, error);
            throw error;
        }
    }

    /**
     * Delete identity provider
     * @param {string} realm - Realm name
     * @param {string} alias - IdP alias
     * @returns {Promise<void>}
     */
    async deleteIdentityProvider(realm, alias) {
        try {
            await api.delete(`/api/admin/${realm}/identity-provider/${alias}`);
        } catch (error) {
            console.error(`Failed to delete identity provider ${alias}:`, error);
            throw error;
        }
    }
}

export default new IdpService();
