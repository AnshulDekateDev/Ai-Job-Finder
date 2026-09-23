import React, { useState, useEffect } from 'react';
import { resumeApi } from '../../api';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  Sparkles, 
  Save, 
  Briefcase, 
  GraduationCap, 
  Code, 
  MapPin, 
  User, 
  Clock,
  Layers,
  AlertCircle
} from 'lucide-react';

export default function ResumeUploadPage() {
  const [profile, setProfile] = useState(null);
  const [hasResume, setHasResume] = useState(false);
  const [resumeFilename, setResumeFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [newSkillInput, setNewSkillInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await resumeApi.getProfile();
      setHasResume(res.data.hasResume);
      setResumeFilename(res.data.resumeFilename);
      if (res.data.profile) {
        setProfile(res.data.profile);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const showNotification = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await resumeApi.upload(formData);
      setProfile(res.data.profile);
      setHasResume(true);
      setResumeFilename(file.name);
      showNotification('Resume parsed and structured candidate profile created via AI!');
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to parse resume file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await resumeApi.updateProfile(profile);
      showNotification('Candidate profile updated successfully!');
    } catch (err) {
      showNotification('Failed to update candidate profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const parseList = (json) => {
    try {
      return JSON.parse(json || '[]');
    } catch (e) {
      return [];
    }
  };

  const updateSkillsList = (newList) => {
    setProfile({
      ...profile,
      skillsJson: JSON.stringify(newList),
    });
  };

  const skills = profile ? parseList(profile.skillsJson) : [];
  const experiences = profile ? parseList(profile.experienceJson) : [];
  const educations = profile ? parseList(profile.educationJson) : [];
  const projects = profile ? parseList(profile.projectsJson) : [];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Resume & <span className="gradient-text">Candidate Profile</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Upload your PDF or DOCX resume. Your configured AI will extract your skills, experience, and projects for factual job matching.
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

      <div className="grid-2">
        {/* Upload Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadCloud size={20} color="var(--accent-primary)" />
            <span>Upload Resume Document</span>
          </h3>

          <div
            style={{
              border: '2px dashed var(--border-active)',
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center',
              background: 'rgba(99, 102, 241, 0.04)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'var(--transition)'
            }}
          >
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0,
                cursor: 'pointer'
              }}
            />
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--accent-primary)'
            }}>
              {uploading ? <Sparkles size={28} className="spin" /> : <FileText size={28} />}
            </div>

            <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '6px' }}>
              {uploading ? 'Parsing & Extracting Profile via AI...' : 'Click or Drag & Drop Resume File'}
            </p>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Supports PDF, DOCX (Max 10MB)
            </p>
          </div>

          {hasResume && (
            <div style={{
              marginTop: '16px',
              padding: '14px 18px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={18} color="var(--accent-primary)" />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{resumeFilename || 'Uploaded Resume'}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--success)' }}>✓ Analyzed & Verified</p>
                </div>
              </div>
              <span className="badge badge-ready">Active</span>
            </div>
          )}
        </div>

        {/* Profile Overview Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="var(--accent-secondary)" />
              <span>Parsed Candidate Profile</span>
            </h3>
            {profile && (
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                <Save size={14} />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            )}
          </div>

          {!profile ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No profile loaded yet</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Upload your resume on the left or sign in to load your saved candidate details.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Basic Info */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label"><span>Candidate Name</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={profile.candidateName || ''}
                    onChange={(e) => setProfile({ ...profile, candidateName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><span>Email</span></label>
                  <input
                    type="email"
                    className="form-input"
                    value={profile.email || ''}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label"><span>Years of Experience</span></label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={profile.yearsOfExperience || 0}
                    onChange={(e) => setProfile({ ...profile, yearsOfExperience: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><span>Highest Degree</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={profile.highestDegree || ''}
                    onChange={(e) => setProfile({ ...profile, highestDegree: e.target.value })}
                  />
                </div>
              </div>

              {/* Skills Tags */}
              <div className="form-group">
                <label className="form-label">
                  <span>Extracted Skills ({skills.length})</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  {skills.map((skill, i) => (
                    <span key={i} className="badge badge-ready" style={{ padding: '6px 12px', fontSize: '0.825rem' }}>
                      {skill}
                      <button
                        type="button"
                        onClick={() => updateSkillsList(skills.filter((_, idx) => idx !== i))}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '6px' }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Add a verified skill (e.g. Docker, Redis)..."
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSkillInput.trim()) {
                        e.preventDefault();
                        updateSkillsList([...skills, newSkillInput.trim()]);
                        setNewSkillInput('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (newSkillInput.trim()) {
                        updateSkillsList([...skills, newSkillInput.trim()]);
                        setNewSkillInput('');
                      }
                    }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="form-group">
                <label className="form-label"><span>Executive Summary</span></label>
                <textarea
                  className="form-textarea"
                  value={profile.summary || ''}
                  onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
