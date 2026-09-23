import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  integrationApi, 
  jobSourceApi, 
  preferenceApi 
} from '../../api';
import { 
  Cpu, 
  Globe, 
  Sliders, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Trash2, 
  Key, 
  ExternalLink,
  Lock,
  Zap,
  Info,
  User as UserIcon
} from 'lucide-react';

export default function SettingsPage({ onOpenAuth }) {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('ai');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // AI Providers state
  const [aiProviders, setAiProviders] = useState([]);
  const [newAiProvider, setNewAiProvider] = useState({
    providerType: 'GEMINI',
    apiKey: '',
    modelName: 'gemini-1.5-flash',
    baseUrl: '',
    isDefault: true,
  });
  const [testingAiId, setTestingAiId] = useState(null);

  // Scraper Providers state
  const [scrapers, setScrapers] = useState([]);
  const [newScraper, setNewScraper] = useState({
    providerType: 'SCRAPER_API',
    apiKey: '',
    baseUrl: '',
    isDefault: true,
  });
  const [testingScraperId, setTestingScraperId] = useState(null);

  // Job Sources state
  const [jobSources, setJobSources] = useState([]);
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [customSource, setCustomSource] = useState({
    name: '',
    code: '',
    baseUrl: '',
    searchUrlPattern: '',
    accessMethod: 'DIRECT_PUBLIC_FEED',
    scraperProviderRef: 'SCRAPER_API',
    isEnabled: true,
  });
  const [testingSourceId, setTestingSourceId] = useState(null);

  // Search Preferences state
  const [preferences, setPreferences] = useState({
    targetTitles: ['Java Developer', 'Backend Developer', 'Spring Boot Developer'],
    targetLocations: ['India', 'Remote India', 'Remote Worldwide'],
    countries: ['India', 'United States', 'United Kingdom', 'Germany', 'Canada', 'Australia'],
    workModes: ['REMOTE', 'HYBRID', 'ON_SITE'],
    experienceRange: '0-2 years',
    minMatchPercentage: 70,
    maxResults: 30,
  });
  const [newTitleInput, setNewTitleInput] = useState('');
  const [newLocationInput, setNewLocationInput] = useState('');

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      const [aiRes, scraperRes, sourceRes, prefRes] = await Promise.all([
        integrationApi.getAiProviders(),
        integrationApi.getScrapers(),
        jobSourceApi.getSources(),
        preferenceApi.getPreferences(),
      ]);
      setAiProviders(aiRes.data);
      setScrapers(scraperRes.data);
      setJobSources(sourceRes.data);

      if (prefRes.data) {
        setPreferences({
          targetTitles: JSON.parse(prefRes.data.targetTitlesJson || '[]'),
          targetLocations: JSON.parse(prefRes.data.targetLocationsJson || '[]'),
          countries: JSON.parse(prefRes.data.countriesJson || '[]'),
          workModes: JSON.parse(prefRes.data.workModesJson || '[]'),
          experienceRange: prefRes.data.experienceRange || '0-2 years',
          minMatchPercentage: prefRes.data.minMatchPercentage || 70,
          maxResults: prefRes.data.maxResults || 30,
        });
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // AI Handler
  const handleSaveAiProvider = async (e) => {
    e.preventDefault();
    if (!user) {
      showNotification('Please sign in or register to save your API keys', 'error');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!newAiProvider.apiKey || !newAiProvider.apiKey.trim()) {
      showNotification('Please enter a valid API Key', 'error');
      return;
    }
    try {
      await integrationApi.saveAiProvider({
        ...newAiProvider,
        apiKey: newAiProvider.apiKey.trim(),
        baseUrl: newAiProvider.baseUrl ? newAiProvider.baseUrl.trim() : ''
      });
      setNewAiProvider({ providerType: 'GEMINI', apiKey: '', modelName: 'gemini-1.5-flash', baseUrl: '', isDefault: true });
      showNotification('AI Provider credential saved and encrypted with AES-256');
      loadAllSettings();
    } catch (err) {
      showNotification(err.response?.data?.error || err.response?.data?.message || 'Failed to save AI provider', 'error');
    }
  };

  const handleTestAi = async (id) => {
    if (!user) {
      showNotification('Please sign in to test credentials', 'error');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setTestingAiId(id);
    try {
      const res = await integrationApi.testAiProvider(id);
      showNotification(res.data.message || 'AI Provider connection verified successfully!');
      loadAllSettings();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Connection test failed', 'error');
    } finally {
      setTestingAiId(null);
    }
  };

  const handleDeleteAi = async (id) => {
    if (!user) return;
    if (!window.confirm('Delete this AI provider credential?')) return;
    try {
      await integrationApi.deleteAiProvider(id);
      showNotification('AI Provider deleted');
      loadAllSettings();
    } catch (err) {
      showNotification('Failed to delete', 'error');
    }
  };

  // Scraper Handler
  const handleSaveScraper = async (e) => {
    e.preventDefault();
    if (!user) {
      showNotification('Please sign in or register to save your Scraper API keys', 'error');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!newScraper.apiKey || !newScraper.apiKey.trim()) {
      showNotification('Please enter a valid Scraper API key', 'error');
      return;
    }
    try {
      await integrationApi.saveScraper({
        ...newScraper,
        apiKey: newScraper.apiKey.trim(),
        baseUrl: newScraper.baseUrl ? newScraper.baseUrl.trim() : ''
      });
      setNewScraper({ providerType: 'SCRAPER_API', apiKey: '', baseUrl: '', isDefault: true });
      showNotification('Scraper Provider credential saved and encrypted');
      loadAllSettings();
    } catch (err) {
      showNotification(err.response?.data?.error || err.response?.data?.message || 'Failed to save Scraper provider', 'error');
    }
  };

  const handleTestScraper = async (id) => {
    if (!user) {
      showNotification('Please sign in to test scraper', 'error');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setTestingScraperId(id);
    try {
      const res = await integrationApi.testScraper(id);
      showNotification(res.data.message || 'Scraper connection verified successfully!');
      loadAllSettings();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Connection test failed', 'error');
    } finally {
      setTestingScraperId(null);
    }
  };

  const handleDeleteScraper = async (id) => {
    if (!user) return;
    if (!window.confirm('Delete this Scraper credential?')) return;
    try {
      await integrationApi.deleteScraper(id);
      showNotification('Scraper credential deleted');
      loadAllSettings();
    } catch (err) {
      showNotification('Failed to delete', 'error');
    }
  };

  // Job Source Handlers
  const handleToggleSource = async (id) => {
    if (!user) {
      showNotification('Please sign in to toggle job sources', 'error');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    try {
      await jobSourceApi.toggleSource(id);
      loadAllSettings();
    } catch (err) {
      showNotification('Failed to toggle source', 'error');
    }
  };

  const handleTestSource = async (id) => {
    if (!user) {
      showNotification('Please sign in to test job source', 'error');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setTestingSourceId(id);
    try {
      const res = await jobSourceApi.testSource(id);
      showNotification(`Source check: ${res.data.message}`);
      loadAllSettings();
    } catch (err) {
      showNotification('Source check failed', 'error');
    } finally {
      setTestingSourceId(null);
    }
  };

  const handleSaveCustomSource = async (e) => {
    e.preventDefault();
    if (!user) {
      showNotification('Please sign in or register to add custom job sources', 'error');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    try {
      await jobSourceApi.saveSource({
        ...customSource,
        name: customSource.name.trim(),
        baseUrl: customSource.baseUrl.trim(),
        searchUrlPattern: customSource.searchUrlPattern ? customSource.searchUrlPattern.trim() : ''
      });
      setIsAddSourceModalOpen(false);
      setCustomSource({ name: '', code: '', baseUrl: '', searchUrlPattern: '', accessMethod: 'DIRECT_PUBLIC_FEED', scraperProviderRef: 'SCRAPER_API', isEnabled: true });
      showNotification('Custom job source registered');
      loadAllSettings();
    } catch (err) {
      showNotification(err.response?.data?.error || err.response?.data?.message || 'Failed to add custom source', 'error');
    }
  };

  const handleDeleteSource = async (id) => {
    if (!user) return;
    if (!window.confirm('Remove this custom source?')) return;
    try {
      await jobSourceApi.deleteSource(id);
      showNotification('Job source removed');
      loadAllSettings();
    } catch (err) {
      showNotification('Failed to remove source', 'error');
    }
  };

  // Preferences Handler
  const handleSavePreferences = async () => {
    if (!user) {
      showNotification('Please sign in to save search preferences', 'error');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    try {
      await preferenceApi.updatePreferences({
        targetTitlesJson: JSON.stringify(preferences.targetTitles),
        targetLocationsJson: JSON.stringify(preferences.targetLocations),
        countriesJson: JSON.stringify(preferences.countries),
        workModesJson: JSON.stringify(preferences.workModes),
        experienceRange: preferences.experienceRange,
        minMatchPercentage: preferences.minMatchPercentage,
        maxResults: preferences.maxResults,
      });
      showNotification('Search preferences saved');
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to save search preferences', 'error');
    }
  };

  const tabs = [
    { id: 'ai', label: 'AI Providers', icon: Cpu },
    { id: 'scrapers', label: 'Scraper Providers', icon: Zap },
    { id: 'sources', label: 'Job Sources', icon: Globe },
    { id: 'preferences', label: 'Search Preferences', icon: Sliders },
    { id: 'security', label: 'Security & Encryption', icon: ShieldCheck },
  ];

  return (
    <div>
      {/* Title & Notification Banner */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Integration & <span className="gradient-text">Settings Hub</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Configure your AI LLMs, Web Scraper proxies, and Job Portals entirely from the UI with zero .env files.
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
            gap: '8px',
            animation: 'fadeIn 0.2s ease'
          }}>
            {message.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Guest Notice Banner if not logged in */}
      {!user && (
        <div style={{
          marginBottom: '24px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid var(--border-active)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserIcon size={22} color="var(--accent-primary)" />
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Sign In Required to Save Keys & Custom Sources</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Please sign in or register to encrypt and save your Gemini API keys, scraper proxies, and custom sources into your cloud database.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onOpenAuth} 
            className="btn btn-primary" 
            style={{ padding: '8px 20px', fontSize: '0.875rem' }}
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Sub-Tabs Nav */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '28px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px 10px 0 0',
                background: isActive ? 'var(--bg-surface)' : 'transparent',
                border: '1px solid transparent',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '1px solid transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              <Icon size={18} color={isActive ? 'var(--accent-primary)' : 'currentColor'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AI PROVIDERS */}
      {activeSubTab === 'ai' && (
        <div className="grid-2">
          {/* List of Configured Providers */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={20} color="var(--accent-primary)" />
              <span>Active AI Providers</span>
            </h3>

            {aiProviders.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
                <Info size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No AI API keys configured yet.</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  The application will operate in Demo Mode with fallback matching until you add your Gemini, OpenAI, or Anthropic key.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {aiProviders.map((cred) => (
                  <div 
                    key={cred.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{cred.providerType}</span>
                        {cred.default && <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Default</span>}
                        {cred.status === 'READY' && <span className="badge badge-ready">● Connected</span>}
                        {cred.status === 'INVALID_KEY' && <span className="badge badge-danger">✕ Invalid Key</span>}
                        {cred.status === 'UNTESTED' && <span className="badge badge-neutral">○ Untested</span>}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleTestAi(cred.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          disabled={testingAiId === cred.id}
                        >
                          <RefreshCw size={14} className={testingAiId === cred.id ? 'spin' : ''} />
                          <span>{testingAiId === cred.id ? 'Testing...' : 'Test Connection'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAi(cred.id)}
                          className="btn btn-danger"
                          style={{ padding: '6px 10px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Model: </span>
                        <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{cred.modelName || 'Default'}</code>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Masked Key: </span>
                        <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>{cred.maskedApiKey}</code>
                      </div>
                    </div>

                    {cred.lastStatusMessage && (
                      <p style={{ fontSize: '0.75rem', color: cred.status === 'READY' ? 'var(--success)' : 'var(--danger)' }}>
                        {cred.lastStatusMessage}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add / Update AI Provider Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} color="var(--accent-primary)" />
              <span>Configure AI Provider</span>
            </h3>

            <form onSubmit={handleSaveAiProvider}>
              <div className="form-group">
                <label className="form-label">
                  <span>Provider</span>
                </label>
                <select
                  className="form-select"
                  value={newAiProvider.providerType}
                  onChange={(e) => {
                    const pt = e.target.value;
                    let defaultM = 'gemini-1.5-flash';
                    if (pt === 'OPENAI') defaultM = 'gpt-4o-mini';
                    if (pt === 'ANTHROPIC') defaultM = 'claude-3-5-sonnet-20241022';
                    setNewAiProvider({ ...newAiProvider, providerType: pt, modelName: defaultM });
                  }}
                >
                  <option value="GEMINI">Google Gemini (Recommended)</option>
                  <option value="OPENAI">OpenAI (ChatGPT)</option>
                  <option value="ANTHROPIC">Anthropic (Claude)</option>
                  <option value="CUSTOM">OpenAI-Compatible Custom Provider</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>API Key</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>🔒 Encrypted with AES-256</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Key size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    className="form-input"
                    style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)' }}
                    placeholder="Enter your API Key (e.g. AIzaSy...)"
                    value={newAiProvider.apiKey}
                    onChange={(e) => setNewAiProvider({ ...newAiProvider, apiKey: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Model Selection</span>
                </label>
                {newAiProvider.providerType === 'GEMINI' ? (
                  <select
                    className="form-select"
                    value={newAiProvider.modelName}
                    onChange={(e) => setNewAiProvider({ ...newAiProvider, modelName: e.target.value })}
                  >
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast & Recommended)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  </select>
                ) : newAiProvider.providerType === 'OPENAI' ? (
                  <select
                    className="form-select"
                    value={newAiProvider.modelName}
                    onChange={(e) => setNewAiProvider({ ...newAiProvider, modelName: e.target.value })}
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. claude-3-5-sonnet-20241022"
                    value={newAiProvider.modelName}
                    onChange={(e) => setNewAiProvider({ ...newAiProvider, modelName: e.target.value })}
                  />
                )}
              </div>

              {newAiProvider.providerType === 'CUSTOM' && (
                <div className="form-group">
                  <label className="form-label">
                    <span>Base API URL (Optional)</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://api.yourprovider.com/v1"
                    value={newAiProvider.baseUrl}
                    onChange={(e) => setNewAiProvider({ ...newAiProvider, baseUrl: e.target.value })}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                <Lock size={16} />
                <span>Save & Encrypt Key</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SCRAPER PROVIDERS */}
      {activeSubTab === 'scrapers' && (
        <div className="grid-2">
          {/* Active Scraper List */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={20} color="var(--accent-secondary)" />
              <span>Configured Scraper Services</span>
            </h3>

            {scrapers.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
                <Info size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Using Direct Public Feeds</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Public job feeds (RemoteOK, Greenhouse, Lever, WeWorkRemotely) work directly. Add a ScraperAPI or BrightData key to enable structured Google Jobs proxy queries.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {scrapers.map((cred) => (
                  <div 
                    key={cred.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{cred.providerType}</span>
                        {cred.default && <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Default</span>}
                        {cred.status === 'READY' && <span className="badge badge-ready">● Connected</span>}
                        {cred.status === 'INVALID_KEY' && <span className="badge badge-danger">✕ Invalid Key</span>}
                        {cred.status === 'UNTESTED' && <span className="badge badge-neutral">○ Untested</span>}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleTestScraper(cred.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          disabled={testingScraperId === cred.id}
                        >
                          <RefreshCw size={14} className={testingScraperId === cred.id ? 'spin' : ''} />
                          <span>{testingScraperId === cred.id ? 'Testing...' : 'Test Connection'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteScraper(cred.id)}
                          className="btn btn-danger"
                          style={{ padding: '6px 10px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Masked Key: </span>
                      <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>{cred.maskedApiKey}</code>
                    </div>

                    {cred.lastStatusMessage && (
                      <p style={{ fontSize: '0.75rem', color: cred.status === 'READY' ? 'var(--success)' : 'var(--danger)' }}>
                        {cred.lastStatusMessage}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Scraper Form */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} color="var(--accent-secondary)" />
              <span>Add Scraper Provider</span>
            </h3>

            <form onSubmit={handleSaveScraper}>
              <div className="form-group">
                <label className="form-label">
                  <span>Provider</span>
                </label>
                <select
                  className="form-select"
                  value={newScraper.providerType}
                  onChange={(e) => setNewScraper({ ...newScraper, providerType: e.target.value })}
                >
                  <option value="SCRAPE_DO">Scrap.do / Scrape.do (High Success Web Scraping)</option>
                  <option value="SCRAPER_API">ScraperAPI (Recommended)</option>
                  <option value="BRIGHT_DATA">Bright Data</option>
                  <option value="APIFY">Apify</option>
                  <option value="CUSTOM">Custom Proxy Service</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Scraper API Key</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>🔒 Encrypted with AES-256</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Key size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    className="form-input"
                    style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)' }}
                    placeholder="Enter Scraper Key..."
                    value={newScraper.apiKey}
                    onChange={(e) => setNewScraper({ ...newScraper, apiKey: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                <Lock size={16} />
                <span>Save Scraper Provider</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: JOB SOURCES */}
      {activeSubTab === 'sources' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Configured Job Sources</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Enable or disable platforms the engine searches. Custom sources can be added with automated adapter parsing.
              </p>
            </div>
            <button 
              onClick={() => setIsAddSourceModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Add Custom Job Source</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
            {jobSources.map((source) => (
              <div 
                key={source.id} 
                className="glass-card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: source.enabled ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                  opacity: source.enabled ? 1 : 0.65
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{source.name}</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={source.enabled}
                        onChange={() => handleToggleSource(source.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    {source.status === 'READY' && <span className="badge badge-ready">● Ready</span>}
                    {source.status === 'NEEDS_CONFIG' && <span className="badge badge-needs-config">⚠ Needs config</span>}
                    {source.status === 'BLOCKED' && <span className="badge badge-blocked">✕ Cannot access</span>}
                    {source.status === 'UNAVAILABLE' && <span className="badge badge-error">✕ Unavailable</span>}
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{source.accessMethod}</span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', wordBreak: 'break-all' }}>
                    {source.baseUrl}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <button
                    onClick={() => handleTestSource(source.id)}
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: '0.775rem' }}
                    disabled={testingSourceId === source.id}
                  >
                    <RefreshCw size={13} className={testingSourceId === source.id ? 'spin' : ''} />
                    <span>{testingSourceId === source.id ? 'Testing...' : 'Test Source'}</span>
                  </button>

                  {source.custom && (
                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 10px', fontSize: '0.775rem' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom Source Modal */}
          {isAddSourceModalOpen && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <div className="modal-header">
                  <h3>Add Custom Job Source</h3>
                  <button onClick={() => setIsAddSourceModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <XCircle size={22} />
                  </button>
                </div>

                <form onSubmit={handleSaveCustomSource}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">
                        <span>Website Name</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. RemoteOK, TechCareers"
                        value={customSource.name}
                        onChange={(e) => setCustomSource({ ...customSource, name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span>Website Base URL</span>
                      </label>
                      <input
                        type="url"
                        required
                        className="form-input"
                        placeholder="https://example.com"
                        value={customSource.baseUrl}
                        onChange={(e) => setCustomSource({ ...customSource, baseUrl: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span>Job Search URL (Optional)</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="https://example.com/jobs?q={query}"
                        value={customSource.searchUrlPattern}
                        onChange={(e) => setCustomSource({ ...customSource, searchUrlPattern: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span>Access Method</span>
                      </label>
                      <select
                        className="form-select"
                        value={customSource.accessMethod}
                        onChange={(e) => setCustomSource({ ...customSource, accessMethod: e.target.value })}
                      >
                        <option value="DIRECT_PUBLIC_FEED">Direct Public Feed / API</option>
                        <option value="SCRAPER_PROVIDER">Scraper Provider Proxy</option>
                        <option value="OFFICIAL_API">Authorized Official API</option>
                      </select>
                    </div>

                    {customSource.accessMethod === 'SCRAPER_PROVIDER' && (
                      <div className="form-group">
                        <label className="form-label">
                          <span>Target Scraper Provider</span>
                        </label>
                        <select
                          className="form-select"
                          value={customSource.scraperProviderRef}
                          onChange={(e) => setCustomSource({ ...customSource, scraperProviderRef: e.target.value })}
                        >
                          <option value="SCRAPE_DO">Scrap.do / Scrape.do</option>
                          <option value="SCRAPER_API">ScraperAPI</option>
                          <option value="BRIGHT_DATA">Bright Data</option>
                          <option value="APIFY">Apify</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button type="button" onClick={() => setIsAddSourceModalOpen(false)} className="btn btn-outline">Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Source</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SEARCH PREFERENCES */}
      {activeSubTab === 'preferences' && (
        <div className="glass-card" style={{ padding: '28px', maxWidth: '840px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Default Search Preferences</h3>

          {/* Job Titles */}
          <div className="form-group">
            <label className="form-label">
              <span>Target Job Titles</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {preferences.targetTitles.map((title, i) => (
                <span key={i} className="badge badge-info" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                  {title}
                  <button
                    type="button"
                    onClick={() => setPreferences({
                      ...preferences,
                      targetTitles: preferences.targetTitles.filter((_, idx) => idx !== i)
                    })}
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
                placeholder="Add job title (e.g. Spring Boot Developer)..."
                value={newTitleInput}
                onChange={(e) => setNewTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTitleInput.trim()) {
                    e.preventDefault();
                    setPreferences({ ...preferences, targetTitles: [...preferences.targetTitles, newTitleInput.trim()] });
                    setNewTitleInput('');
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (newTitleInput.trim()) {
                    setPreferences({ ...preferences, targetTitles: [...preferences.targetTitles, newTitleInput.trim()] });
                    setNewTitleInput('');
                  }
                }}
              >
                + Add
              </button>
            </div>
          </div>

          {/* Locations */}
          <div className="form-group" style={{ marginTop: '20px' }}>
            <label className="form-label">
              <span>Preferred Locations & Work Modes</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {preferences.targetLocations.map((loc, i) => (
                <span key={i} className="badge badge-neutral" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                  {loc}
                  <button
                    type="button"
                    onClick={() => setPreferences({
                      ...preferences,
                      targetLocations: preferences.targetLocations.filter((_, idx) => idx !== i)
                    })}
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
                placeholder="Add location (e.g. India, Remote Worldwide)..."
                value={newLocationInput}
                onChange={(e) => setNewLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newLocationInput.trim()) {
                    e.preventDefault();
                    setPreferences({ ...preferences, targetLocations: [...preferences.targetLocations, newLocationInput.trim()] });
                    setNewLocationInput('');
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (newLocationInput.trim()) {
                    setPreferences({ ...preferences, targetLocations: [...preferences.targetLocations, newLocationInput.trim()] });
                    setNewLocationInput('');
                  }
                }}
              >
                + Add
              </button>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label className="form-label">
                <span>Experience Level</span>
              </label>
              <select
                className="form-select"
                value={preferences.experienceRange}
                onChange={(e) => setPreferences({ ...preferences, experienceRange: e.target.value })}
              >
                <option value="0-2 years">0 - 2 years (Entry / Junior)</option>
                <option value="2-5 years">2 - 5 years (Mid Level)</option>
                <option value="5+ years">5+ years (Senior / Lead)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Minimum Match Score: {preferences.minMatchPercentage}%</span>
              </label>
              <input
                type="range"
                min="40"
                max="90"
                step="5"
                value={preferences.minMatchPercentage}
                onChange={(e) => setPreferences({ ...preferences, minMatchPercentage: Number(e.target.value) })}
                style={{ width: '100%', marginTop: '10px' }}
              />
            </div>
          </div>

          <button onClick={handleSavePreferences} className="btn btn-primary" style={{ marginTop: '20px' }}>
            Save Search Preferences
          </button>
        </div>
      )}

      {/* TAB 5: SECURITY & ENCRYPTION */}
      {activeSubTab === 'security' && (
        <div className="glass-card" style={{ padding: '28px', maxWidth: '840px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: 'var(--success)' }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Enterprise-Grade Credential Protection</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>All user secrets are encrypted at rest with AES-256-GCM.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem' }}>
            <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--success)', marginBottom: '4px' }}>
                <CheckCircle2 size={16} />
                <span>Zero Frontend Key Exposure</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                Your API keys are masked immediately after saving (e.g. <code style={{ fontFamily: 'var(--font-mono)' }}>••••••••••••••••9F82</code>). Full credentials are never sent back in API responses or stored in browser localStorage.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--info)', marginBottom: '4px' }}>
                <CheckCircle2 size={16} />
                <span>Backend Decryption On-Demand</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                Credentials are only decrypted in memory during the precise moment an outgoing LLM prompt or Scraper query is dispatched to the provider.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--warning)', marginBottom: '4px' }}>
                <CheckCircle2 size={16} />
                <span>Access Control & Legal Scraper Compliance</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                The application does not bypass CAPTCHAs, paywalls, or anti-bot protections. Inaccessible endpoints gracefully display a status badge and transparent reason.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
