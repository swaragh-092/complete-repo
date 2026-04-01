// Author: Gururaj
// Created: 19th Jun 2025
// Description: Custom hook wrapping the backendRequest utility with loading and error state management.
// Version: 1.0.0
// Modified:

import { useOrganization } from "../context/OrganizationContext";
// import { useNavigate } from "react-router-dom";
import backendRequest from "../util/request";

export const useBackendRequest = () => {
  const { currentOrganization } = useOrganization();
//   const navigate = useNavigate();

  const request = (config) => {
    return backendRequest({
      ...config,
    //   navigate,
      organizationId: currentOrganization?.id,
    });
  };

  return request;
};
