import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import AuthService from './auth-service';

// Create an axios instance with defaults
const apiClient = axios.create({
  baseURL: '/api', // Use our Next.js API routes as a proxy
  timeout: 15000,  // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config) => {
    // Get the auth token from our service
    const token = AuthService.getToken();
    
    // If the token exists, add it to the Authorization header
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors (unauthorized) - could implement token refresh here
    if (error.response?.status === 401 && !originalRequest._retry) {
      // For now, just log the user out if their token is invalid
      // In a more advanced implementation, you could try to refresh the token
      console.error('Unauthorized API request - token may be invalid');
    }
    
    return Promise.reject(error);
  }
);

// Export a typed API service
const ApiService = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config);
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config);
  },
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config);
  },
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.patch<T>(url, data, config);
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config);
  }
};

export default ApiService; 