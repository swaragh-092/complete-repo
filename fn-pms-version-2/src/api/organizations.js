/**
 * @fileoverview Organization API Helper
 * @description API functions for organization management
 */

import { auth } from '@spidy092/auth-client';
import authConfig from '../config/authConfig';

const STORAGE_KEY = 'sso.currentOrganization';

/**
 * Get user's organizations from backend
 * @returns {Promise<Array>} List of organizations
 */
export async function getMyOrganizations() {
  try {
    const response = await auth.api.get('/account/organizations', {
       params: { model: authConfig.organizationModel }
    });
    // Handle ResponseHandler wrapper: { success, data: {...} }
    const data = response.data?.data || response.data;
    
    console.log('📋 Organizations API response:', data);
    
    // Use Map to deduplicate by ID
    const orgMap = new Map();
    
    // Add primary organization first (if exists)
    if (data.primary_organization) {
      orgMap.set(data.primary_organization.id, {
        ...data.primary_organization,
        isPrimary: true
      });
    }
    
    // Add memberships - skip if already exists (primary takes precedence)
    if (data.memberships && Array.isArray(data.memberships)) {
      data.memberships.forEach(membership => {
        const orgId = membership.organization?.id || membership.id;
        if (!orgMap.has(orgId)) {
          orgMap.set(orgId, {
            id: orgId,
            name: membership.organization?.name || membership.name,
            tenant_id: membership.organization?.tenant_id,
            role: membership.role,
            isPrimary: false,
            membership_type: membership.membership_type || 'member'
          });
        } else {
          // Update existing with role info if it was the primary
          const existing = orgMap.get(orgId);
          if (!existing.role) {
            existing.role = membership.role;
          }
        }
      });
    }
    
    // Also support legacy member_organizations key
    if (data.member_organizations && Array.isArray(data.member_organizations)) {
      data.member_organizations.forEach(org => {
        if (!orgMap.has(org.id)) {
          orgMap.set(org.id, { ...org, isPrimary: false });
        }
      });
    }
    
    // Also support direct array response
    if (Array.isArray(data)) {
      return data;
    }
    
    const organizations = Array.from(orgMap.values());
    console.log('📋 Normalized organizations:', organizations);
    return organizations;
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    throw error;
  }
}

/**
 * Create a new organization
 * @param {string} name - Organization name
 * @returns {Promise<Object>} Created organization
 */
export async function createOrganization(name) {
  try {
    const response = await auth.api.post('/organizations', {
      name: name.trim()
    });
    
    return response.data.organization || response.data;
  } catch (error) {
    console.error('Failed to create organization:', error);
    throw error;
  }
}

/**
 * Get current organization from localStorage
 * @returns {Object|null} Current organization or null
 */
export function getCurrentOrganization() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get current organization:', error);
    return null;
  }
}

/**
 * Set current organization in localStorage
 * @param {Object} org - Organization to set as current
 */
export function setCurrentOrganization(org) {
  try {
    if (org) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(org));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to set current organization:', error);
  }
}

/**
 * Clear current organization from localStorage
 */
export function clearCurrentOrganization() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear current organization:', error);
  }
}

export default {
  getMyOrganizations,
  createOrganization,
  getCurrentOrganization,
  setCurrentOrganization,
  clearCurrentOrganization,
  STORAGE_KEY
};
