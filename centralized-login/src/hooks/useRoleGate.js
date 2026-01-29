/**
 * useRoleGate - Hook version for programmatic access control checks
 * 
 * @example
 * const { authorized, isLoading } = useRoleGate({
 *   roles: ['admin'],
 *   permissions: ['users:manage'],
 * });
 * 
 * if (authorized) {
 *   // Show admin controls
 * }
 */
import { useAuth } from '../context/AuthContext';

export function useRoleGate({ roles, permissions, requireAll = false }) {
    const { can, isLoading } = useAuth();
    const authorized = can({ roles, permissions, requireAll });

    return { authorized, isLoading };
}
