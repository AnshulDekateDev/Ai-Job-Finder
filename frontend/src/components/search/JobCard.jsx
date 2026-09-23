import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Calendar, 
  ExternalLink, 
  FileText, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Send
} from 'lucide-react';

export default function JobCard({ 
  jobResult, 
  onOpenCoverLetter, 
  onToggleSave, 
  onApply 
}) {
  const [expanded, setExpanded] = useState(false);
  const { job, jobMatch, isSaved, applicationStatus } = jobResult;

  const parseList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const matchedSkills = parseList(jobMatch.matchedSkillsJson);
  const missingSkills = parseList(jobMatch.missingSkillsJson);
  const matchPct = Math.round(jobMatch.matchPercentage || 0);

  const getScoreColorClass = (score) => {
    if (score >= 85) return 'match-high';
    if (score >= 70) return 'match-mid';
    return 'match-low';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="glass-card" style={{
      padding: '22px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      borderLeft: matchPct >= 85 ? '4px solid var(--success)' : (matchPct >= 70 ? '4px solid var(--warning)' : '4px solid var(--accent-primary)')
    }}>
      {/* Top row: Title, Company, Source Badge, Match Score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span className="badge badge-source" style={{ fontWeight: 700 }}>
              {job.sourceCode || 'Source'}
            </span>
            {job.remoteType && (
              <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                {job.remoteType}
              </span>
            )}
            {applicationStatus && applicationStatus !== 'DISCOVERED' && (
              <span className="badge badge-ready" style={{ fontSize: '0.725rem' }}>
                {applicationStatus}
              </span>
            )}
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {job.title}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
              <Building2 size={16} color="var(--accent-primary)" />
              {job.company}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={16} color="var(--accent-secondary)" />
              {job.location} {job.country ? `(${job.country})` : ''}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
              <Calendar size={15} />
              {formatDate(job.postedAt)}
            </span>
          </div>
        </div>

        {/* Match Percentage Visual Score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div className={`match-score-badge ${getScoreColorClass(matchPct)}`}>
            <Sparkles size={16} />
            <span>{matchPct}% Match</span>
          </div>

          <div style={{
            width: '120px',
            height: '6px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: `${matchPct}%`,
              height: '100%',
              background: matchPct >= 85 ? 'var(--success)' : (matchPct >= 70 ? 'var(--warning)' : 'var(--accent-primary)'),
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </div>
        </div>
      </div>

      {/* Skills Comparison row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {matchedSkills.map((skill, i) => (
          <span key={i} className="badge badge-ready" style={{ fontSize: '0.775rem' }}>
            <CheckCircle2 size={12} />
            <span>{skill}</span>
          </span>
        ))}
        {missingSkills.map((skill, i) => (
          <span key={i} className="badge badge-warning" style={{ fontSize: '0.775rem' }}>
            <AlertCircle size={12} />
            <span>{skill}</span>
          </span>
        ))}
      </div>

      {/* Expandable Match Explanation */}
      {expanded && (
        <div style={{
          padding: '16px',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          fontSize: '0.85rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          {jobMatch.matchSummary && (
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Why it matches: </span>
              <span style={{ color: 'var(--text-secondary)' }}>{jobMatch.matchSummary}</span>
            </div>
          )}

          {jobMatch.experienceSummary && (
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Experience Analysis: </span>
              <span style={{ color: 'var(--text-secondary)' }}>{jobMatch.experienceSummary}</span>
            </div>
          )}

          {jobMatch.locationSummary && (
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Location Compatibility: </span>
              <span style={{ color: 'var(--text-secondary)' }}>{jobMatch.locationSummary}</span>
            </div>
          )}

          {job.description && (
            <div style={{ marginTop: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Job Description Excerpt:
              </span>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.4', fontSize: '0.8rem' }}>
                {job.description.length > 320 ? job.description.substring(0, 320) + '...' : job.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Actions Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '14px'
      }}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
        >
          <span>{expanded ? 'Hide Analysis' : 'Why it matches'}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Save Button */}
          <button
            onClick={() => onToggleSave(job.id)}
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
            title={isSaved ? 'Remove from saved' : 'Save job'}
          >
            {isSaved ? <BookmarkCheck size={16} color="var(--accent-primary)" /> : <Bookmark size={16} />}
          </button>

          {/* Cover Letter Button */}
          <button
            onClick={() => onOpenCoverLetter(job)}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
          >
            <Sparkles size={15} color="var(--accent-primary)" />
            <span>Cover Letter</span>
          </button>

          {/* Apply Button */}
          <button
            onClick={() => onApply(job)}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.825rem' }}
          >
            <span>Apply Now</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
