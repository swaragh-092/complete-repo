/**
 * ProtectedRoute - RBAC-enabled route protection component
 * 
 * Provides authentication and optional role/permission-based access control.
 * Backward compatible: without roles/permissions props, only checks authentication.
 * 
 * @example
 * // Auth-only (backward compatible)
 * <ProtectedRoute><Dashboard /></ProtectedRoute>
 * 
 * // Require specific role
 * <ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>
 * 
 * // Require specific permission
 * <ProtectedRoute permissions={['users:read']}><UserList /></ProtectedRoute>
 * 
 * // Require ALL roles (default is ANY)
 * <ProtectedRoute roles={['admin', 'moderator']} requireAll><ModTools /></ProtectedRoute>
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({
  children,
  roles,
  permissions,
  requireAll = false,
  unauthorizedRedirect = '/login',
  forbiddenRedirect = '/dashboard',
  loadingComponent = <LoadingSpinner message="Checking access…" />,
}) {
  const location = useLocation();
  const { isLoading, isAuthenticated, can } = useAuth(); // Use centralized state

  // 1. Wait for auth check to complete
  if (isLoading) {
    return loadingComponent;
  }

  // 2. Check authentication
  if (!isAuthenticated) {
    return <Navigate to={unauthorizedRedirect} state={{ from: location }} replace />;
  }

  // If we have RBAC requirements
  const hasRbacRequirements = roles?.length > 0 || permissions?.length > 0;
  
  // Loading is already handled above

  // Check RBAC if requirements are specified
  if (hasRbacRequirements) {
    const authorized = can({ roles, permissions, requireAll });
    
    if (!authorized) {
      // User is authenticated but not authorized - redirect to forbidden page
      return <Navigate to={forbiddenRedirect} state={{ from: location, reason: 'forbidden' }} replace />;
    }
  }

  return children;
}
