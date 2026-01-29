/**
 * @fileoverview Theme Service
 * @description Handles all Theme related API calls
 */

import api, { extractData } from './api';

class ThemeService {
    /**
     * Get theme configuration
     * @param {string} realm - Realm name
     * @returns {Promise<Object>} Theme configuration
     */
    async getThemeConfig(realm) {
        try {
            const res = await api.get(`/api/admin/${realm}/themes`);
            return extractData(res);
        } catch (error) {
            console.error(`Failed to fetch theme config for ${realm}:`, error);
            throw error;
        }
    }

    /**
     * Update theme configuration
     * @param {string} realm - Realm name
     * @param {Object} themeData - Theme configuration
     * @returns {Promise<Object>} Updated theme configuration
     */
    async updateThemeConfig(realm, themeData) {
        try {
            const res = await api.put(`/api/admin/${realm}/themes`, themeData);
            return extractData(res);
        } catch (error) {
            console.error(`Failed to update theme config for ${realm}:`, error);
            throw error;
        }
    }
}

export default new ThemeService();
