import axios, { AxiosInstance } from 'axios';

// Set the base URL to your Node.js backend server
const baseURL = 'http://localhost:3001'; 

const api: AxiosInstance = axios.create({
  baseURL,
});

// Request Interceptor: This runs before EVERY request is sent
api.interceptors.request.use(
  (config) => {
    // Retrieve the token saved during login
    const token = localStorage.getItem('token');

    // If a token exists, attach it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Response interceptor for generic error handling (e.g., auto-logout on 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized access (e.g., redirect to login)
            // console.log("Unauthorized request. Redirecting...");
            // Note: Actual logout/redirect logic should be handled in AuthContext
        }
        return Promise.reject(error);
    }
);

export default api;