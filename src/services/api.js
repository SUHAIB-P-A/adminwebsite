import axios from 'axios';
import { monitoring } from '../utils/monitoring';
import { logger } from '../utils/logger';

// Get API base URL from environment or fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: import.meta.env.VITE_API_TIMEOUT || 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor - add auth token if available
api.interceptors.request.use(
  (config) => {
    const staffId = localStorage.getItem('staff_id');
    if (staffId) {
      config.headers['X-Staff-ID'] = staffId;
    }
    
    // Store request start time for duration tracking
    config.requestStartTime = Date.now();
    
    return config;
  },
  (error) => {
    logger.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => {
    // Track successful API calls
    const duration = Date.now() - (response.config?.requestStartTime || Date.now());
    monitoring.trackApiCall(
      response.config?.method?.toUpperCase() || 'GET',
      response.config?.url || 'unknown',
      response.status,
      duration
    );
    
    return response;
  },
  (error) => {
    const config = error.config || {};
    const duration = Date.now() - (config.requestStartTime || Date.now());
    const status = error.response?.status || 0;
    
    // Track API errors
    monitoring.trackApiCall(
      config.method?.toUpperCase() || 'GET',
      config.url || 'unknown',
      status,
      duration
    );

    logger.error('API Error:', {
      url: config.url,
      method: config.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      localStorage.removeItem('staff_id');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;

