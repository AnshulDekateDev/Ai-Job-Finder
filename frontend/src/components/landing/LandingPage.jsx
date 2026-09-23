import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Cpu, 
  Globe, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Search, 
  Lock, 
  Star,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Bookmark
} from 'lucide-react';

export default function LandingPage({ onGetStarted, onSignIn }) {
  const steps = [
    {
      num: '01',
      title: 'Configure Your Own Keys',
      desc: 'Connect your personal Google Gemini or OpenAI API keys and scraper proxies (ScraperAPI / Scrap.do). Your credentials stay encrypted with AES-256 in your private database.',
      icon: Cpu,
      color: 'var(--accent-primary)',
    },
    {
      num: '02',
      title: 'Upload Your Resume',
      desc: 'Upload any PDF or DOCX file. The AI engine extracts your verified skills, experience timeline, and project achievements into a structured candidate profile.',
      icon: FileText,
      color: 'var(--accent-secondary)',
    },
    {
      num: '03',
      title: 'Search & Match Top Jobs',
      desc: 'Crawl Greenhouse, Lever, RemoteOK, We Work Remotely, and custom boards simultaneously. Get the Top 30 ranked jobs scored with explainable match breakdowns.',
      icon: Search,
      color: 'var(--accent-tertiary)',
    },
  ];

  const features = [
    {
      icon: Globe,
      title: 'Multi-Board Aggregator',
      desc: 'Aggregate job postings across official company ATS systems (Greenhouse, Lever), remote boards (RemoteOK, WWR), and custom scrapers in parallel.',
    },
    {
      icon: TrendingUp,
      title: '6-Factor Weighted AI Matching',
      desc: 'Transparent scoring matrix: Skills (40%), Experience (20%), Title (15%), Location (10%), Projects (10%), and Education (5%). Zero hallucinations.',
    },
    {
      icon: Sparkles,
      title: 'AI Cover Letter Studio',
      desc: 'Generate tailored, professional cover letters for each job based exclusively on your resume facts and specific role requirements with 1 click.',
    },
    {
      icon: ShieldCheck,
      title: 'Zero Hardcoded Keys & AES-256',
      desc: 'All API keys are encrypted at rest with AES-256-GCM and masked in the UI. You retain full control over your models and usage quotas.',
    },
    {
      icon: Layers,
      title: 'Application Pipeline Tracker',
      desc: 'Track every job application through Saved, Applied, Interviewing, Offer, and Rejected stages with personalized notes and timelines.',
    },
    {
      icon: Zap,
      title: 'High-Speed Proxy & Scrap.do',
      desc: 'Built-in support for Scrap.do, ScraperAPI, Bright Data, and Apify to bypass anti-bot challenges and search Google Jobs seamlessly.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      {/* Landing Top Navigation */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(10, 13, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0 24px'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
            }}>
              <Sparkles size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                  AI Job <span className="gradient-text">Finder</span>
                </span>
                <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>v1.0</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>User-Configurable Job Intelligence</p>
            </div>
          </div>

          {/* Right Auth CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onSignIn}
              className="btn btn-outline"
              style={{ padding: '8px 18px', fontSize: '0.875rem' }}
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="btn btn-primary"
              style={{ padding: '8px 20px', fontSize: '0.875rem' }}
            >
              <span>Get Started Free</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '90px 24px 70px',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        {/* Glow ambient backgrounds */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(236, 72, 153, 0.08) 50%, transparent 80%)',
          filter: 'blur(70px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid var(--border-active)',
            color: 'var(--accent-primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '24px'
          }}>
            <Sparkles size={16} />
            <span>100% User-Configurable AI & Job Aggregator</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: '3.25rem',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '20px'
          }}>
            Find Your Dream Role With <br />
            <span className="gradient-text">Your Own AI & Custom Job Sources</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '740px',
            margin: '0 auto 36px'
          }}>
            No vendor lock-in. Connect your personal Google Gemini or OpenAI key, aggregate live Greenhouse, Lever, and RemoteOK boards, upload your resume, and get ranked match scores with factual evidence.
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={onGetStarted}
              className="btn btn-primary"
              style={{ padding: '14px 32px', fontSize: '1.05rem', fontWeight: 700, boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)' }}
            >
              <span>Launch Your Search</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={onSignIn}
              className="btn btn-outline"
              style={{ padding: '14px 28px', fontSize: '1.05rem' }}
            >
              <span>Existing User Sign In</span>
            </button>
          </div>

          {/* Trust badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            marginTop: '40px',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="var(--success)" /> AES-256-GCM Key Encryption
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--accent-primary)" /> Supabase PostgreSQL Connected
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} color="var(--accent-secondary)" /> Scrap.do & ScraperAPI Support
            </span>
          </div>
        </div>
      </section>

      {/* Live Interactive Preview Demo Card */}
      <section style={{ maxWidth: '1080px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div className="glass-card" style={{
          padding: '32px',
          border: '1px solid var(--border-active)',
          background: 'linear-gradient(180deg, rgba(20, 24, 38, 0.9) 0%, rgba(13, 16, 26, 0.95) 100%)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-info">Live Matching Preview</span>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Top Ranked Result</span>
            </div>
            <span className="badge badge-ready">Score: 94% Match</span>
          </div>

          <div className="grid-2" style={{ alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>Senior Java / Spring Boot Engineer</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '16px' }}>
                CloudScale Systems • Bangalore, India (Remote / Hybrid) • Greenhouse Board
              </p>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)', marginBottom: '6px' }}>
                  ✓ Matched Skills:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['Java 11/17', 'Spring Boot', 'PostgreSQL', 'Docker', 'REST API', 'Microservices'].map((s, i) => (
                    <span key={i} className="badge badge-ready" style={{ fontSize: '0.78rem' }}>{s}</span>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--warning)', marginBottom: '6px' }}>
                  ⚡ Missing / Growth Skill:
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className="badge badge-danger" style={{ fontSize: '0.78rem' }}>Kubernetes (K8s)</span>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> AI Match Analysis
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                "Candidate possesses 4+ years in high-throughput Spring Boot REST microservices and PostgreSQL database optimization matching 6 of 7 key requirements."
              </p>
              <button onClick={onGetStarted} className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}>
                <span>Try Live Job Finder Now</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process Section */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>How It Works in <span className="gradient-text">3 Simple Steps</span></h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            From API configuration to customized cover letters in less than 3 minutes.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="glass-card" style={{ padding: '32px', position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  top: '20px',
                  right: '24px',
                  fontSize: '2rem',
                  fontWeight: 900,
                  opacity: 0.15,
                  fontFamily: 'var(--font-mono)'
                }}>
                  {step.num}
                </span>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: step.color,
                  marginBottom: '20px'
                }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>{step.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Engineered For <span className="gradient-text">Total Control & Precision</span></h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            Built for developers and professionals who want factual, high-signal career opportunities.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div key={i} className="glass-card" style={{ padding: '28px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  marginBottom: '16px'
                }}>
                  <Icon size={22} />
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{feat.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to Action Footer Section */}
      <section style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'linear-gradient(180deg, rgba(10, 13, 20, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)',
        padding: '70px 24px 50px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '16px' }}>
            Ready to Find Your Next High-Impact Role?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px' }}>
            Create your account in seconds, configure your Gemini or OpenAI API keys, and start discovering factually matched opportunities today.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={onGetStarted}
              className="btn btn-primary"
              style={{ padding: '14px 36px', fontSize: '1.05rem', fontWeight: 700 }}
            >
              <span>Get Started Now</span>
              <ArrowRight size={18} />
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '40px' }}>
            AI Job Finder © 2026 • User-Configurable Job Intelligence • Built with Spring Boot, React, Supabase & AI
          </p>
        </div>
      </section>
    </div>
  );
}
