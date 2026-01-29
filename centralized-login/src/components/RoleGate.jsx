/**
 * RoleGate - Conditional rendering based on roles/permissions
 * 
 * Renders children only if the user has the required roles/permissions.
 * Optionally renders a fallback component when access is denied.
 * 
 * @example
 * // Show admin-only content
 * <RoleGate roles={['admin']}>
 *   <AdminPanel />
 * </RoleGate>
 * 
 * // Show with fallback
 * <RoleGate permissions={['billing:manage']} fallback={<UpgradePrompt />}>
 *   <BillingSettings />
 * </RoleGate>
 * 
 * // Require ALL permissions
 * <RoleGate permissions={['users:read', 'users:write']} requireAll>
 *   <UserEditor />
 * </RoleGate>
 */
import { useAuth } from '../hooks/useAuth';

export default function RoleGate({
  children,
  roles,
  permissions,
  requireAll = false,
  fallback = null,
  showLoading = false,
  loadingComponent = null,
}) {
  const { can, isLoading } = useAuth();

  // If loading and showLoading is true, render loading component
  if (isLoading && showLoading) {
    return loadingComponent;
  }

  // During loading without showLoading, render nothing (or fallback)
  if (isLoading) {
    return fallback;
  }

  // Check authorization
  const authorized = can({ roles, permissions, requireAll });

  if (!authorized) {
    return fallback;
  }

  return children;
}
