import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Key, Mail, User, Lock, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('anshul.developer@example.com');
  const [password, setPassword] = useState('Password123!');
  const [fullName, setFullName] = useState('Anshul Developer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, fullName);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '10px', color: 'var(--accent-primary)' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>{isRegister ? 'Create Account' : 'Welcome Back'}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {isRegister ? 'Configure your personal AI job hunter' : 'Sign in to access your jobs & keys'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '12px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {isRegister && (
              <div className="form-group">
                <label className="form-label">
                  <span>Full Name</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="e.g. Anshul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <span>Email Address</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Password</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
              >
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Processing...' : (isRegister ? 'Register & Start' : 'Sign In')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
