/**
 * @fileoverview Workspace API Helper
 * @description API functions for workspace management within organizations
 */

import { auth } from '@spidy092/auth-client';

const STORAGE_KEY = 'sso.currentWorkspace';

/**
 * Get workspaces for a specific organization
 * @param {string} orgId - Organization ID
 * @returns {Promise<Array>} List of workspaces
 */
export async function getWorkspaces(orgId) {
  try {
    const response = await auth.api.get('/workspaces', {
      params: { org_id: orgId }
    });
    // Handle ResponseHandler wrapper: { success, data: [...] }
    const data = response.data?.data || response.data;
    
    console.log('📋 Workspaces API response:', data);
    
    // Normalize response - handle both direct array and membership wrapper
    if (Array.isArray(data)) {
      return data.map(item => item.workspace || item);
    }
    
    return data.workspaces || [];
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
    throw error;
  }
}

/**
 * Create a new workspace within an organization
 * @param {Object} workspaceData - Workspace creation data
 * @param {string} workspaceData.org_id - Organization ID (required)
 * @param {string} workspaceData.name - Workspace name (required)
 * @param {string} workspaceData.slug - Workspace slug (required)
 * @param {string} [workspaceData.description] - Optional description
 * @returns {Promise<Object>} Created workspace
 */
export async function createWorkspace(workspaceData) {
  try {
    const response = await auth.api.post('/workspaces', workspaceData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Failed to create workspace:', error);
    throw error;
  }
}

/**
 * Get workspace details by ID
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Object>} Workspace details
 */
export async function getWorkspace(workspaceId) {
  try {
    const response = await auth.api.get(`/workspaces/${workspaceId}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Failed to fetch workspace:', error);
    throw error;
  }
}

/**
 * Update workspace details
 * @param {string} workspaceId - Workspace ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated workspace
 */
export async function updateWorkspace(workspaceId, updates) {
  try {
    const response = await auth.api.patch(`/workspaces/${workspaceId}`, updates);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Failed to update workspace:', error);
    throw error;
  }
}

/**
 * Delete a workspace
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<void>}
 */
export async function deleteWorkspace(workspaceId) {
  try {
    await auth.api.delete(`/workspaces/${workspaceId}`);
  } catch (error) {
    console.error('Failed to delete workspace:', error);
    throw error;
  }
}

/**
 * Get current workspace from localStorage
 * @returns {Object|null} Current workspace or null
 */
export function getCurrentWorkspace() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get current workspace:', error);
    return null;
  }
}

/**
 * Set current workspace in localStorage
 * @param {Object} workspace - Workspace to set as current
 */
export function setCurrentWorkspace(workspace) {
  try {
    if (workspace) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to set current workspace:', error);
  }
}

/**
 * Clear current workspace from localStorage
 */
export function clearCurrentWorkspace() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear current workspace:', error);
  }
}

export default {
  getWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getCurrentWorkspace,
  setCurrentWorkspace,
  clearCurrentWorkspace,
  STORAGE_KEY
};
