// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

const getAdminToken = () => {
  return localStorage.getItem('adminToken');
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

const adminFetch = (url, options = {}) => {
  const token = getAdminToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
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

  uploadAvatar: async (file) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Do NOT set Content-Type — browser must set multipart boundary automatically
      },
      body: formData,
    });
    return handleResponse(response);
  },

  requestResetCode: async (name, email) => {
    const response = await fetch(`${API_BASE_URL}/api/forgot-password/request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    return handleResponse(response);
  },

  verifyResetCode: async (email, code) => {
    const response = await fetch(`${API_BASE_URL}/api/forgot-password/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    return handleResponse(response);
  },

  resetPassword: async (reset_token, new_password) => {
    const response = await fetch(`${API_BASE_URL}/api/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset_token, new_password }),
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

// Messages APIs
export const messagesAPI = {
  getConversations: async () => {
    const response = await authFetch(`${API_BASE_URL}/api/messages/conversations`);
    return handleResponse(response);
  },

  getMessages: async (userId, limit = 50, offset = 0) => {
    const response = await authFetch(`${API_BASE_URL}/api/messages/${userId}?limit=${limit}&offset=${offset}`);
    return handleResponse(response);
  },

  sendMessage: async (recipient_id, content) => {
    const response = await authFetch(`${API_BASE_URL}/api/messages`, {
      method: 'POST',
      body: JSON.stringify({ recipient_id, content }),
    });
    return handleResponse(response);
  },
};

// Announcements API (public)
export const announcementsAPI = {
  getPublished: async (limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/api/announcements?limit=${limit}`);
    return handleResponse(response);
  },
};

// Users search API
export const usersAPI = {
  search: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await authFetch(`${API_BASE_URL}/api/search?${params}`);
    return handleResponse(response);
  },

  getById: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`);
    return handleResponse(response);
  },

  getStats: async () => {
    const response = await authFetch(`${API_BASE_URL}/api/user/stats`);
    return handleResponse(response);
  },

  getDonationHistory: async (limit = 10) => {
    const response = await authFetch(`${API_BASE_URL}/api/user/donation-history?limit=${limit}`);
    return handleResponse(response);
  },
};

export const notificationsAPI = {
  getMyNotifications: async (limit = 20) => {
    const response = await authFetch(`${API_BASE_URL}/api/user/notifications?limit=${limit}`);
    return handleResponse(response);
  },
};

// Donors APIs
export const donorsAPI = {
  getLocations: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/api/donors/locations?${params}`);
    return handleResponse(response);
  },
};

export const adminAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  getOverview: async () => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/overview`);
    return handleResponse(response);
  },

  getUsers: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await adminFetch(`${API_BASE_URL}/api/admin/users?${params}`);
    return handleResponse(response);
  },

  getUserProfile: async (id) => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/users/${id}/profile`);
    return handleResponse(response);
  },

  updateUserVerification: async (id, payload) => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/users/${id}/verification`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  updateUserAccountStatus: async (id, is_active) => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/users/${id}/account-status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    });
    return handleResponse(response);
  },

  getRequests: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await adminFetch(`${API_BASE_URL}/api/admin/requests?${params}`);
    return handleResponse(response);
  },

  updateRequestStatus: async (id, status) => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  matchDonor: async (id, donor_id) => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/requests/${id}/match`, {
      method: 'POST',
      body: JSON.stringify({ donor_id }),
    });
    return handleResponse(response);
  },

  getHospitals: async () => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/hospitals`);
    return handleResponse(response);
  },

  updateHospitalStatus: async (id, is_active) => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/hospitals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    });
    return handleResponse(response);
  },

  updateHospital: async (id, payload) => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/hospitals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  createHospital: async (payload) => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/hospitals`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  sendBroadcast: async (payload) => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/broadcast`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  getTemplates: async () => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/notification-templates`);
    return handleResponse(response);
  },

  saveTemplate: async (templateKey, payload) => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/notification-templates/${templateKey}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  getNotificationLogs: async () => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/notification-logs`);
    return handleResponse(response);
  },

  getAnnouncements: async () => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/announcements`);
    return handleResponse(response);
  },

  createAnnouncement: async (payload) => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/announcements`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  deleteAnnouncement: async (id) => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/announcements/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  getSettings: async () => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/settings`);
    return handleResponse(response);
  },

  updateSettings: async (settings) => {
    const response = await adminFetch(`${API_BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
    return handleResponse(response);
  },

  exportReport: async (type) => {
    const params = new URLSearchParams({ type });
    const response = await adminFetch(`${API_BASE_URL}/api/admin/reports/export?${params}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
      throw new Error(errorData.error || 'Export failed');
    }
    return response.text();
  },
};

const getHospitalToken = () => localStorage.getItem('hospitalToken');

const hospitalFetch = (url, options = {}) => {
  const token = getHospitalToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
};

export const hospitalAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);
    if (data.user?.role !== 'hospital') {
      throw new Error('This account does not have hospital access');
    }
    return data;
  },

  getProfile: async () => {
    const response = await hospitalFetch(`${API_BASE_URL}/api/profile`);
    return handleResponse(response);
  },

  createAnnouncement: async (payload) => {
    const response = await hospitalFetch(`${API_BASE_URL}/api/announcements`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  getAnnouncements: async (limit = 10, offset = 0) => {
    const response = await hospitalFetch(
      `${API_BASE_URL}/api/hospital/announcements?limit=${limit}&offset=${offset}`
    );
    return handleResponse(response);
  },

  deleteAnnouncement: async (id) => {
    const response = await hospitalFetch(`${API_BASE_URL}/api/announcements/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  getStats: async () => {
    const response = await hospitalFetch(`${API_BASE_URL}/api/hospital/stats`);
    return handleResponse(response);
  },

  getRequests: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await hospitalFetch(
      `${API_BASE_URL}/api/hospital/requests?${params}`
    );
    return handleResponse(response);
  },

  createCampaign: async (payload) => {
    const response = await hospitalFetch(`${API_BASE_URL}/api/hospital/campaigns`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  getCampaigns: async () => {
    const response = await hospitalFetch(`${API_BASE_URL}/api/hospital/campaigns`);
    return handleResponse(response);
  },
};

export default {
  auth: authAPI,
  requests: requestsAPI,
  dashboard: dashboardAPI,
  messages: messagesAPI,
  announcements: announcementsAPI,
  users: usersAPI,
  donors: donorsAPI,
  admin: adminAPI,
  hospital: hospitalAPI,
};
