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
