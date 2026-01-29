import { createContext, useContext, useEffect, useState } from 'react';

import { auth } from '@spidy092/auth-client';
import '../config/authConfig'; // Import config to ensure auth client is initialized

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize state synchronously to prevent flash of content
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = auth.getToken();
    return !!(token && !auth.isTokenExpired(token));
  });

  // Track loading state during initial check
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check auth state on mount (handles callback redirect scenario)
    const checkAuth = () => {
      const token = auth.getToken();
      const authenticated = !!(token && !auth.isTokenExpired(token));
      setIsAuthenticated(authenticated);
    };

    // Initial check
    checkAuth();

    // Listen for token changes from auth library
    const cleanup = auth.addTokenListener((newToken) => {
      const authenticated = !!(newToken && !auth.isTokenExpired(newToken));
      setIsAuthenticated(authenticated);
    });

    // Also listen for storage events (cross-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === 'access_token' || e.key === null) {
        checkAuth();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      cleanup();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
