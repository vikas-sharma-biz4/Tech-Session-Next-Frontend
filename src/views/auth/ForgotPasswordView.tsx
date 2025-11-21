'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuthStore } from '@/store/authStore';
import { ForgotPasswordFormData, ResetPasswordFormData } from '@/interfaces/auth';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import {
  sanitizeInput,
  preventPasswordPaste,
  preventPasswordContextMenu,
  formatOTPInput,
} from '@/utilities/validation';
import { forgotPasswordEmailSchema, resetPasswordSchema } from '@/validationSchemas';
import { ROUTES } from '@/constants';
import Link from 'next/link';

export default function ForgotPasswordView() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const router = useRouter();
  const { forgotPassword, resetPasswordWithOTP, loading } = useAuthStore();

  useEffect(() => {
    if (step === 1 && emailInputRef.current) {
      emailInputRef.current.focus();
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

  const emailForm = useForm<ForgotPasswordFormData>({
    mode: 'onChange',
    resolver: yupResolver(forgotPasswordEmailSchema),
  });

  const otpForm = useForm<ResetPasswordFormData>({
    mode: 'onChange',
    resolver: yupResolver(resetPasswordSchema),
  });

  const onEmailSubmit = async (data: ForgotPasswordFormData) => {
    setError('');
    setSuccess('');

    const result = await forgotPassword(data.email);

    if (result.success) {
      setEmail(data.email);
      setSuccess('OTP sent to your email! Please check your inbox.');
      setResendTimer(60);
      setCanResend(false);
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 2000);
    } else {
      setError(result.error || 'Failed to send OTP');
    }
  };

  const onOTPSubmit = async (data: ResetPasswordFormData) => {
    setError('');
    setSuccess('');

    const result = await resetPasswordWithOTP(email, data.otp, data.password);

    if (result.success) {
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push(ROUTES.LOGIN);
      }, 2000);
    } else {
      setError(result.error || 'Password reset failed');
    }
  };

  const onResendOTP = async () => {
    if (!canResend) return;

    setError('');
    setSuccess('');

    const result = await forgotPassword(email);

    if (result.success) {
      setSuccess('New OTP sent to your email!');
      setResendTimer(60);
      setCanResend(false);
    } else {
      setError(result.error || 'Failed to resend OTP');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>
            {step === 1 ? 'Enter your email to receive an OTP' : 'Enter OTP and your new password'}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {step === 1 && (
          <form
            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) {
                e.currentTarget.requestSubmit();
              }
            }}
          >
            <div className="form-group">
              <label htmlFor="email">
                Email <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="email"
                id="email"
                {...(() => {
                  const { ref, ...rest } = emailForm.register('email', {
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
                      emailInputRef.current = e;
                    },
                  };
                })()}
                className={emailForm.formState.errors.email ? 'error' : ''}
                placeholder="Enter your email"
                maxLength={255}
              />
              {emailForm.formState.errors.email && (
                <div className="error-message">{emailForm.formState.errors.email.message}</div>
              )}
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={otpForm.handleSubmit(onOTPSubmit)}>
            <div className="form-group">
              <label htmlFor="otp">OTP Code</label>
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

            <div className="form-group">
              <label htmlFor="password">
                New Password <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter new password (8-16 characters)"
                  {...otpForm.register('password', {
                    onChange: (e) => {
                      if (e.target.value.startsWith(' ')) {
                        e.target.value = e.target.value.trimStart();
                      }
                    },
                  })}
                  className={otpForm.formState.errors.password ? 'error' : ''}
                  maxLength={16}
                  onPaste={preventPasswordPaste}
                  onContextMenu={preventPasswordContextMenu}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '6px',
                    fontSize: '16px',
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
              {otpForm.formState.errors.password && (
                <div className="error-message">{otpForm.formState.errors.password.message}</div>
              )}
              <PasswordStrengthIndicator password={otpForm.watch('password') || ''} />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm New Password <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  placeholder="Confirm new password"
                  {...otpForm.register('confirmPassword', {
                    onChange: (e) => {
                      if (e.target.value.startsWith(' ')) {
                        e.target.value = e.target.value.trimStart();
                      }
                    },
                  })}
                  className={otpForm.formState.errors.confirmPassword ? 'error' : ''}
                  maxLength={16}
                  onPaste={preventPasswordPaste}
                  onContextMenu={preventPasswordContextMenu}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '6px',
                    fontSize: '16px',
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
              {otpForm.formState.errors.confirmPassword && (
                <div className="error-message">
                  {otpForm.formState.errors.confirmPassword.message}
                </div>
              )}
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="text-center mt-2">
          <Link href={ROUTES.LOGIN} className="link">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

