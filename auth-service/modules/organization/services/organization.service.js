'use strict';

const {
    Organization,
    OrganizationMembership,
    UserMetadata,
    Role,
    Client,
    TenantMapping,
    sequelize
} = require('../../../config/database');
const { Op } = require('sequelize');
const { AppError } = require('../../../middleware/errorHandler');
const logger = require('../../../utils/logger');
const { loadClients } = require('../../../config');

class OrganizationService {

    /**
     * Generate a truly unique tenant ID from an organization name
     */
    static async generateUniqueTenantId(orgName) {
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            // Create a unique ID
            const baseId = orgName.toLowerCase()
                .replace(/[^a-z0-9]/g, '')
                .substring(0, 15);  // Shorter base

            const timestamp = Date.now().toString(36);  // Base-36 timestamp
            const random = Math.random().toString(36).substring(2, 8);  // 6 random chars

            const candidateTenantId = `${baseId}-${timestamp}-${random}`;

            // Check if this tenant_id already exists
            const existing = await Organization.findOne({
                where: { tenant_id: candidateTenantId }
            });

            if (!existing) {
                logger.info(`✓ Generated unique tenant_id: ${candidateTenantId}`);
                return candidateTenantId;
            }

            logger.warn(`⚠️ tenant_id collision detected, retrying... (attempt ${attempts + 1})`);
            attempts++;
        }

        // Fallback: use UUID if all attempts fail
        const uuid = require('uuid').v4();
        const fallbackId = `${orgName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10)}-${uuid}`;
        logger.info(`✓ Using fallback tenant_id: ${fallbackId}`);
        return fallbackId;
    }

    /**
     * Create a new organization, setup roles, and assign owner
     */
    static async createOrganization(data) {
        const { name, description, settings, user, client_key, isProvision = false } = data;
        const transaction = await sequelize.transaction();

        try {
            // 1. Check if organization name already exists
            const existingOrg = await Organization.findOne({
                where: {
                    name: {
                        [Op.iLike]: name
                    }
                },
                transaction
            });

            if (existingOrg) {
                await transaction.rollback();
                throw new AppError(`Organization name '${name}' is already taken`, 409, 'CONFLICT');
            }

            // 2. Generate unique tenant ID
            const tenantId = await this.generateUniqueTenantId(name);

            // 3. Check if user metadata exists
            let userMetadata = await UserMetadata.findOne({
                where: { keycloak_id: user.keycloak_id },
                transaction
            });

            if (!userMetadata) {
                userMetadata = await UserMetadata.create({
                    keycloak_id: user.keycloak_id,
                    email: user.email,
                    is_active: true,
                    last_login: new Date()
                }, { transaction });
            }

            // 4. Create Organization
            const newOrganization = await Organization.create({
                name: name.trim(),
                tenant_id: tenantId,
                description: description?.trim() || null,
                status: 'active',
                provisioned: isProvision,
                settings: settings || {
                    created_by: userMetadata.id,
                    created_via: isProvision ? 'admin_provision' : 'self_service',
                    email_domain: user.email.split('@')[1],
                    initial_member_count: 1,
                    client_key: client_key
                }
            }, { transaction });

            // 5. Setup Owner Role
            let ownerRole = await Role.findOne({
                where: { name: 'Owner' },
                transaction
            });

            if (!ownerRole) {
                ownerRole = await Role.create({
                    name: 'Owner',
                    description: 'Organization owner with full administrative rights',
                    permissions: JSON.stringify([
                        'org:delete',
                        'org:update',
                        'members:invite',
                        'members:remove',
                        'members:update_roles',
                        'settings:update',
                        'billing:manage'
                    ])
                }, { transaction });
            }

            // 6. Create Membership linking Owner to Org
            const membership = await OrganizationMembership.create({
                user_id: userMetadata.id,
                org_id: newOrganization.id,
                role_id: ownerRole.id,
                status: 'active',
                is_primary: !userMetadata.org_id,
                joined_at: new Date()
            }, { transaction });

            // 7. Update User's primary org if not set
            if (!userMetadata.org_id) {
                await userMetadata.update({
                    org_id: newOrganization.id,
                    primary_org_id: newOrganization.id
                }, { transaction });
            }

            // 8. Setup Tenant Mapping (Important for multi-tenant support)
            if (client_key) {
                await TenantMapping.upsert({
                    user_id: user.keycloak_id,
                    tenant_id: tenantId,
                    client_key: client_key
                }, { transaction });
            }

            await transaction.commit();

            return {
                organization: newOrganization,
                membership,
                tenantId,
                ownerRole
            };

        } catch (error) {
            await transaction.rollback();
            logger.error('Organization creation failed', {
                error: error.message,
                stack: error.stack,
                userName: user.email,
                orgName: name
            });
            throw error;
        }
    }

}

module.exports = OrganizationService;
