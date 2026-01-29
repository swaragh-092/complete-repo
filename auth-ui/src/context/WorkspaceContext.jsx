import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import workspaceService from '../services/workspaceService';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // State for user selection
  const [currentWorkspace, setCurrentWorkspace] = useState(null);

  // Fetch workspaces
  const { 
    data: workspaces = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspaceService.getAll(),
    enabled: isAuthenticated, // Only fetch if logged in
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Restore selection from localStorage or default to first available
  useEffect(() => {
    if (workspaces.length > 0) {
      const savedId = localStorage.getItem('selected_workspace_id');
      const found = workspaces.find(w => w.workspace.id === savedId);
      
      if (found) {
        setCurrentWorkspace(found);
      } else if (!currentWorkspace) {
        // Default to first one if nothing selected or saved one not found
        setCurrentWorkspace(workspaces[0]);
      }
    } else {
      setCurrentWorkspace(null);
    }
  }, [workspaces]);

  // Persist selection
  const selectWorkspace = (workspaceMembership) => {
    setCurrentWorkspace(workspaceMembership);
    if (workspaceMembership) {
        localStorage.setItem('selected_workspace_id', workspaceMembership.workspace.id);
    } else {
        localStorage.removeItem('selected_workspace_id');
    }
  };

  const createWorkspace = async (data) => {
      const result = await workspaceService.create(data);
      queryClient.invalidateQueries(['workspaces']);
      return result;
  }

  const value = {
    workspaces,
    currentWorkspace,
    selectWorkspace,
    createWorkspace,
    isLoading,
    error,
    refreshWorkspaces: refetch
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
