import { createContext, useMemo, useCallback, useState, useEffect } from 'react';
import { auth } from '@spidy092/auth-client';
import { useProfile } from '../hooks/useProfile';
import {
  checkRole,
  checkAnyRole,
  checkAllRoles,
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  can as canUtil,
} from '../utils/rbac';

export const AuthContext = createContext(null);

/**
 * AuthProvider - Provides centralized authentication and RBAC context
 * 
 * Integrates with @spidy092/auth-client for auth state and useProfile for user data.
 * Exposes role/permission checking functions for RBAC.
 */
export function AuthProvider({ children }) {
  // 1. Initialize state based on synchronous token check
  // 'checking' is skipped because we check synchronously on mount
  const [hasToken, setHasToken] = useState(() => auth.isAuthenticated());
  
  // 2. Fetch profile only if strict token check passes
  const { 
    data: user, 
    isPending: isProfileLoading, 
    isError: isProfileError, 
    error: profileError, 
    refetch 
  } = useProfile({ 
    enabled: hasToken,
    retry: false, // Fail fast on 401
    staleTime: 5 * 60 * 1000 // Cache profile for 5 mins
  });

  // 3. Effect: Handle Token Invalidated (e.g. 401 from API)
  useEffect(() => {
    if (isProfileError && hasToken) {
      console.warn('[AuthContext] Profile fetch failed with token, logging out...');
      auth.logout();
      setHasToken(false);
    }
  }, [isProfileError, hasToken]);

  // 4. Effect: Listen for external logout (e.g. from other tabs or direct auth calls)
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Check if token was removed
      if (!auth.isAuthenticated() && hasToken) {
         setHasToken(false);
      }
      // Check if token was added (login in other tab - unlikely for SPA but good safety)
      else if (auth.isAuthenticated() && !hasToken) {
         setHasToken(true);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [hasToken]);

  // 5. Derive Strict Auth Status
  const status = useMemo(() => {
    if (!hasToken) return 'unauthenticated';
    if (isProfileLoading) return 'validating';
    if (isProfileError) return 'unauthenticated';
    if (user) return 'authenticated';
    return 'checking'; // Should not happen often implies hasToken + !loading + !error + !user
  }, [hasToken, isProfileLoading, isProfileError, user]);

  // RBAC Memoized Checks
  const hasRole = useCallback((role) => checkRole(user, role), [user]);
  const hasAnyRole = useCallback((roles) => checkAnyRole(user, roles), [user]);
  const hasAllRoles = useCallback((roles) => checkAllRoles(user, roles), [user]);
  
  const hasPermission = useCallback((permission) => checkPermission(user, permission), [user]);
  const hasAnyPermission = useCallback((permissions) => checkAnyPermission(user, permissions), [user]);
  const hasAllPermissions = useCallback((permissions) => checkAllPermissions(user, permissions), [user]);

  const can = useCallback((options) => canUtil(user, options), [user]);

  // Context Actions
  const login = useCallback((...args) => {
    auth.login(...args);
    // State update happens on redirect or manual set
  }, []);

  const logout = useCallback(() => {
    auth.logout();
    setHasToken(false);
  }, []);

  const checkAuth = useCallback(() => {
    setHasToken(auth.isAuthenticated());
  }, []);

  const value = useMemo(
    () => ({
      // Strict State
      status, 
      
      // Backward Compatibility / Derived State
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'validating' || status === 'checking',
      isError: isProfileError,
      error: profileError,
      
      // Data & Actions
      user,
      refetch,
      login,
      logout,
      checkAuth,

      // RBAC
      hasRole,
      hasAnyRole,
      hasAllRoles,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      can,
    }),
    [
      status,
      isProfileError,
      profileError,
      user,
      refetch,
      login,
      logout,
      checkAuth,
      hasRole,
      hasAnyRole,
      hasAllRoles,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      can,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
