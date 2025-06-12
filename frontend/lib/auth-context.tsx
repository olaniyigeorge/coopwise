"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthService, { LoginCredentials, RegisterData } from './auth-service';
import UserService from './user-service';
import { toast } from '@/components/ui/use-toast';

// Define types
interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  phone_number: string;
  role: string;
  [key: string]: any; // For any additional user properties
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUserProfile: (data: any) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

// Configuration - set to false for production
const ENABLE_MOCK_FALLBACK = process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK === 'true' || false;

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AuthService.getToken();
        if (token) {
          // Get user from cookies
          const savedUser = AuthService.getCurrentUser();
          if (savedUser) {
            setUser(savedUser);
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Refresh user data from API
  const refreshUserData = async () => {
    if (!user?.id || !isAuthenticated) return;
    
    try {
      setLoading(true);
      // Get fresh user data from API
      const userData = await UserService.getUserById(user.id);
      setUser(userData);
      console.log("User data refreshed from API");
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthService.login(credentials);
      setIsAuthenticated(true);
      if (response.user) {
        setUser(response.user);
        toast({
          title: "Login Successful",
          description: `Welcome back, ${response.user.full_name}!`,
        });
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthService.register(data);
      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        
        toast({
          title: "Registration Successful",
          description: `Welcome to CoopWise, ${response.user.full_name}!`,
        });
        
        // Redirect to profile setup instead of dashboard
        router.push('/auth/profile-setup');
      }
    } catch (err: any) {
      let errorMessage = 'Registration failed. Please try again.';
      
      console.error("Registration error details:", err.response);
      
      // Handle different types of API errors
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          if (Array.isArray(err.response.data.detail)) {
            // Handle FastAPI validation errors
            errorMessage = err.response.data.detail.map((error: any) => {
              return `${error.loc.join('.')}: ${error.msg}`;
            }).join(', ');
          } else {
            errorMessage = err.response.data.detail;
          }
        } else if (typeof err.response.data === 'object') {
          // Handle validation errors
          const errors = [];
          for (const [key, value] of Object.entries(err.response.data)) {
            if (Array.isArray(value)) {
              errors.push(`${key}: ${value.join(', ')}`);
            } else {
              errors.push(`${key}: ${value}`);
            }
          }
          errorMessage = errors.join(', ');
        }
      }
      
      setError(errorMessage);
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile using API
  const updateUserProfile = async (profileData: any) => {
    if (!user || !isAuthenticated) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Call the API to update user profile
      const updatedUser = await UserService.updateUser(user.id, profileData);
      
      // Update the local user state
      setUser(prevUser => {
        if (!prevUser) return updatedUser;
        return { ...prevUser, ...updatedUser };
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (err: any) {
      console.error("Profile update error:", err);
      
      // Check if we should try the mock fallback
      if (ENABLE_MOCK_FALLBACK) {
        try {
          console.log("Using mock update as fallback...");
          
          // Use mock update as fallback
          const mockUpdatedUser = await UserService.mockUpdateUser(user.id, profileData) as User;
          
          // Update the local user state with mock data
          setUser(prevUser => {
            if (!prevUser) return mockUpdatedUser;
            return { ...prevUser, ...mockUpdatedUser };
          });
          
          toast({
            title: "Profile Updated (Offline Mode)",
            description: "Your profile has been updated in offline mode",
          });
          
          // We don't throw an error here since we've handled it with the mock
          return;
        } catch (mockErr) {
          console.error("Even mock update failed:", mockErr);
          // If mock fails too, continue to the error handling below
        }
      }
      
      // Extract error message
      let errorMessage = 'Failed to update your profile. Please try again.';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/');
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        login,
        register,
        logout,
        clearError,
        updateUserProfile,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 