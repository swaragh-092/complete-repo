/**
 * useAuth hook - Access auth context
 * 
 * @example
 * const { isAuthenticated, user, hasRole, hasPermission, can } = useAuth();
 * 
 * @returns {Object} Auth context with user data and RBAC functions
 */
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
