import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useTheme } from '../context/ThemeContext'

export default function Register() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '',
    phone: '', aadhaar: '', customer_code: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        phone: form.phone || null,
        aadhaar: form.aadhaar || null,
        customer_code: form.customer_code || null,
      }
      const { data } = await api.post('/register/candidate', payload)
      setSuccess(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
            Examination Management System
          </div>
          <h1 className="auth-title">Registration Successful</h1>
          <div style={{ margin: '1.5rem 0', padding: '1rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Candidate ID</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Courier New, monospace', color: 'var(--accent)', letterSpacing: '0.1em' }}>{success.cid}</div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Your account is pending admin approval. You will be able to log in once approved. Please note your Candidate ID.
          </p>
          <Link to="/login" className="btn-action" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <button className="theme-toggle" onClick={toggle} style={{ position: 'fixed', top: '1rem', right: '1rem' }}>
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </button>

      <div className="auth-card">
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
          Examination Management System
        </div>
        <h1 className="auth-title">Exam Centre</h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
          Candidate Registration
        </p>

        <form onSubmit={submit}>
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" value={form.full_name}
              onChange={e => set('full_name', e.target.value)} required placeholder="Your full name" />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={form.email}
              onChange={e => set('email', e.target.value)} required placeholder="your@email.com" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.password}
                onChange={e => set('password', e.target.value)} required placeholder="Min 8 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" value={form.confirm_password}
                onChange={e => set('confirm_password', e.target.value)} required placeholder="Repeat password" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Phone Number <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
              <input className="form-input" type="tel" value={form.phone}
                onChange={e => set('phone', e.target.value)} placeholder="10-digit mobile" />
            </div>
            <div className="form-group">
              <label className="form-label">Aadhaar Number <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
              <input className="form-input" type="text" value={form.aadhaar}
                onChange={e => set('aadhaar', e.target.value)} placeholder="12-digit Aadhaar" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Institution Code <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional — if provided by your institution)</span></label>
            <input className="form-input" type="text" value={form.customer_code}
              onChange={e => set('customer_code', e.target.value.toUpperCase())} placeholder="e.g. SVCE2025" />
          </div>

          <button className="btn-submit" type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    </div>
  )
}
