import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AuthService from '../auth-service';
import CookieService from '../cookie-service';

interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  phone_number: string;
  role: string;
  /** Flow blockchain address — set after Crossmint wallet provisioning + backend sync */
  flow_address?: string | null;
  [key: string]: any;
}

interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  email: string;
  full_name: string;
  username: string;
  phone_number: string;
  password: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setUser: (user: User | null) => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await AuthService.login(credentials, credentials.rememberMe || false);
          if (response.user) {
            set({ 
              user: response.user, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Login failed', 
            isLoading: false,
            isAuthenticated: false
          });
          throw error;
        }
      },
      
      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await AuthService.register(data);
          if (response.user) {
            set({ 
              user: response.user, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Registration failed', 
            isLoading: false,
            isAuthenticated: false
          });
          throw error;
        }
      },
      
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      
      logout: async () => {
        set({ isLoading: true });
        try {
          await AuthService.logout();
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Logout failed', 
            isLoading: false 
          });
          // Even if the API call fails, we still want to clear the user state
          set({ user: null, isAuthenticated: false });
        }
      },

            setUser: (user: User | null) => {
        const current = get().user || ({} as User);

        const merged: User = {
          ...current,
          ...user,
          profile_picture_url: 
            user?.profile_picture_url ||
            current.profile_picture_url ||
            user?.image ||
            null,
        };

        //console.log("💾 Saving user to store:", merged);

        set({ user: merged });
        CookieService.setUser(merged);
      },
      
      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
          // Also update in cookie for persistence
          CookieService.setUser(updatedUser);
        }
      },
      
      clearError: () => set({ error: null }),
      
      setLoading: (isLoading) => set({ isLoading })
    }),
    {
      name: 'auth-storage',
      // Only store non-sensitive data in localStorage
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

export default useAuthStore; 