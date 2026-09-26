import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, 
  Mail, 
  User, 
  Lock, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  X, 
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  KeyRound
} from 'lucide-react';

function formatAuthError(err) {
  if (!err) return 'An error occurred during authentication.';
  const msg = err.message || err.error_description || (typeof err === 'string' ? err : '');
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_grant')) {
    return 'Invalid email or password. Please verify your credentials.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'Please check your inbox and confirm your email before signing in.';
  }
  if (msg.includes('User already registered')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (msg.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
    return 'Too many email requests sent. Please wait a minute before trying again.';
  }
  return msg || 'Authentication failed. Please check your credentials.';
}

export default function AuthModal({ isOpen, onClose, initialIsRegister = false }) {
  const { 
    signIn, 
    signUp, 
    resetPasswordForEmail, 
    signInWithGoogle, 
    isSupabaseConfigured 
  } = useAuth();
  
  // Modes: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState(initialIsRegister ? 'register' : 'login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // State alerts
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialIsRegister ? 'register' : 'login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setError('');
      setSuccessMessage('');
      setFieldErrors({});
    }
  }, [isOpen, initialIsRegister]);

  if (!isOpen) return null;

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || '').trim());
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak (min 6 characters)', color: 'var(--danger)' };
    if (score <= 3) return { score: 2, label: 'Medium', color: 'var(--warning)' };
    return { score: 3, label: 'Strong', color: 'var(--success)' };
  };

  const validateForm = () => {
    const errors = {};

    if (mode === 'register') {
      if (!fullName.trim()) {
        errors.fullName = 'Full name is required';
      } else if (fullName.trim().length < 2) {
        errors.fullName = 'Name must be at least 2 characters';
      }
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address (e.g. name@domain.com)';
    }

    if (mode !== 'forgot') {
      if (!password) {
        errors.password = 'Password is required';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await signUp(email.trim(), password, fullName.trim());
        // Check if email confirmation is required by Supabase
        if (isSupabaseConfigured && res?.user && !res?.session) {
          setSuccessMessage('Registration successful! Please check your email to confirm your account.');
        } else {
          setSuccessMessage('Welcome! Setting up your workspace...');
          setTimeout(() => onClose(), 800);
        }
      } else if (mode === 'login') {
        await signIn(email.trim(), password);
        onClose();
      } else if (mode === 'forgot') {
        await resetPasswordForEmail(email.trim());
        setSuccessMessage('Password reset link sent! Please check your email inbox to reset your password.');
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(formatAuthError(err));
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
    setFieldErrors({});
  };

  const strength = mode === 'register' ? getPasswordStrength(password) : null;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: '440px', padding: '0', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: mode === 'forgot' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              border: mode === 'forgot' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: mode === 'forgot' ? 'var(--warning)' : 'var(--accent-primary)'
            }}>
              {mode === 'forgot' ? <KeyRound size={22} /> : <Sparkles size={22} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Welcome Back'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {mode === 'register' 
                  ? 'Get started with AI job matching' 
                  : mode === 'forgot' 
                  ? 'Enter your email to receive a password reset link' 
                  : 'Sign in to access your jobs & keys'}
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Auth Mode Toggle Tabs (Login vs Register) OR Back Bar (Forgot Mode) */}
        {mode === 'forgot' ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)'
          }}>
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '4px 0'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supabase Auth</span>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)'
          }}>
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                padding: '12px',
                border: 'none',
                background: mode === 'login' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                borderBottom: mode === 'login' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: mode === 'login' ? '#fff' : 'var(--text-secondary)',
                fontWeight: mode === 'login' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              style={{
                padding: '12px',
                border: 'none',
                background: mode === 'register' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                borderBottom: mode === 'register' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: mode === 'register' ? '#fff' : 'var(--text-secondary)',
                fontWeight: mode === 'register' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              Register
            </button>
          </div>
        )}

        {/* Body Form */}
        <form onSubmit={handleSubmit} noValidate autoComplete="off">
          {/* Anti-autofill dummy captures */}
          <input type="text" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
          <input type="password" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Global Error Banner */}
            {error && (
              <div style={{
                padding: '12px 14px',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                borderRadius: '10px',
                color: 'var(--danger)',
                fontSize: '0.85rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'fadeIn 0.2s ease'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Global Success Banner */}
            {successMessage && (
              <div style={{
                padding: '12px 14px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '10px',
                color: 'var(--success)',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'fadeIn 0.2s ease'
              }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Full Name (Register only) */}
            {mode === 'register' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  <span>Full Name</span>
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: fieldErrors.fullName ? 'var(--danger)' : 'var(--text-muted)' }} />
                  <input
                    type="text"
                    name="register_user_fullname_custom"
                    autoComplete="off"
                    className="form-input"
                    style={{
                      paddingLeft: '38px',
                      borderColor: fieldErrors.fullName ? 'var(--danger)' : 'var(--border-subtle)'
                    }}
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: null });
                    }}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>
            )}

            {/* Email Address */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ marginBottom: '6px' }}>
                <span>Email Address</span>
                <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: fieldErrors.email ? 'var(--danger)' : 'var(--text-muted)' }} />
                <input
                  type="email"
                  name="auth_email_field_custom"
                  autoComplete="new-password"
                  className="form-input"
                  style={{
                    paddingLeft: '38px',
                    borderColor: fieldErrors.email ? 'var(--danger)' : 'var(--border-subtle)'
                  }}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                  }}
                />
              </div>
              {fieldErrors.email && (
                <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password (Login or Register) */}
            {mode !== 'forgot' && (
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    <span>Password</span>
                    <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>*</span>
                  </label>

                  {strength && password && (
                    <span style={{ fontSize: '0.72rem', color: strength.color, fontWeight: 600 }}>
                      {strength.label}
                    </span>
                  )}

                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: fieldErrors.password ? 'var(--danger)' : 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="auth_password_field_custom"
                    autoComplete="new-password"
                    className="form-input"
                    style={{
                      paddingLeft: '38px',
                      paddingRight: '38px',
                      borderColor: fieldErrors.password ? 'var(--danger)' : 'var(--border-subtle)'
                    }}
                    placeholder={mode === 'register' ? 'Min 6 characters' : 'Enter password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '10px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>
                    {fieldErrors.password}
                  </p>
                )}
              </div>
            )}

            {/* Confirm Password (Register mode only) */}
            {mode === 'register' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  <span>Confirm Password</span>
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: fieldErrors.confirmPassword ? 'var(--danger)' : 'var(--text-muted)' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="auth_confirm_password_field_custom"
                    autoComplete="new-password"
                    className="form-input"
                    style={{
                      paddingLeft: '38px',
                      paddingRight: '38px',
                      borderColor: fieldErrors.confirmPassword ? 'var(--danger)' : 'var(--border-subtle)'
                    }}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: null });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '10px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem',
                fontWeight: 700,
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Sparkles size={18} className="spin" />
                  <span>
                    {mode === 'register' 
                      ? 'Creating Account...' 
                      : mode === 'forgot' 
                      ? 'Sending Reset Link...' 
                      : 'Signing In...'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'register' 
                      ? 'Create Free Account' 
                      : mode === 'forgot' 
                      ? 'Send Reset Link' 
                      : 'Sign In to Dashboard'}
                  </span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Google OAuth (Social Login) */}
            {mode !== 'forgot' && isSupabaseConfigured && (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  margin: '4px 0'
                }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </>
            )}

          </div>
        </form>

        {/* Footer info */}
        <div style={{
          padding: '14px 24px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}>
          <span>⚡ Secured with Supabase Auth & JWT access token verification.</span>
        </div>
      </div>
    </div>
  );
}
