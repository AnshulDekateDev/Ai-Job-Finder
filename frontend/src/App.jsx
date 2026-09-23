import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading AI Job Finder...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (!user && tab !== 'search') {
            setIsAuthModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
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
          <SettingsPage />
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
