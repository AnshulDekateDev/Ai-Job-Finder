import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
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

export default function AuthModal({ isOpen, onClose, initialIsRegister = false }) {
  const { login, register, resetPassword } = useAuth();
  
  // Modes: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState(initialIsRegister ? 'register' : 'login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Forgot password states
  const [resetCode, setResetCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialIsRegister ? 'register' : 'login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setResetCode('');
      setGeneratedCode('');
      setCodeSent(false);
      setSendingCode(false);
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

    if (mode === 'forgot') {
      if (!resetCode.trim()) {
        errors.resetCode = 'Verification code is required';
      } else if (resetCode.trim().length !== 6) {
        errors.resetCode = 'Code must be exactly 6 digits';
      }
    }

    if (!password) {
      errors.password = mode === 'forgot' ? 'New password is required' : 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'register' || mode === 'forgot') {
      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendResetCode = async () => {
    if (!email.trim()) {
      setFieldErrors(prev => ({ ...prev, email: 'Please enter your email address first' }));
      return;
    }
    if (!validateEmail(email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    setSendingCode(true);
    setError('');
    setFieldErrors(prev => ({ ...prev, email: null }));

    try {
      const res = await authApi.forgotPassword(email.trim());
      const receivedCode = res.data?.code || '';
      setGeneratedCode(receivedCode);
      setCodeSent(true);
      if (receivedCode) {
        setResetCode(receivedCode);
        setFieldErrors(prev => ({ ...prev, resetCode: null }));
      }
    } catch (err) {
      const errData = err.response?.data;
      const errorMsg = errData?.error 
        || (typeof errData?.detail === 'object' ? errData.detail?.error : errData?.detail) 
        || errData?.message 
        || 'Failed to generate reset code. Please check your email.';
      setError(errorMsg);
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await register(email.trim(), password, fullName.trim());
        onClose();
      } else if (mode === 'login') {
        await login(email.trim(), password);
        onClose();
      } else if (mode === 'forgot') {
        await resetPassword(email.trim(), resetCode.trim(), password);
        setSuccessMessage('Password reset successfully! Continuing to dashboard...');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      const errData = err.response?.data;
      const errorMsg = errData?.error 
        || (typeof errData?.detail === 'object' ? errData.detail?.error : errData?.detail) 
        || errData?.message 
        || 'Authentication failed. Please check your credentials.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setPassword('');
    setConfirmPassword('');
    if (newMode !== 'forgot' && mode === 'forgot') {
      // keep email if present
    }
    setResetCode('');
    setGeneratedCode('');
    setCodeSent(false);
    setError('');
    setSuccessMessage('');
    setFieldErrors({});
  };

  const strength = (mode === 'register' || mode === 'forgot') ? getPasswordStrength(password) : null;

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
                  ? 'Verify your email and choose a new password' 
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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Secure Verification</span>
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
          {/* Hidden inputs to capture browser autofill */}
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
                <span>{mode === 'forgot' ? 'Registered Email Address' : 'Email Address'}</span>
                <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>*</span>
              </label>

              {mode === 'forgot' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
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
                  <button
                    type="button"
                    onClick={handleSendResetCode}
                    disabled={sendingCode || !email.trim()}
                    style={{
                      padding: '0 16px',
                      background: codeSent ? 'rgba(99, 102, 241, 0.15)' : 'var(--accent-primary)',
                      color: '#fff',
                      border: codeSent ? '1px solid rgba(99, 102, 241, 0.4)' : 'none',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: (sendingCode || !email.trim()) ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: (sendingCode || !email.trim()) ? 0.6 : 1,
                      transition: 'var(--transition)'
                    }}
                  >
                    {sendingCode ? (
                      <>
                        <Sparkles size={14} className="spin" />
                        <span>Sending...</span>
                      </>
                    ) : codeSent ? (
                      <span>Resend Code</span>
                    ) : (
                      <span>Get Code</span>
                    )}
                  </button>
                </div>
              ) : (
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
              )}

              {fieldErrors.email && (
                <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Verification Code Banner & Input (Forgot mode only) */}
            {mode === 'forgot' && (
              <>
                {codeSent && (
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <KeyRound size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Verification Code (Valid 15m)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '3px', color: '#fff', fontFamily: 'monospace' }}>
                          {generatedCode}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setResetCode(generatedCode);
                        if (fieldErrors.resetCode) setFieldErrors({ ...fieldErrors, resetCode: null });
                      }}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.25)',
                        border: '1px solid rgba(99, 102, 241, 0.45)',
                        color: 'var(--accent-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ marginBottom: '6px' }}>
                    <span>6-Digit Verification Code</span>
                    <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <ShieldCheck size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: fieldErrors.resetCode ? 'var(--danger)' : 'var(--text-muted)' }} />
                    <input
                      type="text"
                      maxLength={6}
                      name="auth_reset_code_custom"
                      autoComplete="off"
                      className="form-input"
                      style={{
                        paddingLeft: '38px',
                        letterSpacing: '4px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        borderColor: fieldErrors.resetCode ? 'var(--danger)' : 'var(--border-subtle)'
                      }}
                      placeholder="••••••"
                      value={resetCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setResetCode(val);
                        if (fieldErrors.resetCode) setFieldErrors({ ...fieldErrors, resetCode: null });
                      }}
                    />
                  </div>
                  {fieldErrors.resetCode && (
                    <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>
                      {fieldErrors.resetCode}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Password */}
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  <span>{mode === 'forgot' ? 'New Password' : 'Password'}</span>
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
                      padding: 0,
                      transition: 'var(--transition)'
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
                  placeholder={mode === 'forgot' ? 'Enter new password (min 6 chars)' : mode === 'register' ? 'Min 6 characters' : 'Enter password'}
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

            {/* Confirm Password (Register or Forgot mode) */}
            {(mode === 'register' || mode === 'forgot') && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  <span>{mode === 'forgot' ? 'Confirm New Password' : 'Confirm Password'}</span>
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
                    placeholder="Re-enter new password"
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
                marginTop: '8px',
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
                      ? 'Resetting Password...' 
                      : 'Signing In...'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'register' 
                      ? 'Create Free Account' 
                      : mode === 'forgot' 
                      ? 'Reset Password & Continue' 
                      : 'Sign In to Dashboard'}
                  </span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
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
          <span>🔒 Secured with BCrypt password hashing & JWT token encryption.</span>
        </div>
      </div>
    </div>
  );
}
