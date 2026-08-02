// frontend/src/lib/axios.ts
import axios, { InternalAxiosRequestConfig } from "axios";
import { getToken, setToken, removeToken } from "./auth";

// Create an Axios instance with base URL from environment
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// ─── Request Interceptor ──────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ─── Response Interceptor ──────────────────────────────────────────────
// Define queue item type
type QueueItem = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    // If it's not an Axios error or not a 401, reject immediately
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If not a 401 or already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If we're already refreshing, queue this request
    if (isRefreshing) {
      return new Promise<unknown>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        { refresh_token: refreshToken },
      );

      const { access_token, refresh_token } = response.data;

      // Save new tokens
      setToken(access_token);
      localStorage.setItem("refresh_token", refresh_token);

      // Retry the original request with the new token
      originalRequest.headers.Authorization = `Bearer ${access_token}`;

      // Process queued requests
      processQueue(null, access_token);

      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed – logout user
      removeToken();
      localStorage.removeItem("refresh_token");
      processQueue(refreshError, null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
