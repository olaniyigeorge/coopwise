import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AuthService from '@/services/auth-service';
import UserService from '@/services/user-service';
import CookieService from '@/services/cookie-service';

export interface User {
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
  /** True only during the initial mount check; lets pages show a splash/skeleton instead of flashing the login form. */
  isInitializing: boolean;
  error: string | null;

  // Actions
  checkAuth: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setUser: (user: User | null) => void;
  updateUser: (userData: Partial<User>) => void;
  updateUserProfile: (data: Partial<User>) => Promise<User>;
  refreshUserData: () => Promise<void>;
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitializing: true,
      error: null,

      /**
       * Runs once on app mount (call from a top-level client component,
       * e.g. AppWrapper or a small <AuthHydrator /> inside it).
       * Confirms the session is actually valid rather than trusting
       * the persisted localStorage snapshot alone.
       */
      checkAuth: async () => {
        try {
          const token = await AuthService.getToken();
          if (token) {
            const savedUser = AuthService.getCurrentUser();
            if (savedUser) {
              set({ user: savedUser, isAuthenticated: true });
            }
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (err) {
          console.error('checkAuth error:', err);
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ isInitializing: false });
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await AuthService.login(credentials, credentials.rememberMe || false);
          if (!response.user) throw new Error('Invalid response from server');
          set({ user: response.user, isAuthenticated: true, isLoading: false });
          return response.user;
        } catch (error: any) {
          const message =
            error?.response?.data?.detail || error?.message || 'Login failed';
          set({ error: message, isLoading: false, isAuthenticated: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await AuthService.register(data);
          if (!response.user) throw new Error('Invalid response from server');
          set({ user: response.user, isAuthenticated: true, isLoading: false });
          return response.user;
        } catch (error: any) {
          const message =
            error?.response?.data?.detail || error?.message || 'Registration failed';
          set({ error: message, isLoading: false, isAuthenticated: false });
          throw error;
        }
      },

      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      logout: async () => {
        set({ isLoading: true });
        try {
          await AuthService.logout();
        } catch (error: any) {
          console.warn('Logout API call failed, clearing local state anyway:', error);
        } finally {
          set({ user: null, isAuthenticated: false, isLoading: false, error: null });
          try {
            localStorage.removeItem('auth-storage');
            localStorage.removeItem('notifications-storage');
          } catch {}
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
        set({ user: merged });
        CookieService.setUser(merged);
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
          CookieService.setUser(updatedUser);
        }
      },

      /** Persists a profile update to the backend, then updates local state. */
      updateUserProfile: async (profileData) => {
        const currentUser = get().user;
        if (!currentUser) throw new Error('You must be logged in to update your profile');

        set({ isLoading: true, error: null });
        try {
          const updatedUser = await UserService.updateUser(currentUser.id, profileData);
          const merged = { ...currentUser, ...updatedUser };
          set({ user: merged, isLoading: false });
          CookieService.setUser(merged);
          return merged;
        } catch (error: any) {
          const message = error?.response?.data?.detail || 'Failed to update your profile';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      /** Re-fetches the current user from the backend (e.g. after external changes). */
      refreshUserData: async () => {
        const currentUser = get().user;
        if (!currentUser?.id || !get().isAuthenticated) return;

        set({ isLoading: true });
        try {
          const userData = await UserService.getUserById(currentUser.id);
          set({ user: userData, isLoading: false });
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;