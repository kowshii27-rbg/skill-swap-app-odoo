import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: FormData) => api.post('/auth/login', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getMe: () => api.get('/auth/me'),
};

// User endpoints
export const userAPI = {
  updateProfile: (data: any) => api.put('/users/me', data),
  updateProfileComplete: (data: any) => api.patch('/users/profile', data),
  getProfile: () => api.get('/users/profile'),
  searchUsers: (params: any) => api.get('/users/search', { params }),
  getUser: (id: string) => api.get(`/users/${id}`),
  addSkill: (data: any) => api.post('/users/skills', data),
  getSkills: () => api.get('/users/skills'),
  getAvailableSkills: () => api.get('/users/available-skills'),
  removeSkill: (skillId: string, type: string) => 
    api.delete(`/users/skills/${skillId}?skill_type=${type}`),
};

// Swap endpoints
export const swapAPI = {
  createRequest: (data: any) => api.post('/swaps/request', data),
  getMyRequests: (status?: string) => 
    api.get('/swaps/my-requests', { params: { status_filter: status } }),
  getReceivedRequests: (status?: string) => 
    api.get('/swaps/received-requests', { params: { status_filter: status } }),
  updateStatus: (requestId: string, status: string) => 
    api.put(`/swaps/${requestId}/status`, { status }),
  cancelRequest: (requestId: string) => api.delete(`/swaps/${requestId}`),
  getRequest: (requestId: string) => api.get(`/swaps/${requestId}`),
};

// Feedback endpoints
export const feedbackAPI = {
  submitFeedback: (data: any) => api.post('/feedback/', data),
  getMyFeedback: () => api.get('/feedback/my-feedback'),
  getReceivedFeedback: () => api.get('/feedback/received-feedback'),
  getSwapFeedback: (swapId: string) => api.get(`/feedback/swap/${swapId}`),
  getUserFeedback: (userId: string) => api.get(`/feedback/user/${userId}`),
};

// Admin endpoints
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: (skip = 0, limit = 100) => 
    api.get('/admin/users', { params: { skip, limit } }),
  banUser: (userId: string) => api.put(`/admin/users/${userId}/ban`),
  unbanUser: (userId: string) => api.put(`/admin/users/${userId}/unban`),
  getAllSwaps: (status?: string, skip = 0, limit = 100) => 
    api.get('/admin/swaps', { params: { status_filter: status, skip, limit } }),
  getAllFeedback: (skip = 0, limit = 100) => 
    api.get('/admin/feedback', { params: { skip, limit } }),
  deleteSwap: (swapId: string) => api.delete(`/admin/swaps/${swapId}`),
  deleteFeedback: (feedbackId: string) => api.delete(`/admin/feedback/${feedbackId}`),
};

export default api; 