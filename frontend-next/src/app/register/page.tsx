'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useTheme } from '@/context/ThemeContext'
import '@/styles/auth.css'

export default function RegisterPage() {
  const { theme, toggle } = useTheme()
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '',
    phone: '', aadhaar: '', customer_code: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ cid: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/register/candidate', {
        full_name: form.full_name, email: form.email, password: form.password,
        phone: form.phone || null, aadhaar: form.aadhaar || null,
        customer_code: form.customer_code || null,
      })
      setSuccess(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="split-layout">
        <div className="split-form-side" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="split-form-inner" style={{ textAlign: 'center' }}>
            <div className="split-success-icon">🎉</div>
            <h2 className="split-form-title">Registration Successful</h2>
            <p className="split-form-sub">Your academic account has been created.</p>
            <div className="split-cid-box">
              <div className="split-cid-label">YOUR CANDIDATE ID</div>
              <div className="split-cid-value">{success.cid}</div>
            </div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Your account is pending admin approval. Save your Candidate ID — you'll need it for communication.
            </p>
            <Link href="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '0.8rem' }}>
              Back to Login
            </Link>
          </div>
        </div>
        <div className="split-info-side">
          <div className="split-info-inner">
            <span className="split-info-badge">STUDENT LEARNING PORTAL</span>
            <h1 className="split-info-title" style={{ marginTop: '1.5rem' }}>Almost There!</h1>
            <p className="split-info-desc">Your application is under review. Once approved by your institution admin, you'll have full access to your classroom.</p>
            <div className="split-trust-badges" style={{ marginTop: '2rem' }}>
              <span className="split-trust-badge">✓ Verified Identity Engine</span>
              <span className="split-trust-badge">✓ Secure Registration</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="split-layout">
      {/* ── Left — Form ── */}
      <div className="split-form-side">
        <button className="auth-theme-toggle" onClick={toggle}>
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>

        <div className="split-form-inner">
          <div className="split-brand">
            <span className="split-brand-badge">STUDENT LEARNING PORTAL</span>
          </div>

          <h2 className="split-form-title">Create Your Account</h2>
          <p className="split-form-sub">Join your college workspace to access exams and resources</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)} required placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label className="form-label">College Email ID</label>
              <input className="form-input" type="email" value={form.email}
                onChange={(e) => set('email', e.target.value)} required placeholder="you@college.edu" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Create Password</label>
                <input className="form-input" type="password" value={form.password}
                  onChange={(e) => set('password', e.target.value)} required placeholder="Min 8 chars" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password" value={form.confirm_password}
                  onChange={(e) => set('confirm_password', e.target.value)} required placeholder="Repeat" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Phone <span className="split-optional">(optional)</span></label>
                <input className="form-input" type="tel" value={form.phone}
                  onChange={(e) => set('phone', e.target.value)} placeholder="10-digit mobile" />
              </div>
              <div className="form-group">
                <label className="form-label">Aadhaar <span className="split-optional">(optional)</span></label>
                <input className="form-input" type="text" value={form.aadhaar}
                  onChange={(e) => set('aadhaar', e.target.value)} placeholder="12-digit" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Institution Code <span className="split-optional">(optional)</span></label>
              <input className="form-input" type="text" value={form.customer_code}
                onChange={(e) => set('customer_code', e.target.value.toUpperCase())} placeholder="e.g. GIST2025" />
            </div>

            <button className="btn-primary split-submit" type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Student Account'}
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
            Sign Up with Google
          </button>

          <p className="split-footer-link">
            Already have a student account? <Link href="/login">Sign In Here</Link>
          </p>
        </div>
      </div>

      {/* ── Right — Info Panel ── */}
      <div className="split-info-side">
        <div className="split-info-inner">
          <span className="split-info-badge">STUDENT LEARNING PORTAL</span>
          <div className="split-info-tag-row" style={{ marginTop: '0.75rem' }}>
            <span className="split-info-sub-badge">Strict Field Verification</span>
            <span className="split-info-sub-badge">Secure Signup</span>
          </div>

          <h1 className="split-info-title">Create Your<br />Academic Account</h1>
          <p className="split-info-desc">
            Join your college workspace to access lecture resources,
            complete online assessments, and track your academic performance.
          </p>

          <div className="split-features">
            <div className="split-feature-item">
              <span className="split-feature-icon">📚</span>
              <div>
                <div className="split-feature-title">Study Resources</div>
                <div className="split-feature-sub">Access all assigned materials</div>
              </div>
            </div>
            <div className="split-feature-item">
              <span className="split-feature-icon">✏️</span>
              <div>
                <div className="split-feature-title">Online Examinations</div>
                <div className="split-feature-sub">Timed, secure, auto-graded</div>
              </div>
            </div>
            <div className="split-feature-item">
              <span className="split-feature-icon">🏆</span>
              <div>
                <div className="split-feature-title">Certificates & Ranks</div>
                <div className="split-feature-sub">Download after result publication</div>
              </div>
            </div>
          </div>

          <div className="split-trust-badges">
            <span className="split-trust-badge">✓ Verified Identity Engine</span>
            <span className="split-trust-badge">✓ One Account Per Email</span>
          </div>
        </div>
      </div>
    </div>
  )
}
