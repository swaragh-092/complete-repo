/**
 * RBAC Utilities for Role-Based Access Control
 * 
 * Provides pure functions for checking user roles and permissions.
 * Permissions use the format: "resource:action" (e.g., "users:read", "billing:manage")
 */

/**
 * Check if user has a specific role
 * @param {Object} user - User object with roles array
 * @param {string} role - Role name to check
 * @returns {boolean}
 */
export function checkRole(user, role) {
    if (!user || !role) return false;
    const roles = user.roles || [];
    const keycloakRoles = user.keycloakRoles || [];
    return roles.includes(role) || keycloakRoles.includes(role);
}

/**
 * Check if user has any of the specified roles
 * @param {Object} user - User object with roles array
 * @param {string[]} roles - Array of role names
 * @returns {boolean}
 */
export function checkAnyRole(user, roles) {
    if (!user || !roles?.length) return false;
    return roles.some((role) => checkRole(user, role));
}

/**
 * Check if user has all of the specified roles
 * @param {Object} user - User object with roles array
 * @param {string[]} roles - Array of role names
 * @returns {boolean}
 */
export function checkAllRoles(user, roles) {
    if (!user || !roles?.length) return false;
    return roles.every((role) => checkRole(user, role));
}

/**
 * Check if user has a specific permission
 * Supports both exact match and wildcard patterns:
 * - "users:read" - exact match
 * - "users:*" - any action on users resource
 * - "*:read" - read action on any resource
 * @param {Object} user - User object with permissions array
 * @param {string} permission - Permission to check (format: "resource:action")
 * @returns {boolean}
 */
export function checkPermission(user, permission) {
    if (!user || !permission) return false;
    const permissions = user.permissions || [];

    // Exact match
    if (permissions.includes(permission)) return true;

    // Check wildcard patterns
    const [resource, action] = permission.split(':');
    return permissions.some((p) => {
        const [pResource, pAction] = p.split(':');
        // Wildcard resource match (e.g., "*:read" matches "users:read")
        if (pResource === '*' && pAction === action) return true;
        // Wildcard action match (e.g., "users:*" matches "users:read")
        if (pResource === resource && pAction === '*') return true;
        // Full wildcard
        if (pResource === '*' && pAction === '*') return true;
        return false;
    });
}

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object with permissions array
 * @param {string[]} permissions - Array of permission strings
 * @returns {boolean}
 */
export function checkAnyPermission(user, permissions) {
    if (!user || !permissions?.length) return false;
    return permissions.some((perm) => checkPermission(user, perm));
}

/**
 * Check if user has all of the specified permissions
 * @param {Object} user - User object with permissions array
 * @param {string[]} permissions - Array of permission strings
 * @returns {boolean}
 */
export function checkAllPermissions(user, permissions) {
    if (!user || !permissions?.length) return false;
    return permissions.every((perm) => checkPermission(user, perm));
}

/**
 * Generic authorization check
 * Can check roles, permissions, or both based on options
 * @param {Object} user - User object
 * @param {Object} options - Authorization options
 * @param {string|string[]} [options.roles] - Required role(s)
 * @param {string|string[]} [options.permissions] - Required permission(s)
 * @param {boolean} [options.requireAll=false] - If true, require all roles/permissions
 * @returns {boolean}
 */
export function can(user, options = {}) {
    if (!user) return false;

    const { roles, permissions, requireAll = false } = options;
    const results = [];

    // Check roles if specified
    if (roles) {
        const roleList = Array.isArray(roles) ? roles : [roles];
        const hasRoles = requireAll
            ? checkAllRoles(user, roleList)
            : checkAnyRole(user, roleList);
        results.push(hasRoles);
    }

    // Check permissions if specified
    if (permissions) {
        const permList = Array.isArray(permissions) ? permissions : [permissions];
        const hasPermissions = requireAll
            ? checkAllPermissions(user, permList)
            : checkAnyPermission(user, permList);
        results.push(hasPermissions);
    }

    // If no checks specified, return true (no restrictions)
    if (results.length === 0) return true;

    // Return based on requireAll mode
    return requireAll ? results.every(Boolean) : results.some(Boolean);
}
