export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: 'buyer' | 'seller' | 'admin';
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  otp: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  resetUrl?: string;
  otp?: string;
  remainingAttempts?: number;
  remainingTime?: number;
}

