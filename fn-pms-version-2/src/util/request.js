// Author: Gururaj
// Created: 14th June 2025
// Description: Globally maintain backend request function to handle all API requests.
// Version: 1.0.0
// util/request.js
// Modified:



import { paths } from "./urls";
import { auth } from "@spidy092/auth-client";

const backendRequest = async ({ endpoint, bodyData = null, querySets = "", navigate, organizationId, }) => {
  
  try {
    if (!endpoint?.path || !endpoint?.method) {
      throw new Error("Invalid endpoint configuration");
    }

    // Get token from auth-client (stored in localStorage as "authToken")
    const token = auth.getToken();

    const jsonResponse = await fetch(endpoint.path + querySets, {
      method: endpoint.method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` }),
        ...(organizationId && { "x-organization-id": organizationId }),
      },
      credentials: "include",
      ...(bodyData && endpoint.method !=="GET" && {
        body: JSON.stringify(bodyData),
      }),
    });

    if (jsonResponse.status === 401 && typeof navigate === "function") {
      navigate(paths.logout);
    }
    
    const response = await jsonResponse.json();
    return {...response, status: jsonResponse.status, ok: jsonResponse.ok};
  } catch (err) {
    console.error("Request error:", err);
    return {
      success: false,
      message: err.message || "An error occurred while processing the request.",
    };
  }
};

export default backendRequest;