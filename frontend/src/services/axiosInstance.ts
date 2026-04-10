// ============================================================
// frontend/src/services/axiosInstance.ts  — AUTO DISCOVERY
// FIX 1: Uses backend discovery service to find backend URL
// FIX 2: Reads token from localStorage
// FIX 3: 401 handler clears storage AND redirects
// ============================================================

import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { getBackendUrl } from "./backendDiscovery";

// Get the backend URL (auto-discovered or from env)
const API_BASE_URL = getBackendUrl();

console.log(`📡 Axios using backend URL: ${API_BASE_URL}`);

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every outgoing request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored credentials
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Show toast before redirect
      toast({
        title: "Session expired",
        description: "Please log in again.",
        variant: "destructive",
      });
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
