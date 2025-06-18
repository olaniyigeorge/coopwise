import axios from 'axios';
import CookieService from './cookie-service';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

// Define API URLs - Using relative URLs to work with Next.js API routes
const AUTH_ENDPOINTS = {
  LOGIN: `/api/auth/login`,
  REGISTER: `/api/auth/register`,
};

// Define types
export interface LoginCredentials {
  username: string; // Email or phone
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone_number: string;
  target_savings_amount?: number | null;
  savings_purpose?: string;
  income_range?: string;
  saving_frequency?: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: any;
}

export interface RegisterResponse {
  token: string;
  user: any;
}

// Auth service
const AuthService = {
  // Login user
  async login(credentials: LoginCredentials) {
    try {
      console.log('Logging in with:', credentials.username);
      
      // Ensure username is a string
      const username = credentials.username || '';
      const password = credentials.password || '';
      
      // Call the login API via our proxy route
      const response = await axios.post('/api/auth/login', {
        username: username,
        password: password,
        grant_type: 'password',
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.access_token) {
        // Store the token in a cookie
        CookieService.setToken(response.data.access_token);
        
        // If the user data is included in the response, use it
        if (response.data.user) {
          CookieService.setUser(response.data.user);
          return {
            token: response.data.access_token,
            user: response.data.user
          };
        }
        
        // Otherwise fetch user details with the token
        try {
          const userResponse = await axios.get('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${response.data.access_token}`
            }
          });
          
          console.log('User details:', userResponse.data);
          
          // Store user in a cookie
          CookieService.setUser(userResponse.data);
          
          return {
            token: response.data.access_token,
            user: userResponse.data
          };
        } catch (userError) {
          console.error('Error fetching user details:', userError);
          // Return just the token if user fetch fails
          return {
            token: response.data.access_token,
            user: null
          };
        }
      }
      
      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Register user
  async register(data: RegisterData) {
    try {
      // Use a proxy route for registration
      const response = await axios.post('/api/auth/register', data);
      
      console.log('Registration response:', response.data);
      
      // After registration, log the user in
      if (response.data) {
        try {
          const loginResponse = await this.login({
            username: data.email,
            password: data.password
          });
          
          return loginResponse;
        } catch (loginError) {
          console.error('Auto-login after registration failed:', loginError);
          // Return the registration data even if auto-login fails
          return { user: response.data };
        }
      }
      
      return { user: response.data };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      // Call the logout endpoint to clear HTTP-only cookies
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear client-side cookies
      CookieService.clearAuth();
    }
  },

  // Get stored token from cookieserve or server as fallback
  async getToken(): Promise<string | undefined> {
    // Try client-side token (set manually via CookieService)
    const clientToken = CookieService.getToken();
    if (clientToken) return clientToken;

    try {
      // Fallback to API if HttpOnly cookie is used
      const res = await fetch('/api/auth/token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (!res.ok) return undefined;
      
      const data = await res.json();
      if (data.token) {
        // Store the token in client-side cookie for future requests
        CookieService.setToken(data.token);
        return data.token;
      }
      return undefined;
    } catch (err) {
      console.error('Error fetching token from API:', err);
      return undefined;
    }
  },

  // Get current user
  getCurrentUser() {
    return CookieService.getUser();
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = CookieService.getToken();
    return !!token;
  },

  // Get auth header
  getAuthHeader(): { Authorization: string } | {} {
    const token = CookieService.getToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }
};

export default AuthService; 