import axios from "axios";

import { getApiBaseUrl } from "./apiBase";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/authToken";

const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    // Don't attempt refresh for the refresh call itself.
    const url = String(originalRequest?.url || "");
    const isRefreshCall = url.includes("/auth/refresh");

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshCall
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await api.post("/auth/refresh", null, {
          withCredentials: true,
        });

        const newToken = refreshResponse?.data?.token;
        if (newToken) {
          setAuthToken(newToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return api(originalRequest);
      } catch (_refreshError) {
        clearAuthToken();
        window.location.href = "/login";
        return Promise.reject(_refreshError);
      }
    }

    if (status === 401) {
      clearAuthToken();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
