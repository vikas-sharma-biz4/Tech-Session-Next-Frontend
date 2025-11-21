// Application-wide constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const ROUTES = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
  DASHBOARD: '/dashboard',
  OAUTH_CALLBACK: '/auth/oauth-callback',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    SIGNUP: '/api/auth/signup',
    VERIFY_SIGNUP_OTP: '/api/auth/verify-signup-otp',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    VERIFY_OTP: '/api/auth/verify-otp',
    RESET_PASSWORD_OTP: '/api/auth/reset-password-otp',
    RESET_PASSWORD: '/api/auth/reset-password',
    GOOGLE: '/api/auth/google',
    GOOGLE_CALLBACK: '/api/auth/google/callback',
  },
  USER: {
    PROFILE: '/api/user/profile',
    ROLE: '/api/user/role',
  },
  PROFILE_PICTURE: {
    UPLOAD: '/api/profile-picture/upload',
  },
  BOOKS: {
    LIST: '/api/books',
    DETAIL: '/api/books',
  },
} as const;

export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || BACKEND_BASE_URL;

export const TOKEN_COOKIE_NAME = 'token';
export const TOKEN_EXPIRY_DAYS = 7;

