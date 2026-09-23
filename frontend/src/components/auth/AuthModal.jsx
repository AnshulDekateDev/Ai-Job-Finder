import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialIsRegister = false }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(initialIsRegister);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsRegister(initialIsRegister);
      setError('');
      setFieldErrors({});
    }
  }, [isOpen, initialIsRegister]);

  if (!isOpen) return null;

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
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
    if (isRegister) {
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

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (isRegister) {
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email.trim(), password, fullName.trim());
      } else {
        await login(email.trim(), password);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (regMode) => {
    setIsRegister(regMode);
    setError('');
    setFieldErrors({});
  };

  const strength = isRegister ? getPasswordStrength(password) : null;

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
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {isRegister ? 'Get started with AI job matching' : 'Sign in to access your jobs & keys'}
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

        {/* Auth Mode Toggle Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)'
        }}>
          <button
            type="button"
            onClick={() => switchMode(false)}
            style={{
              padding: '12px',
              border: 'none',
              background: !isRegister ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              borderBottom: !isRegister ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: !isRegister ? '#fff' : 'var(--text-secondary)',
              fontWeight: !isRegister ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode(true)}
            style={{
              padding: '12px',
              border: 'none',
              background: isRegister ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              borderBottom: isRegister ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: isRegister ? '#fff' : 'var(--text-secondary)',
              fontWeight: isRegister ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            Register
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} noValidate>
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

            {/* Full Name (Register only) */}
            {isRegister && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  <span>Full Name</span>
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: fieldErrors.fullName ? 'var(--danger)' : 'var(--text-muted)' }} />
                  <input
                    type="text"
                    autoComplete="name"
                    className="form-input"
                    style={{
                      paddingLeft: '38px',
                      borderColor: fieldErrors.fullName ? 'var(--danger)' : 'var(--border-subtle)'
                    }}
                    placeholder="e.g. Anshul Sharma"
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
                  autoComplete="email"
                  className="form-input"
                  style={{
                    paddingLeft: '38px',
                    borderColor: fieldErrors.email ? 'var(--danger)' : 'var(--border-subtle)'
                  }}
                  placeholder="e.g. anshul@example.com"
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

            {/* Password */}
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
              </div>

              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: fieldErrors.password ? 'var(--danger)' : 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  className="form-input"
                  style={{
                    paddingLeft: '38px',
                    paddingRight: '38px',
                    borderColor: fieldErrors.password ? 'var(--danger)' : 'var(--border-subtle)'
                  }}
                  placeholder={isRegister ? 'Min 6 characters' : 'Enter password'}
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

            {/* Confirm Password (Register only) */}
            {isRegister && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  <span>Confirm Password</span>
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: fieldErrors.confirmPassword ? 'var(--danger)' : 'var(--text-muted)' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
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
                  <span>{isRegister ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Create Free Account' : 'Sign In to Dashboard'}</span>
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
