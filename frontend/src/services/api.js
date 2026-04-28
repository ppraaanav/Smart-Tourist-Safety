import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://smart-tourist-safety-piu5.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(
      error.response?.data || {
        message: "Network error",
      }
    );
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
  savePushSubscription: (subscription) =>
    api.post("/auth/push-subscription", { subscription }),
};

// Location
export const locationAPI = {
  update: (data) => api.post("/locations/update", data),
  syncOffline: (locations) =>
    api.post("/locations/sync", { locations }),
  getHistory: (userId, params) =>
    api.get(`/locations/history/${userId}`, { params }),
  getNearby: (params) =>
    api.get("/locations/nearby", { params }),
};

// Incidents
export const incidentAPI = {
  create: (data) => api.post("/incidents", data),
  getAll: (params) => api.get("/incidents", { params }),
  getById: (id) => api.get(`/incidents/${id}`),
  update: (id, data) => api.put(`/incidents/${id}`, data),
  triggerSOS: (data) => api.post("/incidents/sos", data),
};

// Geofences
export const geofenceAPI = {
  create: (data) => api.post("/geofences", data),
  getAll: (params) => api.get("/geofences", { params }),
  getById: (id) => api.get(`/geofences/${id}`),
  update: (id, data) => api.put(`/geofences/${id}`, data),
  delete: (id) => api.delete(`/geofences/${id}`),
};

// Alerts
export const alertAPI = {
  getAll: (params) => api.get("/alerts", { params }),
  markAsRead: (id) => api.put(`/alerts/${id}/read`),
  markAllAsRead: () => api.put("/alerts/read-all"),
};

// Tourists
export const touristAPI = {
  getAll: (params) => api.get("/tourists", { params }),
  getById: (id) => api.get(`/tourists/${id}`),
  getActive: () => api.get("/tourists/active"),
  getByDTID: (dtid) => api.get(`/tourists/dtid/${dtid}`),
};

// Analytics
export const analyticsAPI = {
  getDashboard: () => api.get("/analytics/dashboard"),
  getTrends: (params) =>
    api.get("/analytics/trends", { params }),
  getHeatmap: (params) =>
    api.get("/analytics/heatmap", { params }),
  getResponseTimes: () =>
    api.get("/analytics/response-times"),
};

export default api;
