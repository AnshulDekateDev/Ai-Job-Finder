import React, { useState, useEffect } from 'react';
import { resumeApi, integrationApi } from '../../api';
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
  AlertCircle,
  FolderGit2,
  Phone,
  Mail,
  Award,
  Cpu,
  Settings
} from 'lucide-react';

export default function ResumeUploadPage() {
  const [profile, setProfile] = useState(null);
  const [hasResume, setHasResume] = useState(false);
  const [resumeFilename, setResumeFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [aiProvider, setAiProvider] = useState(null);

  useEffect(() => {
    loadProfile();
    loadAiProvider();
  }, []);

  const loadAiProvider = async () => {
    try {
      const res = await integrationApi.getAiProviders();
      const active = (res.data || []).find(p => p.isActive);
      setAiProvider(active || null);
    } catch (err) {
      console.error('Failed to load AI providers:', err);
    }
  };

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
      if (err.response?.status === 401) {
        showNotification('Authentication session expired. Please sign in to upload your resume.', 'error');
      } else {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to parse resume file';
        showNotification(errorMsg, 'error');
      }
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
            Upload your PDF or DOCX resume. Your configured AI extracts all skills, experience, and projects for transparent job matching.
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

      {/* AI Parsing Engine Status Card */}
      <div className="glass-card" style={{
        padding: '14px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderLeft: aiProvider ? '4px solid #10b981' : '4px solid #f59e0b',
        background: aiProvider ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: aiProvider ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: aiProvider ? '#10b981' : '#f59e0b'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>AI Parsing Engine:</span>
              <span style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '6px',
                background: aiProvider ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: aiProvider ? '#10b981' : '#f59e0b',
                fontWeight: 700
              }}>
                {aiProvider ? `${aiProvider.providerType} (${aiProvider.modelName || 'gemini-1.5-flash'})` : 'OFFLINE NLP PARSER (FALLBACK)'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {aiProvider 
                ? 'Your resume text will be processed via live Google Gemini / OpenAI LLM to extract accurate skills, experience, projects, and education.' 
                : 'Configure your Google Gemini API key in Settings & Integrations to unlock deep neural resume parsing, match reasoning, and custom cover letters.'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Upload Card */}
        <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '90px' }}>
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
              {uploading ? 'Extracting Detailed Profile via AI...' : 'Click or Drag & Drop Resume File'}
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
                  <p style={{ fontSize: '0.75rem', color: 'var(--success)' }}>✓ AI Parsed & Verified</p>
                </div>
              </div>
              <span className="badge badge-ready">Active</span>
            </div>
          )}

          {profile && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.825rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Parsed Skills:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{skills.length} skills</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.825rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Experience Items:</span>
                <span style={{ fontWeight: 700 }}>{experiences.length} roles</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Projects Loaded:</span>
                <span style={{ fontWeight: 700 }}>{projects.length} projects</span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Details Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="var(--accent-secondary)" />
              <span>Parsed Candidate Profile</span>
            </h3>
            {profile && (
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <Save size={15} />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            )}
          </div>

          {!profile ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
              <User size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No Profile Loaded Yet</p>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Upload your resume on the left to extract your skills, experience, projects, and education.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* Basic Contact Info */}
              <div style={{ background: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} /> Contact & Personal Details
                </h4>
                
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
                    <label className="form-label"><span>Phone Number</span></label>
                    <input
                      type="text"
                      className="form-input"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span>Location / City</span></label>
                    <input
                      type="text"
                      className="form-input"
                      value={profile.location || ''}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      placeholder="e.g. Pune, Maharashtra, India"
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label"><span>Years of Experience</span></label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-input"
                      value={profile.yearsOfExperience || 0}
                      onChange={(e) => setProfile({ ...profile, yearsOfExperience: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label"><span>Highest Degree</span></label>
                    <input
                      type="text"
                      className="form-input"
                      value={profile.highestDegree || ''}
                      onChange={(e) => setProfile({ ...profile, highestDegree: e.target.value })}
                      placeholder="e.g. Bachelor of Engineering in Computer Engineering"
                    />
                  </div>
                </div>
              </div>

              {/* Skills Tags */}
              <div style={{ background: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Code size={16} /> Extracted Skills & Technologies ({skills.length})
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click × to remove</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
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
                    placeholder="Add verified skill (e.g. Docker, FinBERT, Spring Security)..."
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSkillInput.trim()) {
                        e.preventDefault();
                        if (!skills.includes(newSkillInput.trim())) {
                          updateSkillsList([...skills, newSkillInput.trim()]);
                        }
                        setNewSkillInput('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
                        updateSkillsList([...skills, newSkillInput.trim()]);
                        setNewSkillInput('');
                      }
                    }}
                  >
                    + Add Skill
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div style={{ background: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} /> Professional Summary
                </h4>
                <textarea
                  className="form-textarea"
                  value={profile.summary || ''}
                  onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                  rows={3}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Work Experience */}
              {experiences.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase size={16} /> Work Experience & Internships ({experiences.length})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {experiences.map((exp, i) => (
                      <div key={i} style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{exp.title || 'Role'}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)' }}>{exp.company || ''}</p>
                          </div>
                          {exp.duration && (
                            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>{exp.duration}</span>
                          )}
                        </div>
                        {exp.description && (
                          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FolderGit2 size={16} /> Key Projects ({projects.length})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {projects.map((proj, i) => (
                      <div key={i} style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                          <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{proj.name || 'Project'}</p>
                          {proj.technologies && (
                            <span className="badge badge-ready" style={{ fontSize: '0.75rem' }}>
                              {Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}
                            </span>
                          )}
                        </div>
                        {proj.description && (
                          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                            {proj.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {educations.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <GraduationCap size={16} /> Education & Degrees ({educations.length})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {educations.map((edu, i) => (
                      <div key={i} style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{edu.degree || 'Degree'}</p>
                          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{edu.institution || ''}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {edu.year && <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>{edu.year}</span>}
                          {edu.grade && <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>{edu.grade}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
