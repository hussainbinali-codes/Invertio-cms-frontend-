import axios from 'axios';
import { BASE_URL } from './baseUrl';
import toast from 'react-hot-toast';

const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
instance.interceptors.request.use(
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

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid redirecting if already on login or OTP pages to prevent loops
      if (!['/login', '/verify-otp', '/forgot-password', '/reset-password'].includes(window.location.pathname)) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.response && error.response.status === 403) {
      toast.error('Access Denied: You do not have permission for this action.');
    } else if (error.response && error.response.status >= 500) {
      toast.error('Server connection error. Please try again later.');
    }
    return Promise.reject(error);
  }
);

export default instance;
