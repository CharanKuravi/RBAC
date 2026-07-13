import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useTheme } from '../context/ThemeContext'
import '../styles/auth.css'

export default function Profile() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  useEffect(() => {
    api.get('/auth/me').then(r => {
      setUser(r.data)
      setForm({ full_name: r.data.full_name || '', phone: r.data.phone || '' })
    }).catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg({ text: '', type: '' })
    try {
      await api.patch(`/admin/users/${user.id}`, {
        full_name: form.full_name || null,
        phone: form.phone || null,
      })
      setMsg({ text: 'Profile updated successfully.', type: 'success' })
      const r = await api.get('/auth/me')
      setUser(r.data)
    } catch (err) {
      setMsg({ text: err.response?.data?.detail || 'Failed to update.', type: 'error' })
    }
    setSaving(false)
  }

  if (loading) return <div className="auth-page"><div className="loading">Loading...</div></div>

  return (
    <div className="auth-page">
      <button className="auth-theme-toggle" onClick={toggle}>
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </button>

      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
          Examination Management System
        </div>
        <h1 className="auth-title" style={{ fontSize: '1.4rem' }}>My Profile</h1>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '0.85rem 1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Candidate ID</div>
              <div style={{ fontFamily: 'Courier New, monospace', fontWeight: 700, color: 'var(--accent)' }}>{user?.roll_number || '--'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role</div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</div>
              <div>{user?.email}</div>
            </div>
          </div>
        </div>

        <form onSubmit={save}>
          {msg.text && (
            <div className={`alert alert-${msg.type}`} style={{ marginBottom: '1rem' }}>{msg.text}</div>
          )}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Your full name" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" type="tel" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="10-digit mobile number" />
          </div>
          <button className="btn-submit" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => navigate(-1)} style={{ flex: 1 }}>Back</button>
          <button className="btn-secondary" onClick={() => { localStorage.clear(); navigate('/login') }} style={{ flex: 1 }}>Sign Out</button>
        </div>
      </div>
    </div>
  )
}
