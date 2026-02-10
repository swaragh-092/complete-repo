// Author: Gururaj
// Created: 14th June 2025
// Description: Globally maintain backend request function to handle all API requests.
// Version: 1.0.0
// util/request.js
// Modified:

import { paths } from "./urls";

const backendRequest = async ({ endpoint, bodyData = null, querySets = "", navigate }) => {
  try {
    if (!endpoint?.path || !endpoint?.method) {
      throw new Error("Invalid endpoint configuration");
    }

    const jsonResponse = await fetch(endpoint.path + querySets, {
      method: endpoint.method,
      headers: { "Content-Type": "application/json" },
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