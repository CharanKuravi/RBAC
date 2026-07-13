import { useState, useEffect } from 'react'
import api from '../../api/client'

export default function GrievancesSection({ openModal, closeModal }) {
  const [grievances, setGrievances] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const { data } = await api.get(`/grievances/admin${params}`)
      setGrievances(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const fmtDate = (s) => s ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '--'

  const STATUS_COLORS = { open: 'var(--error)', in_progress: '#b8860b', resolved: 'var(--success)' }

  const showResolve = (g) => {
    openModal({
      title: `Grievance — ${g.tracking_id}`,
      content: (
        <>
          <div style={{ background: 'var(--off-white)', border: '1px solid var(--border)', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>SUBJECT</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{g.subject}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{g.description}</div>
          </div>
          <div className="form-group">
            <label>Update Status</label>
            <select id="m-status" defaultValue={g.status}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="form-group">
            <label>Admin Note</label>
            <textarea id="m-note" rows={3} defaultValue={g.admin_note || ''} placeholder="Add a note for the student..." />
          </div>
          <div id="m-alert" className="alert alert-error" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const status = document.getElementById('m-status').value
            const admin_note = document.getElementById('m-note').value.trim()
            try { await api.patch(`/grievances/admin/${g.id}`, { status, admin_note }); closeModal(); load() }
            catch (err) { document.getElementById('m-alert').textContent = err.response?.data?.detail || 'Failed'; document.getElementById('m-alert').style.display = 'block' }
          }}>Update</button>
        </>
      ),
    })
  }

  return (
    <>
      <div className="section-header">
        <h3>Grievances ({grievances.length})</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['', 'open', 'in_progress', 'resolved'].map(s => (
            <button key={s} className={`lookup-tab${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
              {s === '' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <table className="data-table">
          <thead><tr><th>Tracking ID</th><th>Subject</th><th>Status</th><th>Raised</th><th>Resolved</th><th>Actions</th></tr></thead>
          <tbody>
            {grievances.length === 0
              ? <tr><td colSpan={6} className="empty-state">No grievances.</td></tr>
              : grievances.map(g => (
                <tr key={g.id}>
                  <td><span className="roll-number">{g.tracking_id}</span></td>
                  <td style={{ fontWeight: 500 }}>{g.subject}</td>
                  <td><span style={{ fontSize: '0.75rem', fontWeight: 700, color: STATUS_COLORS[g.status] }}>{g.status.replace('_', ' ').toUpperCase()}</span></td>
                  <td style={{ fontSize: '0.82rem' }}>{fmtDate(g.created_at)}</td>
                  <td style={{ fontSize: '0.82rem' }}>{fmtDate(g.resolved_at)}</td>
                  <td><button className="btn-secondary" onClick={() => showResolve(g)}>View / Update</button></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      )}
    </>
  )
}
