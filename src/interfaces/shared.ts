export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  profile_picture_url?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
  createdAt?: string | Date;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T = unknown> {
  message: string;
  data?: T;
}

