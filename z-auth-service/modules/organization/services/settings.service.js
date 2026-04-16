'use strict';

const { GlobalSetting, Organization } = require('../../../config/database');
const logger = require('../../../utils/logger');
const { AppError } = require('../../../middleware/errorHandler');

/**
 * Service to manage GlobalSettings and Organization settings
 * Includes fallback logic: Org Override -> Global DB Default -> System Env Variable
 */
class SettingsService {
    /**
     * Resolve a setting value in the correct priority order.
     * Priority: Organization Settings (JSONB) -> GlobalSetting (DB) -> System Fallback (Env)
     * 
     * @param {string} orgId - The UUID of the organization
     * @param {string} key - The setting key (e.g., 'MAX_WORKSPACES_PER_ORG')
     * @param {any} systemFallback - Hardcoded fallback if missing
     * @returns {Promise<any>}
     */
    static async resolveSetting(orgId, key, systemFallback) {
        // 1. Check Per-Org Override
        if (orgId) {
            const org = await Organization.findByPk(orgId, { attributes: ['settings'] });
            if (org && org.settings && org.settings[key.toLowerCase()] !== undefined) {
                return org.settings[key.toLowerCase()];
            }
        }

        // 2. Check Global Settings DB Default
        const globalSetting = await GlobalSetting.findOne({
            where: { key, is_active: true }
        });

        if (globalSetting && globalSetting.value !== null) {
            return this._parseValue(globalSetting.value, globalSetting.type);
        }

        // 3. System Fallback
        return systemFallback;
    }

    /**
     * Get all active GlobalSettings
     */
    static async getAllGlobalSettings() {
        return GlobalSetting.findAll({
            where: { is_active: true },
            order: [['category', 'ASC'], ['key', 'ASC']]
        });
    }

    /**
     * Update or create a GlobalSetting (SuperAdmin only)
     * 
     * @param {Object} data
     * @param {string} data.key
     * @param {any} data.value
     * @param {string} data.type
     * @param {string} data.category
     * @param {string} data.description
     * @param {string} data.userId - Updater ID
     */
    static async upsertGlobalSetting({ key, value, type, category, description, is_public, userId }) {
        let setting = await GlobalSetting.findOne({ where: { key } });

        if (setting) {
            if (setting.is_system && setting.type !== type) {
                throw new AppError(`Cannot change type of system setting: ${key}`, 400);
            }
            await setting.update({
                value,
                type: type || setting.type,
                category: category || setting.category,
                description: description !== undefined ? description : setting.description,
                is_public: is_public !== undefined ? is_public : setting.is_public,
                updated_by: userId
            });
        } else {
            setting = await GlobalSetting.create({
                key,
                value,
                type: type || 'string',
                category: category || 'system',
                description,
                is_public: is_public || false,
                updated_by: userId,
                is_system: false // User-created settings are not system by default
            });
        }

        return setting;
    }

    /**
     * Update specific JSONB settings for an Organization (SuperAdmin only)
     * 
     * @param {string} orgId 
     * @param {Object} newSettings - Key-value pairs to merge into settings
     */
    static async updateOrgSettings(orgId, newSettings) {
        const org = await Organization.findByPk(orgId);
        if (!org) throw new AppError('Organization not found', 404);

        const currentSettings = org.settings || {};

        // Merge updates
        const updatedSettings = { ...currentSettings, ...newSettings };

        // Remove nulls to allow "resetting" an override to global
        for (const k in updatedSettings) {
            if (updatedSettings[k] === null) {
                delete updatedSettings[k];
            }
        }

        await org.update({ settings: updatedSettings });
        return org;
    }

    /**
     * Parse value based on strict type
     * @private
     */
    static _parseValue(value, type) {
        try {
            if (type === 'number') return Number(value);
            if (type === 'boolean') return ['true', '1', true].includes(value);
            if (type === 'json' && typeof value === 'string') return JSON.parse(value);
            return value;
        } catch (err) {
            logger.warn(`Failed to parse setting value ${value} as ${type}`);
            return value;
        }
    }
}

module.exports = SettingsService;
