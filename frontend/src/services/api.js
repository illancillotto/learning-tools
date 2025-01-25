import axios from 'axios';

// Get the backend URL from environment or socket configuration
const getBackendURL = () => {
  const backendPort = process.env.REACT_APP_BACKEND_PORT || '5000';
  const backendHost = window.location.hostname;
  return `http://${backendHost}:${backendPort}/api`;
};

const api = axios.create({
  baseURL: getBackendURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('Interceptor token:', token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.error('Interceptor error:', error);
  return Promise.reject(error);
});

export default api;