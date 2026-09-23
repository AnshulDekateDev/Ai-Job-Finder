import React, { useState, useEffect } from 'react';
import { jobApi } from '../../api';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Edit3, 
  RefreshCw, 
  XCircle, 
  Save, 
  FileText,
  Building2,
  AlertCircle
} from 'lucide-react';

export default function CoverLetterModal({ job, onClose }) {
  const [coverLetter, setCoverLetter] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (job) {
      generateLetter();
    }
  }, [job]);

  const generateLetter = async () => {
    if (!job) return;
    setLoading(true);
    setError('');
    try {
      const res = await jobApi.generateCoverLetter(job.id);
      setCoverLetter(res.data);
      setContent(res.data.userEditedContent || res.data.generatedContent);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate cover letter. Please verify that your resume is uploaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!coverLetter) return;
    setSaving(true);
    try {
      const res = await jobApi.updateCoverLetter(coverLetter.id, content);
      setCoverLetter(res.data);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save edited letter');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!job) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '10px', color: 'var(--accent-primary)' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>AI Tailored Cover Letter</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {job.title} at <strong style={{ color: 'var(--text-primary)' }}>{job.company}</strong>
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <XCircle size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div style={{
              padding: '12px 14px',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: '8px',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Sparkles size={36} className="spin" color="var(--accent-primary)" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>Synthesizing Personalized Cover Letter...</p>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Fact-checking candidate profile against {job.company} requirements.
              </p>
            </div>
          ) : (
            <div>
              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                  {coverLetter?.modelUsed || 'AI Generated'} • {content ? content.split(/\s+/).length : 0} words
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.775rem' }}
                  >
                    <Edit3 size={14} />
                    <span>{isEditing ? 'View Formatted' : 'Edit Text'}</span>
                  </button>

                  <button
                    onClick={generateLetter}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.775rem' }}
                    title="Regenerate"
                  >
                    <RefreshCw size={14} />
                    <span>Regenerate</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.775rem' }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </button>
                </div>
              </div>

              {/* Editor / Viewer */}
              {isEditing ? (
                <div>
                  <textarea
                    className="form-textarea"
                    rows={12}
                    style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', lineHeight: '1.6' }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      <Save size={14} />
                      <span>{saving ? 'Saving...' : 'Save Edits'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '20px',
                  background: 'var(--bg-surface)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  whiteSpace: 'pre-line',
                  lineHeight: '1.7',
                  fontSize: '0.925rem',
                  color: 'var(--text-primary)',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {content}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
