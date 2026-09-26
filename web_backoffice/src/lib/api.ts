import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer Token from localStorage and handle FormData
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rumbo_fino_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // If payload is FormData (e.g. file uploads), remove Content-Type so browser sets boundary automatically
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// Response Interceptor: Safe 401 handling to prevent abrupt session loss during dashboard polling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      console.warn('⚠️ Token caducado o no válido (401 Unauthorized) en petición secundaria.');
      const user = localStorage.getItem('rumbo_fino_user');
      if (!user && !window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('rumbo_fino_token');
        localStorage.removeItem('rumbo_fino_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const getAuthUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('rumbo_fino_user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};
