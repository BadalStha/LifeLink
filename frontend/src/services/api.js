// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper to handle API errors
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }
  return response.json();
};

// Helper to make authenticated requests
const authFetch = (url, options = {}) => {
  const token = getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
};

// Auth APIs
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  getProfile: async () => {
    const response = await authFetch(`${API_BASE_URL}/api/profile`);
    return handleResponse(response);
  },

  updateProfile: async (profileData) => {
    const response = await authFetch(`${API_BASE_URL}/api/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },
};

// Donation Requests APIs
export const requestsAPI = {
  create: async (requestData) => {
    const response = await authFetch(`${API_BASE_URL}/api/requests`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  },

  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/api/requests?${params}`);
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/requests/${id}`);
    return handleResponse(response);
  },

  update: async (id, updateData) => {
    const response = await authFetch(`${API_BASE_URL}/api/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/api/requests/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  getMyRequests: async () => {
    const response = await authFetch(`${API_BASE_URL}/api/user/my-requests`);
    return handleResponse(response);
  },
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
    return handleResponse(response);
  },

  getUsers: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/api/dashboard/users?${params}`);
    return handleResponse(response);
  },
};

// Alerts APIs
export const alertsAPI = {
  create: async (alertData) => {
    const response = await authFetch(`${API_BASE_URL}/api/alerts`, {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
    return handleResponse(response);
  },

  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/api/alerts?${params}`);
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/api/alerts/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Users search API
export const usersAPI = {
  search: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/api/search?${params}`);
    return handleResponse(response);
  },

  getById: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`);
    return handleResponse(response);
  },
};

export default {
  auth: authAPI,
  requests: requestsAPI,
  dashboard: dashboardAPI,
  alerts: alertsAPI,
  users: usersAPI,
};
