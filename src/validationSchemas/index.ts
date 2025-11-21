import * as yup from 'yup';
import { LoginFormData, SignupFormData, ForgotPasswordFormData, ResetPasswordFormData } from '@/interfaces/auth';
import { validatePasswordNoLeadingSpaces } from '@/utilities/validation';

// Common validation patterns
export const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,16}$/;
export const namePattern = /^[a-zA-Z\s'-]{2,50}$/;
export const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Common email validation
const emailValidation = yup
  .string()
  .email('Invalid email format')
  .matches(emailPattern, 'Email must contain @ and domain')
  .max(255, 'Email must be at most 255 characters')
  .required('Email is required');

// Login Schema
export const loginSchema: yup.ObjectSchema<LoginFormData> = yup.object({
  email: emailValidation,
  password: yup
    .string()
    .required('Password is required')
    .test(
      'no-leading-space',
      'Password cannot start with a space',
      (value) => !value || !value.startsWith(' ')
    ),
});

// Signup Schema
export const signupSchema: yup.ObjectSchema<SignupFormData> = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .matches(namePattern, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .required('Name is required')
    .test(
      'no-leading-space',
      'Name cannot start with a space',
      (value) => !value || value.trim() === value
    ),
  email: emailValidation,
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(16, 'Password must be at most 16 characters')
    .matches(
      passwordPattern,
      'Password must contain 8-16 characters with at least one uppercase, one lowercase, one number, and one special character (@$!%*?&#)'
    )
    .test('no-leading-space', 'Password cannot start with a space', validatePasswordNoLeadingSpaces)
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  role: yup
    .string()
    .oneOf(['buyer', 'seller', 'admin'], 'Invalid role selected')
    .required('Please select your role'),
});

// OTP Schema (for signup verification)
export const signupOTPSchema = yup.object({
  otp: yup
    .string()
    .matches(/^[0-9]{6}$/, 'OTP must be 6 digits')
    .required('OTP is required'),
});

// Forgot Password - Email Schema
export const forgotPasswordEmailSchema: yup.ObjectSchema<ForgotPasswordFormData> = yup.object({
  email: emailValidation,
});

// Reset Password Schema (OTP + New Password)
export const resetPasswordSchema: yup.ObjectSchema<ResetPasswordFormData> = yup.object({
  otp: yup
    .string()
    .matches(/^[0-9]{6}$/, 'OTP must be 6 digits')
    .required('OTP is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(16, 'Password must be at most 16 characters')
    .matches(
      passwordPattern,
      'Password must contain 8-16 characters with at least one uppercase, one lowercase, one number, and one special character (@$!%*?&#)'
    )
    .test(
      'no-leading-space',
      'Password cannot start with a space',
      (value) => !value || !value.startsWith(' ')
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});
