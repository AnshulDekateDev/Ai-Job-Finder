import React, { useState, useEffect } from 'react';
import { jobApi, applicationApi } from '../../api';
import CoverLetterModal from '../coverletter/CoverLetterModal';
import { 
  Bookmark, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Building2, 
  MapPin, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function SavedJobsPage({ onNavigateToSearch }) {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobForCoverLetter, setSelectedJobForCoverLetter] = useState(null);

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
    setLoading(true);
    try {
      const res = await jobApi.getSavedJobs();
      setSavedJobs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (jobId) => {
    try {
      await jobApi.toggleSave(jobId);
      setSavedJobs(savedJobs.filter(s => s.job.id !== jobId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = async (job) => {
    try {
      await applicationApi.recordApplication(job.id, 'APPLICATION_STARTED');
      if (job.applicationUrl) {
        window.open(job.applicationUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.85rem' }}>Saved <span className="gradient-text">Jobs</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Your bookmarked opportunities ready for cover letters and applications.
        </p>
      </div>

      {savedJobs.length === 0 && !loading ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Bookmark size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Saved Jobs</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px', marginBottom: '16px' }}>
            Browse and bookmark jobs from the search tab to track them here.
          </p>
          <button onClick={onNavigateToSearch} className="btn btn-primary">
            Find Jobs Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {savedJobs.map((item) => {
            const { job } = item;
            return (
              <div key={item.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="badge badge-source">{job.sourceCode}</span>
                    <button
                      onClick={() => handleRemove(job.id)}
                      className="btn btn-outline"
                      style={{ padding: '4px 8px', color: 'var(--danger)' }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
                    {job.title}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Building2 size={14} color="var(--accent-primary)" />
                      {job.company}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={14} color="var(--accent-secondary)" />
                      {job.location} ({job.remoteType})
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <button
                    onClick={() => setSelectedJobForCoverLetter(job)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                  >
                    <Sparkles size={14} />
                    <span>Cover Letter</span>
                  </button>

                  <button
                    onClick={() => handleApply(job)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                  >
                    <span>Apply</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedJobForCoverLetter && (
        <CoverLetterModal
          job={selectedJobForCoverLetter}
          onClose={() => setSelectedJobForCoverLetter(null)}
        />
      )}
    </div>
  );
}
