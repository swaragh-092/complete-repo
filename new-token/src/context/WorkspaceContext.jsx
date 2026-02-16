/**
 * @fileoverview Workspace Context Provider
 * @description Enterprise-grade React Context for workspace state management
 * @version 1.0.0
 * 
 * Features:
 * - Centralized workspace state management
 * - Local storage persistence
 * - Automatic workspace loading
 * - Type-safe actions
 * - Error boundary integration
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@spidy092/auth-client';
import {
  getWorkspaces,
  getWorkspace,
  createWorkspace as apiCreateWorkspace,
  updateWorkspace as apiUpdateWorkspace,
  deleteWorkspace as apiDeleteWorkspace,
  getCurrentWorkspace,
  setCurrentWorkspace as persistWorkspace,
  clearCurrentWorkspace
} from '../api/workspaces';

import { useOrganization } from './OrganizationContext';


// ============================================================================
// Constants - No hardcoding, all configurable
// ============================================================================

/**
 * Workspace roles with their permission levels
 * @constant
 */
export const WORKSPACE_ROLES = Object.freeze({
  VIEWER: 'viewer',
  EDITOR: 'editor',
  ADMIN: 'admin'
});

/**
 * Role hierarchy for permission checks
 * Higher number = more permissions
 * @constant
 */
export const ROLE_HIERARCHY = Object.freeze({
  [WORKSPACE_ROLES.VIEWER]: 1,
  [WORKSPACE_ROLES.EDITOR]: 2,
  [WORKSPACE_ROLES.ADMIN]: 3
});

/**
 * Workspace status types
 * @constant
 */
export const WORKSPACE_STATUS = Object.freeze({
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted'
});

// ============================================================================
// Context Definition
// ============================================================================

