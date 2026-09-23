import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, 
  Search, 
  Bookmark, 
  FileText, 
  Settings, 
  CheckCircle2, 
  LogOut, 
  User as UserIcon,
  Sparkles,
  Layers
} from 'lucide-react';

export default function Navbar({ currentTab, onSelectTab, onOpenAuth }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'search', label: 'Find Jobs', icon: Search },
    { id: 'resume', label: 'Resume & Profile', icon: FileText },
    { id: 'saved', label: 'Saved Jobs', icon: Bookmark },
    { id: 'applications', label: 'Applications', icon: Layers },
    { id: 'settings', label: 'Settings & Integrations', icon: Settings, highlight: true },
  ];

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0 24px'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '68px',
        gap: '20px'
      }}>
        {/* Brand */}
        <div 
          onClick={() => onSelectTab('search')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
          }}>
            <Sparkles size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                AI Job <span className="gradient-text">Finder</span>
              </span>
              <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>v1.0</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>User-Configurable Job Intelligence</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
                  background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={17} color={isActive ? 'var(--accent-primary)' : 'currentColor'} />
                <span>{item.label}</span>
                {item.highlight && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-secondary)' }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Status & Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)'
              }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.fullName || user.email}
                </span>
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="btn btn-outline"
                style={{ padding: '8px 12px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-primary"
              style={{ padding: '8px 18px' }}
            >
              <UserIcon size={16} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
