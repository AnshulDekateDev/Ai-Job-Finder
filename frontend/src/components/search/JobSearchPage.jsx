import React, { useState, useEffect } from 'react';
import { 
  jobApi, 
  jobSourceApi, 
  resumeApi, 
  preferenceApi, 
  applicationApi 
} from '../../api';
import JobCard from './JobCard';
import CoverLetterModal from '../coverletter/CoverLetterModal';
import { 
  Search, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  MapPin, 
  Briefcase, 
  Globe, 
  Layers, 
  ChevronRight, 
  RotateCcw,
  Building2,
  FileText
} from 'lucide-react';

export default function JobSearchPage({ onNavigateToSettings, onNavigateToResume }) {
  // Query Filters state
  const [titles, setTitles] = useState(['Java Developer', 'Backend Developer', 'Spring Boot Developer']);
  const [newTitle, setNewTitle] = useState('');
  const [locations, setLocations] = useState(['India', 'Remote India', 'Remote Worldwide']);
  const [countries, setCountries] = useState(['India', 'United States', 'United Kingdom', 'Germany', 'Canada', 'Australia']);
  const [workModes, setWorkModes] = useState(['REMOTE', 'HYBRID', 'ON_SITE']);
  const [experienceRange, setExperienceRange] = useState('0-2 years');
  const [minMatchPercentage, setMinMatchPercentage] = useState(65);
  const [maxResults, setMaxResults] = useState(30);

  // Sources and Resume
  const [sources, setSources] = useState([]);
  const [hasResume, setHasResume] = useState(false);
  const [resumeName, setResumeName] = useState('');

  // Search execution & Results
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(null);
  const [results, setResults] = useState([]);
  const [searchStats, setSearchStats] = useState(null);
  const [selectedJobForCoverLetter, setSelectedJobForCoverLetter] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [srcRes, resRes, prefRes] = await Promise.all([
        jobSourceApi.getSources(),
        resumeApi.getProfile(),
        preferenceApi.getPreferences(),
      ]);

      setSources(srcRes.data);
      setHasResume(resRes.data.hasResume);
      setResumeName(resRes.data.resumeFilename);

      if (prefRes.data) {
        const safeParseArray = (val, defaultVal = []) => {
          if (!val) return defaultVal;
          if (Array.isArray(val)) return val;
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : defaultVal;
          } catch (e) {
            return defaultVal;
          }
        };
        if (prefRes.data.targetTitlesJson) setTitles(safeParseArray(prefRes.data.targetTitlesJson));
        if (prefRes.data.targetLocationsJson) setLocations(safeParseArray(prefRes.data.targetLocationsJson));
        if (prefRes.data.countriesJson) setCountries(safeParseArray(prefRes.data.countriesJson));
        if (prefRes.data.workModesJson) setWorkModes(safeParseArray(prefRes.data.workModesJson));
        if (prefRes.data.experienceRange) setExperienceRange(prefRes.data.experienceRange);
        if (prefRes.data.minMatchPercentage) setMinMatchPercentage(prefRes.data.minMatchPercentage);
      }
    } catch (e) {
      console.error('Error loading search criteria:', e);
    }
  };

  const showNotification = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleExecuteSearch = async () => {
    setSearching(true);
    setSearchProgress({
      step: 1,
      title: 'Reading Candidate Profile...',
      log: ['✓ Candidate profile loaded from database'],
    });

    try {
      // Simulate real-time progress steps while parallel backend queries execute
      const timer1 = setTimeout(() => {
        setSearchProgress((prev) => ({
          ...prev,
          step: 2,
          title: 'Querying Selected Job Sources...',
          log: [...prev.log, '✓ Querying Greenhouse & Lever job boards', '✓ Fetching RemoteOK live listings', '✓ Synchronizing WeWorkRemotely RSS feed'],
        }));
      }, 600);

      const timer2 = setTimeout(() => {
        setSearchProgress((prev) => ({
          ...prev,
          step: 3,
          title: 'Deduplicating & Matching Against Resume...',
          log: [...prev.log, '✓ Normalized and removed duplicate postings', '✓ Running hybrid weighted matching engine (Skills 40%, Exp 20%, Title 15%, Location 10%)'],
        }));
      }, 1400);

      const queryPayload = {
        titles,
        locations,
        countries,
        workModes,
        experienceRange,
        minMatchPercentage,
        maxResults,
      };

      const res = await jobApi.search(queryPayload);
      clearTimeout(timer1);
      clearTimeout(timer2);

      setResults(res.data.jobs || []);
      setSearchStats({
        totalRaw: res.data.totalRawFound,
        deduplicated: res.data.deduplicatedCount,
        matched: res.data.matchedCount,
        progressLog: res.data.progressLog || [],
      });

      setSearchProgress({
        step: 4,
        title: 'Ranking Finished',
        log: [
          '✓ Successfully processed ' + res.data.totalRawFound + ' raw listings',
          '✓ ' + res.data.deduplicatedCount + ' unique jobs after deduplication',
          '✓ Top ' + (res.data.jobs?.length || 0) + ' matches ranked for display',
        ],
      });

      setTimeout(() => setSearchProgress(null), 1200);
    } catch (err) {
      showNotification(err.response?.data?.error || 'Search failed. Please verify provider settings.', 'error');
      setSearchProgress(null);
    } finally {
      setSearching(false);
    }
  };

  const handleToggleSave = async (jobId) => {
    try {
      const res = await jobApi.toggleSave(jobId);
      const isSaved = res.data.saved;
      setResults(results.map(r => r.job.id === jobId ? { ...r, isSaved } : r));
      showNotification(isSaved ? 'Job bookmarked to Saved list' : 'Job removed from Saved');
    } catch (err) {
      showNotification('Failed to toggle save', 'error');
    }
  };

  const handleApply = async (job) => {
    try {
      await applicationApi.recordApplication(job.id, 'APPLICATION_STARTED');
      setResults(results.map(r => r.job.id === job.id ? { ...r, applicationStatus: 'APPLICATION_STARTED' } : r));
      // Open legitimate application URL in a new tab
      if (job.applicationUrl) {
        window.open(job.applicationUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSourceSelection = async (sourceId) => {
    try {
      await jobSourceApi.toggleSource(sourceId);
      setSources(sources.map(s => s.id === sourceId ? { ...s, enabled: !s.enabled } : s));
    } catch (err) {
      showNotification('Failed to toggle source', 'error');
    }
  };

  const toggleWorkMode = (mode) => {
    if (workModes.includes(mode)) {
      if (workModes.length > 1) setWorkModes(workModes.filter(m => m !== mode));
    } else {
      setWorkModes([...workModes, mode]);
    }
  };

  return (
    <div>
      {/* Header Banner */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Find Matched <span className="gradient-text">Jobs</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Multi-source aggregation with hybrid weighted resume matching and AI explanations.
          </p>
        </div>

        {message && (
          <div style={{
            padding: '10px 18px',
            borderRadius: '10px',
            background: message.type === 'error' ? 'var(--danger-bg)' : 'var(--success-bg)',
            border: `1px solid ${message.type === 'error' ? 'var(--danger-border)' : 'var(--success-border)'}`,
            color: message.type === 'error' ? 'var(--danger)' : 'var(--success)',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Left Filters (1/3) + Right Results (2/3) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Filter Sidebar */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="var(--accent-primary)" />
              <span>Search Filters</span>
            </h3>

            <button
              onClick={loadInitialData}
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              title="Reset"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Active Resume Indicator */}
          <div style={{
            padding: '12px 14px',
            background: hasResume ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: `1px solid ${hasResume ? 'var(--success-border)' : 'var(--warning-border)'}`,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color={hasResume ? 'var(--success)' : 'var(--warning)'} />
              <div>
                <p style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {hasResume ? (resumeName || 'Active Resume') : 'No Resume Uploaded'}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {hasResume ? 'Matching against verified skills' : 'Using default candidate profile'}
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateToResume}
              className="btn btn-outline"
              style={{ padding: '4px 8px', fontSize: '0.725rem' }}
            >
              {hasResume ? 'Change' : 'Upload'}
            </button>
          </div>

          {/* Job Titles */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <span>Target Job Titles</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {titles.map((t, idx) => (
                <span key={idx} className="badge badge-info" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                  {t}
                  <button
                    type="button"
                    onClick={() => setTitles(titles.filter((_, i) => i !== idx))}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '4px' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '0.825rem' }}
                placeholder="Add title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTitle.trim()) {
                    e.preventDefault();
                    setTitles([...titles, newTitle.trim()]);
                    setNewTitle('');
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                onClick={() => {
                  if (newTitle.trim()) {
                    setTitles([...titles, newTitle.trim()]);
                    setNewTitle('');
                  }
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Work Modes */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label"><span>Work Mode</span></label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['REMOTE', 'HYBRID', 'ON_SITE'].map((mode) => {
                const active = workModes.includes(mode);
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => toggleWorkMode(mode)}
                    className={active ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem' }}
                  >
                    {mode === 'ON_SITE' ? 'On-site' : mode.charAt(0) + mode.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience Range */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label"><span>Experience Level</span></label>
            <select
              className="form-select"
              value={experienceRange}
              onChange={(e) => setExperienceRange(e.target.value)}
            >
              <option value="0-2 years">0 - 2 years (Entry / Junior)</option>
              <option value="2-5 years">2 - 5 years (Mid-Level)</option>
              <option value="5+ years">5+ years (Senior / Lead)</option>
            </select>
          </div>

          {/* Min Match Score */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <span>Minimum Match Score: {minMatchPercentage}%</span>
            </label>
            <input
              type="range"
              min="50"
              max="90"
              step="5"
              value={minMatchPercentage}
              onChange={(e) => setMinMatchPercentage(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Job Sources Toggles */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}><span>Enabled Sources</span></label>
              <button
                onClick={onNavigateToSettings}
                style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Configure
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {sources.map((src) => (
                <label key={src.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.825rem', cursor: 'pointer', padding: '4px 0' }}>
                  <span style={{ color: src.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>{src.name}</span>
                  <input
                    type="checkbox"
                    checked={src.enabled}
                    onChange={() => toggleSourceSelection(src.id)}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* CTA Search Button */}
          <button
            onClick={handleExecuteSearch}
            disabled={searching}
            className="btn btn-primary pulse-glow"
            style={{ padding: '14px', fontSize: '1rem', fontWeight: 700, width: '100%', marginTop: '6px' }}
          >
            <Search size={18} />
            <span>{searching ? 'SEARCHING SOURCES...' : 'FIND MATCHED JOBS'}</span>
          </button>
        </div>

        {/* Right Area: Results List & Search Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Search Stats Header */}
          {searchStats && (
            <div style={{
              padding: '16px 20px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  Showing Top {results.length} Ranked Positions
                </h3>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Aggregated from {searchStats.totalRaw} raw posts across enabled portals • {searchStats.deduplicated} unique postings
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-ready">Top Ranked (Max 30)</span>
                <span className="badge badge-info">≥ {minMatchPercentage}% Match</span>
              </div>
            </div>
          )}

          {/* Results List */}
          {results.length === 0 && !searching && (
            <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--accent-primary)'
              }}>
                <Search size={32} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Ready to Search Positions</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px', margin: '8px auto 20px' }}>
                Click <strong>FIND MATCHED JOBS</strong> to query live listings across Greenhouse, Lever, RemoteOK, and configured custom sources.
              </p>
              <button onClick={handleExecuteSearch} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                <Search size={16} />
                <span>Search Jobs Now</span>
              </button>
            </div>
          )}

          {results.map((jobResult) => (
            <JobCard
              key={jobResult.job.id}
              jobResult={jobResult}
              onOpenCoverLetter={(job) => setSelectedJobForCoverLetter(job)}
              onToggleSave={handleToggleSave}
              onApply={handleApply}
            />
          ))}
        </div>
      </div>

      {/* Real-Time Search Progress Modal */}
      {searchProgress && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={22} className="spin" color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.2rem' }}>Searching For Jobs</h3>
              </div>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent-secondary)' }}>
                  {searchProgress.title}
                </p>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'var(--bg-surface)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem'
              }}>
                {searchProgress.log.map((item, i) => (
                  <div key={i} style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Modal */}
      {selectedJobForCoverLetter && (
        <CoverLetterModal
          job={selectedJobForCoverLetter}
          onClose={() => setSelectedJobForCoverLetter(null)}
        />
      )}
    </div>
  );
}
