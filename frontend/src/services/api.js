import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
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
  async (error) => {
    const originalRequest = error.config;

    // Reject immediately if no response or if error status is not 401
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Do not attempt refresh on auth endpoints (login, register, refresh) to avoid infinite loops
    const requestUrl = originalRequest.url || "";
    if (
      requestUrl.includes("auth/login/") || 
      requestUrl.includes("auth/register/") || 
      requestUrl.includes("auth/refresh/")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      isRefreshing = false;
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    try {
      // Endpoint matches path("refresh/", TokenRefreshView.as_view()) under api/auth/
      const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, {
        refresh: refreshToken,
      });

      const newAccessToken = data.access;
      localStorage.setItem("access_token", newAccessToken);

      if (data.refresh) {
        localStorage.setItem("refresh_token", data.refresh);
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;