const WorkspaceContext = createContext(null);

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Workspace Provider Component
 * Manages workspace state and provides context to children
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 */
export function WorkspaceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  
  const { currentOrganization } = useOrganization();
  
  
  // State
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================================
  // Storage Operations
  // ============================================================================

  /**
   * Load workspace from localStorage on mount
   * @returns {Object|null} Stored workspace or null
   */
  const loadWorkspaceFromStorage = useCallback(() => {
    try {
      const stored = getCurrentWorkspace();
      if (stored) {
        setCurrentWorkspaceState(stored);
        return stored;
      }
      return null;
    } catch (err) {
      console.error('[WorkspaceContext] Failed to load from storage:', err);
      return null;
    }
  }, []);

  /**
   * Persist workspace to localStorage
   * @param {Object} workspace - Workspace to persist
   */
  const persistWorkspaceToStorage = useCallback((workspace) => {
    try {
      persistWorkspace(workspace);
    } catch (err) {
      console.error('[WorkspaceContext] Failed to persist to storage:', err);
    }
  }, []);

  // ============================================================================
  // API Operations
  // ============================================================================

  /**
   * Fetch workspaces from backend
   * @param {string} [orgId] - Optional organization ID filter
   * @returns {Promise<Array>} List of workspaces
   */
  const fetchWorkspaces = useCallback(async (orgId = null) => {
    if (!isAuthenticated) {
      setLoading(false);
      return [];
    }

    
    const targetOrgId = orgId || currentOrganization?.id;
    if (!targetOrgId) {
      setLoading(false);
      return [];
    }
    

    setLoading(true);
    setError(null);

    try {
      
      const data = await getWorkspaces(targetOrgId);
      
      
      // Normalize workspace data
      const normalizedWorkspaces = Array.isArray(data) 
        ? data.map(normalizeWorkspace)
        : [];
      
      setWorkspaces(normalizedWorkspaces);
      console.log('[WorkspaceContext] Loaded workspaces:', normalizedWorkspaces.length);
      
      return normalizedWorkspaces;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch workspaces';
      setError(errorMessage);
      console.error('[WorkspaceContext] Fetch failed:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentOrganization]);

  /**
   * Create a new workspace
   * @param {Object} workspaceData - Workspace creation data
   * @returns {Promise<Object>} Created workspace
   */
  const createWorkspace = useCallback(async (workspaceData) => {
    setLoading(true);
    setError(null);

    try {
      
      // Ensure org_id is set
      const payload = {
        ...workspaceData,
        org_id: workspaceData.org_id || currentOrganization?.id
      };
      

      const newWorkspace = await apiCreateWorkspace(payload);
      const normalized = normalizeWorkspace(newWorkspace);

      // Update local state
      setWorkspaces(prev => [...prev, normalized]);

      // Auto-select the new workspace
      setCurrentWorkspaceState(normalized);
      persistWorkspaceToStorage(normalized);

      console.log('[WorkspaceContext] Created workspace:', normalized.name);
      return normalized;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create workspace';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, persistWorkspaceToStorage]);

  /**
   * Update an existing workspace
   * @param {string} workspaceId - Workspace ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated workspace
   */
  const updateWorkspace = useCallback(async (workspaceId, updates) => {
    setLoading(true);
    setError(null);

    try {
      const updatedWorkspace = await apiUpdateWorkspace(workspaceId, updates);
      const normalized = normalizeWorkspace(updatedWorkspace);

      // Update in local state
      setWorkspaces(prev => 
        prev.map(ws => ws.id === workspaceId ? normalized : ws)
      );

      // Update current if it's the same workspace
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspaceState(normalized);
        persistWorkspaceToStorage(normalized);
      }

      console.log('[WorkspaceContext] Updated workspace:', normalized.name);
      return normalized;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update workspace';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, persistWorkspaceToStorage]);

  /**
   * Delete a workspace
   * @param {string} workspaceId - Workspace ID to delete
   * @returns {Promise<void>}
   */
  const deleteWorkspace = useCallback(async (workspaceId) => {
    setLoading(true);
    setError(null);

    try {
      await apiDeleteWorkspace(workspaceId);

      // Remove from local state
      setWorkspaces(prev => prev.filter(ws => ws.id !== workspaceId));

      // Clear current if deleted
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspaceState(null);
        clearCurrentWorkspace();
      }

      console.log('[WorkspaceContext] Deleted workspace:', workspaceId);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete workspace';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  // ============================================================================
  // Selection Operations
  // ============================================================================

  /**
   * Select a workspace as current
   * @param {string|Object} workspaceOrId - Workspace object or ID
   * @returns {boolean} Success status
   */
  const selectWorkspace = useCallback((workspaceOrId) => {
    try {
      let workspace;
      
      if (typeof workspaceOrId === 'string') {
        workspace = workspaces.find(ws => ws.id === workspaceOrId);
      } else {
        workspace = workspaceOrId;
      }

      if (workspace) {
        setCurrentWorkspaceState(workspace);
        persistWorkspaceToStorage(workspace);
        console.log('[WorkspaceContext] Selected workspace:', workspace.name);
        return true;
      }

      console.warn('[WorkspaceContext] Workspace not found:', workspaceOrId);
      return false;
    } catch (err) {
      console.error('[WorkspaceContext] Selection failed:', err);
      return false;
    }
  }, [workspaces, persistWorkspaceToStorage]);

  /**
   * Clear current workspace selection
   */
  const clearWorkspace = useCallback(() => {
    setCurrentWorkspaceState(null);
    clearCurrentWorkspace();
    console.log('[WorkspaceContext] Cleared current workspace');
  }, []);

  // ============================================================================
  // Permission Helpers
  // ============================================================================

  /**
   * Check if user has at least the specified role
   * @param {string} requiredRole - Minimum required role
   * @returns {boolean} Has permission
   */
  const hasPermission = useCallback((requiredRole) => {
    if (!currentWorkspace?.role) return false;
    
    const userLevel = ROLE_HIERARCHY[currentWorkspace.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  }, [currentWorkspace]);

  /**
   * Check if user can edit workspace
   * @returns {boolean}
   */
  const canEdit = useMemo(() => 
    hasPermission(WORKSPACE_ROLES.EDITOR),
    [hasPermission]
  );

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  const isAdmin = useMemo(() => 
    hasPermission(WORKSPACE_ROLES.ADMIN),
    [hasPermission]
  );

  // ============================================================================
  // Effects
  // ============================================================================

  // Load from storage on mount
  useEffect(() => {
    loadWorkspaceFromStorage();
  }, [loadWorkspaceFromStorage]);

  // Fetch workspaces when authenticated and org available
  useEffect(() => {
    
    if (isAuthenticated && currentOrganization) {
      fetchWorkspaces();
    }
    
  }, [isAuthenticated, currentOrganization, fetchWorkspaces]);

  // Clear workspace when org changes
  
  useEffect(() => {
    if (currentOrganization && currentWorkspace?.org_id !== currentOrganization.id) {
      clearWorkspace();
    }
  }, [currentOrganization, currentWorkspace, clearWorkspace]);
  

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue = useMemo(() => ({
    // State
    workspaces,
    currentWorkspace,
    loading,
    error,

    // Actions
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    selectWorkspace,
    clearWorkspace,

    // Permissions
    hasPermission,
    canEdit,
    isAdmin,

    // Computed
    hasWorkspace: !!currentWorkspace,
    workspaceCount: workspaces.length,

    // Constants (for external use)
    ROLES: WORKSPACE_ROLES,
    STATUS: WORKSPACE_STATUS
  }), [
    workspaces,
    currentWorkspace,
    loading,
    error,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    selectWorkspace,
    clearWorkspace,
    hasPermission,
    canEdit,
    isAdmin
  ]);

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access workspace context
 * @returns {Object} Workspace context value
 * @throws {Error} If used outside provider
 */
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  
  if (!context) {
    throw new Error(
      'useWorkspace must be used within a WorkspaceProvider. ' +
      'Wrap your app in <WorkspaceProvider>.'
    );
  }
  
  return context;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Normalize workspace data from API
 * @param {Object} workspace - Raw workspace data
 * @returns {Object} Normalized workspace
 */
function normalizeWorkspace(workspace) {
  if (!workspace) return null;

  // Handle both direct workspace and membership wrapper
  const ws = workspace.workspace || workspace;

  return {
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    description: ws.description || '',
    org_id: ws.org_id,
    status: ws.status || WORKSPACE_STATUS.ACTIVE,
    member_count: ws.member_count || 0,
    created_at: ws.created_at,
    updated_at: ws.updated_at,
    // Role comes from membership wrapper
    role: workspace.role || ws.role || WORKSPACE_ROLES.VIEWER
  };
}

export default WorkspaceContext;
