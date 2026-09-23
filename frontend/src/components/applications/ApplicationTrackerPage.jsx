import React, { useState, useEffect } from 'react';
import { applicationApi } from '../../api';
import { 
  Layers, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Building2, 
  MapPin, 
  XCircle, 
  Send,
  HelpCircle
} from 'lucide-react';

const STAGES = [
  { id: 'APPLICATION_STARTED', label: 'Started', color: 'var(--info)' },
  { id: 'APPLIED', label: 'Applied', color: 'var(--accent-primary)' },
  { id: 'INTERVIEW', label: 'Interview', color: 'var(--success)' },
  { id: 'REJECTED', label: 'Rejected', color: 'var(--danger)' },
];

export default function ApplicationTrackerPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await applicationApi.getApplications();
      setApplications(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (jobId, newStatus) => {
    try {
      await applicationApi.recordApplication(jobId, newStatus);
      setApplications(applications.map(a => a.job.id === jobId ? { ...a, status: newStatus } : a));
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString();
    } catch (e) {
      return '—';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.85rem' }}>Application <span className="gradient-text">Tracker</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Track the lifecycle of all your submissions across job boards and career pages.
        </p>
      </div>

      {applications.length === 0 && !loading ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Layers size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Applications Tracked Yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            When you click "Apply Now" on any job card, the system automatically logs your progress here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {STAGES.map((stage) => {
            const stageApps = applications.filter(a => a.status === stage.id || (stage.id === 'APPLICATION_STARTED' && a.status === 'DISCOVERED'));
            return (
              <div key={stage.id} className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.color }} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{stage.label}</span>
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>{stageApps.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '120px' }}>
                  {stageApps.map((app) => (
                    <div
                      key={app.id}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <span className="badge badge-source" style={{ alignSelf: 'flex-start', fontSize: '0.7rem' }}>
                        {app.job.sourceCode}
                      </span>

                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: '1.3' }}>
                        {app.job.title}
                      </h4>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <p style={{ fontWeight: 600 }}>{app.job.company}</p>
                        <p style={{ color: 'var(--text-muted)' }}>{app.job.location}</p>
                      </div>

                      {/* Stage selector dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                        <select
                          className="form-select"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }}
                          value={app.status}
                          onChange={(e) => handleUpdateStatus(app.job.id, e.target.value)}
                        >
                          <option value="APPLICATION_STARTED">Started</option>
                          <option value="APPLIED">Applied</option>
                          <option value="INTERVIEW">Interview</option>
                          <option value="REJECTED">Rejected</option>
                        </select>

                        {app.originalApplicationUrl && (
                          <a
                            href={app.originalApplicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent-secondary)' }}
                            title="Open Link"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
