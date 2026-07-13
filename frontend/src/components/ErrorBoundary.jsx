import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--off-white)',
          padding: '2rem',
          fontFamily: 'var(--font)',
        }}>
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            padding: '3rem',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '0.75rem',
            }}>
              Exam Centre
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              An unexpected error occurred. You will be redirected shortly.
            </p>
            <div style={{
              background: 'var(--off-white)',
              border: '1px solid var(--border)',
              padding: '0.65rem 0.85rem',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              fontFamily: 'Courier New, monospace',
              textAlign: 'left',
              marginBottom: '1.5rem',
              wordBreak: 'break-all',
            }}>
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--navy)',
                color: 'var(--white)',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
              }}
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = '/'
              }}
            >
              Return to Home
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
