// frontend/src/services/api.js
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Base URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'https://pharmastockbackend-1.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Only show toast and redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            toast.error('Session expired. Please login again.');
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Forbidden
          toast.error(data.message || 'You do not have permission to perform this action');
          break;
          
        case 404:
          // Not found
          toast.error(data.message || 'Resource not found');
          break;
          
        case 422:
          // Validation error
          if (data.errors) {
            Object.values(data.errors).forEach(err => {
              toast.error(err[0]);
            });
          } else {
            toast.error(data.message || 'Validation failed');
          }
          break;
          
        case 429:
          // Too many requests
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          // Server error
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          toast.error(data.message || 'An error occurred');
      }
      
      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('[API Error]', error.response);
      }
      
    } else if (error.request) {
      // Request was made but no response received
      toast.error('Network error. Please check your connection.');
      console.error('[Network Error]', error.request);
      
    } else {
      // Something else happened
      toast.error(error.message || 'An unexpected error occurred');
      console.error('[Error]', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper methods for common operations
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

export const removeAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Cancel token source for request cancellation
export const getCancelTokenSource = () => {
  const CancelToken = axios.CancelToken;
  return CancelToken.source();
};

export default api;