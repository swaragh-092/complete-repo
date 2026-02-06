#!/usr/bin/env node
/**
 * sync-rbac.js - Idempotent RBAC Sync Script
 * 
 * PURPOSE: Sync permissions and system roles from rbac-definitions.json to the database.
 * This ensures "Code as Truth" - developers add permissions in JSON, script syncs to DB.
 * 
 * USAGE:
 *   node scripts/sync-rbac.js
 *   npm run sync-rbac
 * 
 * SAFETY:
 *   - Uses upsert (findOrCreate + update) - safe to run multiple times
 *   - Does NOT delete existing custom roles (only syncs system roles)
 *   - Logs all changes for audit trail
 */

require('dotenv').config();
const path = require('path');
const { Role, Permission, RolePermission, sequelize } = require('../config/database');

const DEFINITIONS_PATH = path.join(__dirname, '..', 'config', 'rbac-definitions.json');

async function syncRBAC() {
    console.log('🔄 Starting RBAC Sync...\n');

    let definitions;
    try {
        definitions = require(DEFINITIONS_PATH);
        console.log(`📄 Loaded definitions v${definitions.version}`);
    } catch (error) {
        console.error('❌ Failed to load rbac-definitions.json:', error.message);
        process.exit(1);
    }

    const stats = {
        permissionsCreated: 0,
        permissionsUpdated: 0,
        rolesCreated: 0,
        rolesUpdated: 0,
        assignmentsCreated: 0
    };

    const transaction = await sequelize.transaction();

    try {
        // =========================================================================
        // PHASE 1: Sync Permissions
        // =========================================================================
        console.log('\n📋 PHASE 1: Syncing Permissions...');

        const permissionMap = new Map(); // name -> Permission instance

        for (const permDef of definitions.permissions) {
            const [permission, created] = await Permission.findOrCreate({
                where: { name: permDef.name },
                defaults: {
                    description: permDef.description,
                    resource: permDef.resource,
                    action: permDef.action,
                    is_system: permDef.is_system || false,
                    client_id: permDef.client_id || null
                },
                transaction
            });

            if (created) {
                stats.permissionsCreated++;
                console.log(`  ✅ Created permission: ${permDef.name}`);
            } else {
                // Update existing permission if description changed
                if (permission.description !== permDef.description) {
                    await permission.update({ description: permDef.description }, { transaction });
                    stats.permissionsUpdated++;
                    console.log(`  🔄 Updated permission: ${permDef.name}`);
                }
            }

            permissionMap.set(permDef.name, permission);
        }

        // =========================================================================
        // PHASE 2: Sync System Roles
        // =========================================================================
        console.log('\n👤 PHASE 2: Syncing System Roles...');

        for (const [roleName, roleDef] of Object.entries(definitions.system_roles)) {
            const [role, created] = await Role.findOrCreate({
                where: { name: roleName },
                defaults: {
                    description: roleDef.description,
                    is_system: roleDef.is_system || true,
                    client_id: roleDef.client_id || null
                },
                transaction
            });

            if (created) {
                stats.rolesCreated++;
                console.log(`  ✅ Created role: ${roleName}`);
            } else {
                // Update existing role if description changed
                if (role.description !== roleDef.description || role.client_id !== roleDef.client_id) {
                    await role.update({
                        description: roleDef.description,
                        client_id: roleDef.client_id || null
                    }, { transaction });
                    stats.rolesUpdated++;
                    console.log(`  🔄 Updated role: ${roleName}`);
                }
            }

            // =========================================================================
            // PHASE 3: Sync Role-Permission Assignments
            // =========================================================================
            // Handle wildcard permission (*:*:*) for super_admin
            if (roleDef.permissions.includes('*:*:*')) {
                // Assign ALL permissions to this role
                for (const permission of permissionMap.values()) {
                    const [assignment, wasCreated] = await RolePermission.findOrCreate({
                        where: {
                            role_id: role.id,
                            permission_id: permission.id
                        },
                        defaults: {
                            role_id: role.id,
                            permission_id: permission.id
                        },
                        transaction
                    });
                    if (wasCreated) stats.assignmentsCreated++;
                }
            } else {
                // Assign specific permissions
                for (const permName of roleDef.permissions) {
                    const permission = permissionMap.get(permName);
                    if (!permission) {
                        console.warn(`  ⚠️  Permission "${permName}" not found for role "${roleName}"`);
                        continue;
                    }

                    const [assignment, wasCreated] = await RolePermission.findOrCreate({
                        where: {
                            role_id: role.id,
                            permission_id: permission.id
                        },
                        defaults: {
                            role_id: role.id,
                            permission_id: permission.id
                        },
                        transaction
                    });
                    if (wasCreated) stats.assignmentsCreated++;
                }
            }
        }

        await transaction.commit();

        // =========================================================================
        // Summary
        // =========================================================================
        console.log('\n' + '='.repeat(50));
        console.log('🎉 RBAC Sync Complete!');
        console.log('='.repeat(50));
        console.log(`  Permissions Created: ${stats.permissionsCreated}`);
        console.log(`  Permissions Updated: ${stats.permissionsUpdated}`);
        console.log(`  Roles Created:       ${stats.rolesCreated}`);
        console.log(`  Roles Updated:       ${stats.rolesUpdated}`);
        console.log(`  Assignments Created: ${stats.assignmentsCreated}`);
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        await transaction.rollback();
        console.error('\n❌ RBAC Sync Failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    syncRBAC()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = { syncRBAC };
