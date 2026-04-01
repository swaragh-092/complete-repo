// Author: Copilot
// Created: 18th Mar 2026
// Description: Global Axios Instance
// Version: 1.2.0

import axios from "axios";
import { auth } from "@spidy092/auth-client";

// Create Axios Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000,
});

// Request Interceptor — use same auth as backendRequest
api.interceptors.request.use(
  (config) => {
    const token = auth.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data, // Unwrap data
  (error) => {
    // Standardize error
    const message = error.response?.data?.message || "An unexpected error occurred.";
    const status = error.response?.status;

    // Log
    console.warn(`API Error [${status}]:`, message);

    if (status === 401) {
      // Logic handled by Auth Context usually (redirect to login)
    }

    // Return rejected promise with standardized format
    return Promise.reject({
      status,
      message,
      data: error.response?.data,
    });
  },
);

export default api;
