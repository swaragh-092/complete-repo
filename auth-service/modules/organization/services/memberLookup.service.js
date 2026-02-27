'use strict';

/**
 * MemberLookupService
 * 
 * Accepts arrays of user_ids and workspace_ids, queries WorkspaceMembership 
 * with JOINs on Workspace and UserMetadata, resolves user names via a 
 * pluggable user resolver (Keycloak today, HTTP when standalone), and 
 * returns enriched per-user data with their workspace memberships.
 * 
 * Design: Dependency injection for models + user resolution. When the 
 * organization module becomes a standalone service, swap the Keycloak 
 * resolver for an HTTP call to auth-service — zero changes to this file.
 */

const { Op } = require('sequelize');
const KeycloakService = require('../../../services/keycloak.service');
const logger = require('../../../utils/logger');
const { AppError } = require('../../../middleware/errorHandler');

class MemberLookupService {
    /**
     * Look up members and their workspace memberships.
     *
     * @param {Object} params
     * @param {string[]} [params.userIds]       - UUIDs (UserMetadata.id or keycloak_id depending on userIdType)
     * @param {string[]} [params.workspaceIds]  - UUIDs from Workspace.id
     * @param {string}   [params.userIdType]    - 'id' (default) or 'keycloak_id'
     * @param {Object}   params.models          - Injected Sequelize models { WorkspaceMembership, UserMetadata, Workspace }
     * @param {Function} [params.resolveUsers]  - Optional override for user name resolution (for standalone mode)
     * @returns {Promise<{ members: Array }>}
     */
    static async lookup({ userIds = [], workspaceIds = [], userIdType = 'keycloak_id', models, resolveUsers }) {
        // ── Validation ──────────────────────────────────────────────────────
        const hasUserIds = Array.isArray(userIds) && userIds.length > 0;
        const hasWorkspaceIds = Array.isArray(workspaceIds) && workspaceIds.length > 0;

        if (!hasUserIds && !hasWorkspaceIds) {
            throw new AppError('At least one of user_ids or workspace_ids must be provided', 400, 'VALIDATION_ERROR');
        }

        // ── Resolve keycloak_ids → UserMetadata.id if needed ─────────────────
        let resolvedUserIds = userIds;
        if (hasUserIds && userIdType === 'keycloak_id') {
            const { UserMetadata } = models;
            const users = await UserMetadata.findAll({
                where: { keycloak_id: { [Op.in]: userIds } },
                attributes: ['id', 'keycloak_id']
            });
            resolvedUserIds = users.map(u => u.id);
            if (resolvedUserIds.length === 0 && !hasWorkspaceIds) {
                return { members: [] };
            }
        }

        // ── Build WHERE clause ──────────────────────────────────────────────
        const where = { status: 'active' };
        if (resolvedUserIds.length > 0) where.user_id = { [Op.in]: resolvedUserIds };
        if (hasWorkspaceIds) where.workspace_id = { [Op.in]: workspaceIds };

        // ── Query WorkspaceMembership with JOINs ────────────────────────────
        const { WorkspaceMembership, UserMetadata, Workspace } = models;

        const memberships = await WorkspaceMembership.findAll({
            where,
            include: [
                {
                    model: Workspace,
                    as: 'Workspace',
                    attributes: ['id', 'name']
                },
                {
                    model: UserMetadata,
                    as: 'UserMetadata',
                    attributes: ['id', 'email', 'keycloak_id']
                }
            ],
            order: [['user_id', 'ASC']]
        });

        if (memberships.length === 0) {
            return { members: [] };
        }

        // ── Group by user ───────────────────────────────────────────────────
        const userMap = new Map(); // user_id → { meta, workspaces: [] }

        for (const m of memberships) {
            const userId = m.user_id;
            if (!userMap.has(userId)) {
                userMap.set(userId, {
                    meta: m.UserMetadata,
                    workspaces: []
                });
            }
            userMap.get(userId).workspaces.push({
                id: m.Workspace.id,
                name: m.Workspace.name,
                role: m.role
            });
        }

        // ── Resolve user names ──────────────────────────────────────────────
        // Use injected resolver if provided (future standalone mode),
        // otherwise fall back to Keycloak Admin API
        const resolverFn = resolveUsers || MemberLookupService._resolveFromKeycloak;
        const keycloakIds = [...userMap.values()].map(u => u.meta.keycloak_id);
        const nameMap = await resolverFn(keycloakIds);

        // ── Build response ──────────────────────────────────────────────────
        const members = [];
        for (const [userId, data] of userMap) {
            const kcId = data.meta.keycloak_id;
            const resolved = nameMap.get(kcId);
            const name = resolved
                ? `${resolved.firstName || ''} ${resolved.lastName || ''}`.trim()
                : data.meta.email; // fallback to email if Keycloak fails

            members.push({
                user: {
                    id: userId,
                    name: name || data.meta.email,
                    email: data.meta.email
                },
                workspaces: data.workspaces
            });
        }

        return { members };
    }

    /**
     * Default user-name resolver via Keycloak Admin API.
     * Returns Map<keycloak_id, { firstName, lastName, email }>
     * 
     * @private
     * @param {string[]} keycloakIds 
     * @returns {Promise<Map<string, Object>>}
     */
    static async _resolveFromKeycloak(keycloakIds) {
        const nameMap = new Map();
        if (!keycloakIds.length) return nameMap;

        try {
            const realm = process.env.KEYCLOAK_REALM || 'server';
            const keycloak = new KeycloakService(realm);
            await keycloak.initialize();

            // Batch resolve: fetch each user (Keycloak doesn't support bulk by ID)
            const results = await Promise.allSettled(
                keycloakIds.map(id => keycloak.getUser(id))
            );

            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    const user = result.value;
                    nameMap.set(user.id, {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email
                    });
                }
            }
        } catch (err) {
            // Non-fatal: if Keycloak is down, we still return email as fallback
            logger.warn('Failed to resolve user names from Keycloak:', err.message);
        }

        return nameMap;
    }
}

module.exports = MemberLookupService;
