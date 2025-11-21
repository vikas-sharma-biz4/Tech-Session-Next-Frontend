'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuthStore } from '@/store/authStore';
import { SignupFormData } from '@/interfaces/auth';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import {
  sanitizeInput,
  preventPasswordPaste,
  preventPasswordContextMenu,
  formatOTPInput,
} from '@/utilities/validation';
import { signupSchema, signupOTPSchema } from '@/validationSchemas';
import { ROUTES, API_ENDPOINTS } from '@/constants';
import Link from 'next/link';

interface OTPFormData {
  otp: string;
}

export default function SignupView() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const router = useRouter();
  const { signup, verifySignupOTP, isAuthenticated, loading, error, clearError } = useAuthStore();

  const signupForm = useForm<SignupFormData>({
    mode: 'onChange',
    resolver: yupResolver(signupSchema),
  });

  const otpForm = useForm<OTPFormData>({
    mode: 'onChange',
    resolver: yupResolver(signupOTPSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      const { user } = useAuthStore.getState();
      const userRole = user?.role || 'buyer';
      
      // Redirect based on role
      if (userRole === 'seller' || userRole === 'admin') {
        // Redirect sellers to seller dashboard (frontend)
        window.location.href = 'http://localhost:3001/dashboard';
      } else {
        // Buyers stay on buyer dashboard (next-frontend)
        router.push(ROUTES.DASHBOARD);
      }
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (step === 1 && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [step]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((timer) => {
          if (timer <= 1) {
            setCanResend(true);
            return 0;
          }
          return timer - 1;
        });
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleGoogleSignup = () => {
    window.location.href = API_ENDPOINTS.AUTH.GOOGLE;
  };

  const onSignupSubmit = async (data: SignupFormData) => {
    const result = await signup(data);

    if (result.success) {
      setEmail(data.email);
      setSuccess('Account created! Please check your email for verification OTP.');
      setResendTimer(60);
      setCanResend(false);
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 2000);
    }
  };

  const onOTPSubmit = async (data: OTPFormData) => {
    const result = await verifySignupOTP(email, data.otp);

    if (result.success) {
      // Get user from store to check role
      const { user } = useAuthStore.getState();
      const userRole = user?.role || 'buyer';
      
      // Redirect based on role
      if (userRole === 'seller' || userRole === 'admin') {
        // Redirect sellers to seller dashboard (frontend)
        window.location.href = 'http://localhost:3001/dashboard';
      } else {
        // Buyers stay on buyer dashboard (next-frontend)
        router.push(ROUTES.DASHBOARD);
      }
    }
  };

  const onResendOTP = async () => {
    if (!canResend || !email) return;

    const formData = signupForm.getValues();
    const result = await signup({
      name: formData.name,
      email,
      password: formData.password,
      confirmPassword: formData.password,
      role: formData.role || 'buyer',
    });

    if (result.success) {
      setSuccess('New OTP sent to your email!');
      setResendTimer(60);
      setCanResend(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
          <h1>Create Account</h1>
          <p>{step === 1 ? 'Sign up for a new account' : 'Verify your email address'}</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {step === 1 && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="btn-google"
              disabled={loading}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.86-2.6 3.29-4.53 6.15-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div className="divider">
              <span>OR</span>
            </div>

            <form
              onSubmit={signupForm.handleSubmit(onSignupSubmit)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  e.currentTarget.requestSubmit();
                }
              }}
            >
              <div className="form-group">
                <label htmlFor="name">
                  Full Name <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  {...(() => {
                    const { ref, ...rest } = signupForm.register('name', {
                      onChange: (e) => {
                        const sanitized = sanitizeInput(e.target.value);
                        if (sanitized !== e.target.value) {
                          e.target.value = sanitized;
                        }
                      },
                    });
                    return {
                      ...rest,
                      ref: (e: HTMLInputElement | null) => {
                        ref(e);
                        nameInputRef.current = e;
                      },
                    };
                  })()}
                  className={signupForm.formState.errors.name ? 'error' : ''}
                  placeholder="Enter your full name"
                  maxLength={50}
                />
                {signupForm.formState.errors.name && (
                  <div className="error-message">{signupForm.formState.errors.name.message}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  {...signupForm.register('email', {
                    onChange: (e) => {
                      const sanitized = sanitizeInput(e.target.value);
                      if (sanitized !== e.target.value) {
                        e.target.value = sanitized;
                      }
                    },
                  })}
                  className={signupForm.formState.errors.email ? 'error' : ''}
                  placeholder="Enter your email"
                  maxLength={255}
                />
                {signupForm.formState.errors.email && (
                  <div className="error-message">{signupForm.formState.errors.email.message}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    {...signupForm.register('password', {
                      onChange: (e) => {
                        if (e.target.value.startsWith(' ')) {
                          e.target.value = e.target.value.trimStart();
                        }
                      },
                    })}
                    className={signupForm.formState.errors.password ? 'error' : ''}
                    placeholder="Enter password (8-16 characters)"
                    maxLength={16}
                    onPaste={preventPasswordPaste}
                    onContextMenu={preventPasswordContextMenu}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#666',
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <div className="error-message">
                    {signupForm.formState.errors.password.message}
                  </div>
                )}
                <PasswordStrengthIndicator password={signupForm.watch('password') || ''} />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Confirm Password <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    {...signupForm.register('confirmPassword', {
                      onChange: (e) => {
                        if (e.target.value.startsWith(' ')) {
                          e.target.value = e.target.value.trimStart();
                        }
                      },
                    })}
                    className={signupForm.formState.errors.confirmPassword ? 'error' : ''}
                    placeholder="Confirm your password"
                    maxLength={16}
                    onPaste={preventPasswordPaste}
                    onContextMenu={preventPasswordContextMenu}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#666',
                    }}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {signupForm.formState.errors.confirmPassword && (
                  <div className="error-message">
                    {signupForm.formState.errors.confirmPassword.message}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="role">
                  I want to <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <select
                  id="role"
                  {...signupForm.register('role')}
                  className={signupForm.formState.errors.role ? 'error' : ''}
                >
                  <option value="">Select your role</option>
                  <option value="buyer">Buy Books (Buyer)</option>
                  <option value="seller">Sell Books (Seller)</option>
                </select>
                {signupForm.formState.errors.role && (
                  <div className="error-message">{signupForm.formState.errors.role.message}</div>
                )}
              </div>

              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <form onSubmit={otpForm.handleSubmit(onOTPSubmit)}>
            <div className="form-group">
              <label htmlFor="otp">Verification Code</label>
              <input
                type="text"
                id="otp"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                {...otpForm.register('otp', {
                  onChange: (e) => {
                    e.target.value = formatOTPInput(e.target.value);
                  },
                })}
                className={otpForm.formState.errors.otp ? 'error' : ''}
                style={{
                  letterSpacing: 'normal',
                  textAlign: 'left',
                  fontSize: '16px',
                  fontWeight: '400',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '6px',
                  width: '100%',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4A90E2';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e1e5e9';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              {otpForm.formState.errors.otp && (
                <div className="error-message">{otpForm.formState.errors.otp.message}</div>
              )}

              <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '14px' }}>
                {canResend ? (
                  <button
                    type="button"
                    onClick={onResendOTP}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4A90E2',
                      textDecoration: 'underline',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: loading ? 0.6 : 1,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    {loading ? 'Sending...' : 'Resend OTP'}
                  </button>
                ) : (
                  <span style={{ color: '#666', fontSize: '13px', fontStyle: 'italic' }}>
                    Resend OTP in {resendTimer}s
                  </span>
                )}
              </div>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}

        <div className="text-center mt-2">
          <span>Already have an account? </span>
          <Link href={ROUTES.LOGIN} className="link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

