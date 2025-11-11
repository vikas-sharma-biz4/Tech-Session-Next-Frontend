import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AxiosError } from 'axios';
import api from '@/services/api';
import { User } from '@/interfaces/shared';
import { LoginFormData, SignupFormData } from '@/interfaces/auth';
import { API_ENDPOINTS } from '@/constants';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (data: LoginFormData) => Promise<{ success: boolean; error?: string; remainingAttempts?: number; remainingTime?: number }>;
  signup: (data: SignupFormData) => Promise<{ success: boolean; error?: string; email?: string }>;
  verifySignupOTP: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordWithOTP: (email: string, otp: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
  checkAuth: (silent?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,

      login: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post<{ token: string; user: User }>(API_ENDPOINTS.AUTH.LOGIN, data);
          const { user } = response.data;
          // Token is automatically set in httpOnly cookie by API proxy
          set({ user, isAuthenticated: true, loading: false, error: null });
          return { success: true };
        } catch (error) {
          const axiosError = error as AxiosError<{ message?: string; remainingAttempts?: number; remainingTime?: number }>;
          const errorMessage = axiosError.response?.data?.message || 'Login failed';
          const remainingAttempts = axiosError.response?.data?.remainingAttempts;
          const remainingTime = axiosError.response?.data?.remainingTime;
          set({ loading: false, error: errorMessage, isAuthenticated: false });
          return { 
            success: false, 
            error: errorMessage,
            remainingAttempts,
            remainingTime
          };
        }
      },

      signup: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post<{ message: string; success?: boolean }>(API_ENDPOINTS.AUTH.SIGNUP, {
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role || 'buyer',
          });
          set({ loading: false, error: null });
          return { success: true, email: data.email };
        } catch (error) {
          const axiosError = error as AxiosError<{ message?: string }>;
          const errorMessage = axiosError.response?.data?.message || 'Signup failed';
          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      verifySignupOTP: async (email, otp) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post<{ token: string; user: User }>(API_ENDPOINTS.AUTH.VERIFY_SIGNUP_OTP, {
            email,
            otp,
          });
          const { user } = response.data;
          // Token is automatically set in httpOnly cookie by API proxy
          set({ user, isAuthenticated: true, loading: false, error: null });
          return { success: true };
        } catch (error) {
          const axiosError = error as AxiosError<{ message?: string }>;
          const errorMessage = axiosError.response?.data?.message || 'OTP verification failed';
          set({ loading: false, error: errorMessage, isAuthenticated: false });
          return { success: false, error: errorMessage };
        }
      },

      forgotPassword: async (email) => {
        set({ loading: true, error: null });
        try {
          await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
          set({ loading: false, error: null });
          return { success: true };
        } catch (error) {
          const axiosError = error as AxiosError<{ message?: string }>;
          const errorMessage = axiosError.response?.data?.message || 'Failed to send reset email';
          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      verifyOTP: async (email, otp) => {
        set({ loading: true, error: null });
        try {
          await api.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { email, otp });
          set({ loading: false, error: null });
          return { success: true };
        } catch (error) {
          const axiosError = error as AxiosError<{ message?: string }>;
          const errorMessage = axiosError.response?.data?.message || 'OTP verification failed';
          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      resetPasswordWithOTP: async (email, otp, password) => {
        set({ loading: true, error: null });
        try {
          await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD_OTP, { email, otp, password });
          set({ loading: false, error: null });
          return { success: true };
        } catch (error) {
          const axiosError = error as AxiosError<{ message?: string }>;
          const errorMessage = axiosError.response?.data?.message || 'Password reset failed';
          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      resetPassword: async (token, password) => {
        set({ loading: true, error: null });
        try {
          await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, password });
          set({ loading: false, error: null });
          return { success: true };
        } catch (error) {
          const axiosError = error as AxiosError<{ message?: string }>;
          const errorMessage = axiosError.response?.data?.message || 'Password reset failed';
          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      checkAuth: async (silent = false) => {
        if (!silent) {
          set({ loading: true });
        }
        try {
          // Try to get user profile - the API proxy will check for token in httpOnly cookie
          const response = await api.get<{ user: User }>(API_ENDPOINTS.USER.PROFILE);
          set({ user: response.data.user, isAuthenticated: true, loading: false, error: null });
        } catch (error) {
          // If checkAuth fails, token is invalid or missing - clear auth state
          // Only clear state if not silent (to avoid disrupting user experience during background refresh)
          if (!silent) {
            set({ user: null, isAuthenticated: false, loading: false, error: null });
          }
        }
      },

      logout: async () => {
        try {
          // Call logout API endpoint to clear httpOnly cookie
          await api.post(API_ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
          // Even if API call fails, clear local state
          console.error('Logout error:', error);
        } finally {
        set({ user: null, isAuthenticated: false, error: null });
        }
      },

      updateUser: (updatedUser: User) => {
        set({ user: updatedUser });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

