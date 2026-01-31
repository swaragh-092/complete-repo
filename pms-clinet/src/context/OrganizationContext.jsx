/**
 * @fileoverview Organization Context Provider
 * @description React Context for organization state management
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@spidy092/auth-client';
import {
  getMyOrganizations,
  createOrganization as apiCreateOrganization,
  getCurrentOrganization,
  setCurrentOrganization as persistOrganization,
  clearCurrentOrganization
} from '../api/organizations';

const OrganizationContext = createContext(null);

/**
 * Organization Provider Component
 * Manages organization state and provides context to children
 */
export function OrganizationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganizationState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load organization from localStorage on mount
   */
  const loadOrganizationFromStorage = useCallback(() => {
    const stored = getCurrentOrganization();
    if (stored) {
      setCurrentOrganizationState(stored);
    }
  }, []);

  /**
   * Persist organization to localStorage
   */
  const persistOrganizationToStorage = useCallback((org) => {
    persistOrganization(org);
  }, []);

  /**
   * Fetch organizations from backend
   */
  const fetchOrganizations = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const orgs = await getMyOrganizations();
      setOrganizations(orgs);
      return orgs;
    } catch (err) {
      setError(err.message || 'Failed to fetch organizations');
      console.error('Fetch organizations failed:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Create a new organization
   */
  const createOrganization = useCallback(async (name) => {
    setLoading(true);
    setError(null);
    
    try {
      const newOrg = await apiCreateOrganization(name);
      
      // Add to local state
      setOrganizations(prev => [...prev, newOrg]);
      
      // Auto-select the new organization
      setCurrentOrganizationState(newOrg);
      persistOrganizationToStorage(newOrg);
      
      return newOrg;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create organization');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [persistOrganizationToStorage]);

  /**
   * Switch to a different organization
   */
  const switchOrganization = useCallback((orgId) => {
    const org = organizations.find(o => o.id === orgId || o.org_id === orgId);
    if (org) {
      setCurrentOrganizationState(org);
      persistOrganizationToStorage(org);
      return true;
    }
    return false;
  }, [organizations, persistOrganizationToStorage]);

  /**
   * Clear current organization
   */
  const clearOrganization = useCallback(() => {
    setCurrentOrganizationState(null);
    clearCurrentOrganization();
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    loadOrganizationFromStorage();
  }, [loadOrganizationFromStorage]);

  /**
   * Fetch organizations when authenticated
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrganizations();
    }
  }, [isAuthenticated, fetchOrganizations]);

  const value = {
    // State
    organizations,
    currentOrganization,
    loading,
    error,
    
    // Actions
    fetchOrganizations,
    createOrganization,
    switchOrganization,
    clearOrganization,
    loadOrganizationFromStorage,
    persistOrganizationToStorage,
    
    // Computed
    hasOrganization: !!currentOrganization,
    organizationCount: organizations.length
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

/**
 * Hook to use organization context
 * @returns {Object} Organization context value
 */
export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}

export default OrganizationContext;
