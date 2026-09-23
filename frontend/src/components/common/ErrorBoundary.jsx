import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 24px',
          maxWidth: '650px',
          margin: '40px auto',
          background: 'var(--bg-surface)',
          border: '1px solid var(--danger-border)',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
            Something went wrong rendering this view
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={this.handleReset}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={16} />
              <span>Retry / Back to Dashboard</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
