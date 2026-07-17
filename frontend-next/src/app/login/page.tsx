'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { setAuth, isAdminRole } from '@/lib/auth'
import { useTheme } from '@/context/ThemeContext'
import '@/styles/auth.css'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      setAuth(data)
      router.replace(isAdminRole(data.role) ? '/admin' : '/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="split-layout">
      {/* ── Left — Form Panel ── */}
      <div className="split-form-side">
        <button className="auth-theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>

        <div className="split-form-inner">
          <div className="split-brand">
            <span className="split-brand-badge">STUDENT SSO PORTAL</span>
          </div>

          <h2 className="split-form-title">Student Login</h2>
          <p className="split-form-sub">Enter your institution email and password</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label className="form-label">COLLEGE EMAIL ADDRESS</label>
              <input
                type="email" placeholder="you@institution.edu"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                required className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">PASSWORD</label>
              <input
                type="password" placeholder="Enter your password"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required className="form-input"
              />
            </div>

            <div className="split-remember">
              <label className="split-remember-label">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                <span>Remember session</span>
              </label>
            </div>

            <button type="submit" className="btn-primary split-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In to Classroom'}
            </button>
          </form>

          <div className="split-divider"><span>OR CONTINUE WITH</span></div>

          <button className="split-google-btn" type="button">
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.1c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.2 7.4-10.5 7.4-17.3z" fill="#4285F4"/>
              <path d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.9 2.3-8 2.3-6.1 0-11.3-4.1-13.2-9.7H2.7v6.2C6.7 42.8 14.8 48 24 48z" fill="#34A853"/>
              <path d="M10.8 28.8c-.5-1.4-.7-2.8-.7-4.3s.3-3 .7-4.3v-6.2H2.7C1 17.4 0 20.6 0 24s1 6.6 2.7 9.1l8.1-4.3z" fill="#FBBC05"/>
              <path d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.7-6.7C35.9 2.5 30.5 0 24 0 14.8 0 6.7 5.2 2.7 12.9l8.1 4.3C12.7 11.6 17.9 9.5 24 9.5z" fill="#EA4335"/>
            </svg>
            Sign In with Google
          </button>

          <p className="split-footer-link">
            Don't have a student account?{' '}
            <Link href="/register">Create Student Account</Link>
          </p>
        </div>
      </div>

      {/* ── Right — Info Panel ── */}
      <div className="split-info-side">
        <div className="split-info-inner">
          <div className="split-info-badge-row">
            <span className="split-info-badge">STUDENT LEARNING PORTAL</span>
          </div>

          <h1 className="split-info-title">Welcome to Your<br />Classroom</h1>
          <p className="split-info-desc">
            Access your assigned study resources, interactive examinations,
            and real-time performance analytics — all in one place.
          </p>

          <div className="split-features">
            <div className="split-feature-item">
              <span className="split-feature-icon">🎓</span>
              <div>
                <div className="split-feature-title">Assigned Examinations</div>
                <div className="split-feature-sub">Timed, proctored, auto-graded tests</div>
              </div>
            </div>
            <div className="split-feature-item">
              <span className="split-feature-icon">📊</span>
              <div>
                <div className="split-feature-title">Performance Analytics</div>
                <div className="split-feature-sub">Live scores, ranks and certificates</div>
              </div>
            </div>
            <div className="split-feature-item">
              <span className="split-feature-icon">🛡️</span>
              <div>
                <div className="split-feature-title">Verified College Access</div>
                <div className="split-feature-sub">One account per institutional email</div>
              </div>
            </div>
            <div className="split-feature-item">
              <span className="split-feature-icon">📋</span>
              <div>
                <div className="split-feature-title">Grievance & Feedback</div>
                <div className="split-feature-sub">Raise issues, track resolutions</div>
              </div>
            </div>
          </div>

          <div className="split-trust-badges">
            <span className="split-trust-badge">✓ Verified College Access Only</span>
            <span className="split-trust-badge">✓ Activity Monitored</span>
            <span className="split-trust-badge">v2.0 Secure</span>
          </div>

          <div className="split-admin-link">
            Admin or Staff?{' '}
            <Link href="/admin">Sign in to Admin Portal →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
