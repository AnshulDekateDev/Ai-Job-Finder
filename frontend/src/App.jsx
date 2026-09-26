import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './components/landing/LandingPage';
import Navbar from './components/Navbar';
import JobSearchPage from './components/search/JobSearchPage';
import ResumeUploadPage from './components/resume/ResumeUploadPage';
import SavedJobsPage from './components/saved/SavedJobsPage';
import ApplicationTrackerPage from './components/applications/ApplicationTrackerPage';
import SettingsPage from './components/settings/SettingsPage';
import AuthModal from './components/auth/AuthModal';
import ErrorBoundary from './components/common/ErrorBoundary';

const PROTECTED_TABS = ['search', 'resume', 'saved', 'applications', 'settings'];

export default function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('search');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialIsRegister, setInitialIsRegister] = useState(false);

  // Sync URL route with authentication state and tab selection
  useEffect(() => {
    if (loading) return;

    const handleRouteChange = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();

      if (path === 'login') {
        if (user) {
          window.history.replaceState(null, '', `/${currentTab}`);
          setIsAuthModalOpen(false);
        } else {
          setInitialIsRegister(false);
          setIsAuthModalOpen(true);
        }
      } else if (path === 'register') {
        if (user) {
          window.history.replaceState(null, '', `/${currentTab}`);
          setIsAuthModalOpen(false);
        } else {
          setInitialIsRegister(true);
          setIsAuthModalOpen(true);
        }
      } else if (PROTECTED_TABS.includes(path)) {
        if (!user) {
          // Unauthenticated user accessing protected route -> redirect to /login
          window.history.replaceState(null, '', '/login');
          setInitialIsRegister(false);
          setIsAuthModalOpen(true);
        } else {
          setCurrentTab(path);
          setIsAuthModalOpen(false);
        }
      } else {
        // Root '/'
        if (user) {
          setIsAuthModalOpen(false);
        }
      }
    };

    handleRouteChange();
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [user, loading, currentTab]);

  const handleSelectTab = (tab) => {
    setCurrentTab(tab);
    window.history.pushState(null, '', `/${tab}`);
  };

  const handleOpenAuth = (isRegister = false) => {
    setInitialIsRegister(isRegister);
    setIsAuthModalOpen(true);
    window.history.pushState(null, '', isRegister ? '/register' : '/login');
  };

  const handleCloseAuth = () => {
    setIsAuthModalOpen(false);
    if (!user) {
      window.history.replaceState(null, '', '/');
    } else {
      window.history.replaceState(null, '', `/${currentTab}`);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        gap: '16px'
      }}>
        <div className="spin" style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--accent-primary)'
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
          Authenticating with Supabase...
        </p>
      </div>
    );
  }

  // Unauthenticated: Render Landing Page & Auth Modal
  if (!user) {
    return (
      <>
        <LandingPage
          onGetStarted={() => handleOpenAuth(true)}
          onSignIn={() => handleOpenAuth(false)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          initialIsRegister={initialIsRegister}
          onClose={handleCloseAuth}
        />
      </>
    );
  }

  // Authenticated: Render Main Application Workspace
  return (
    <div className="app-container">
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenAuth={() => handleOpenAuth(false)}
      />

      <main className="main-content">
        <ErrorBoundary onReset={() => handleSelectTab('search')}>
          {currentTab === 'search' && (
            <JobSearchPage
              onNavigateToSettings={() => handleSelectTab('settings')}
              onNavigateToResume={() => handleSelectTab('resume')}
            />
          )}

          {currentTab === 'resume' && (
            <ResumeUploadPage onNavigateToSettings={() => handleSelectTab('settings')} />
          )}

          {currentTab === 'saved' && (
            <SavedJobsPage onNavigateToSearch={() => handleSelectTab('search')} />
          )}

          {currentTab === 'applications' && (
            <ApplicationTrackerPage />
          )}

          {currentTab === 'settings' && (
            <SettingsPage onOpenAuth={() => handleOpenAuth(false)} />
          )}
        </ErrorBoundary>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        initialIsRegister={initialIsRegister}
        onClose={handleCloseAuth}
      />
    </div>
  );
}
