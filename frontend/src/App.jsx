import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './components/landing/LandingPage';
import Navbar from './components/Navbar';
import JobSearchPage from './components/search/JobSearchPage';
import ResumeUploadPage from './components/resume/ResumeUploadPage';
import SavedJobsPage from './components/saved/SavedJobsPage';
import ApplicationTrackerPage from './components/applications/ApplicationTrackerPage';
import SettingsPage from './components/settings/SettingsPage';
import AuthModal from './components/auth/AuthModal';

export default function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('search');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialIsRegister, setInitialIsRegister] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading AI Job Finder...</p>
      </div>
    );
  }

  // If user is not authenticated, show Landing Page first
  if (!user) {
    return (
      <>
        <LandingPage
          onGetStarted={() => {
            setInitialIsRegister(true);
            setIsAuthModalOpen(true);
          }}
          onSignIn={() => {
            setInitialIsRegister(false);
            setIsAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          initialIsRegister={initialIsRegister}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  // Authenticated Main Service
  return (
    <div className="app-container">
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <main className="main-content">
        {currentTab === 'search' && (
          <JobSearchPage
            onNavigateToSettings={() => setCurrentTab('settings')}
            onNavigateToResume={() => setCurrentTab('resume')}
          />
        )}

        {currentTab === 'resume' && (
          <ResumeUploadPage />
        )}

        {currentTab === 'saved' && (
          <SavedJobsPage onNavigateToSearch={() => setCurrentTab('search')} />
        )}

        {currentTab === 'applications' && (
          <ApplicationTrackerPage />
        )}

        {currentTab === 'settings' && (
          <SettingsPage onOpenAuth={() => setIsAuthModalOpen(true)} />
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        initialIsRegister={initialIsRegister}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
