import { useState, useEffect } from 'react'
import api from '../../api/client'

export default function AccessRequestsSection({ openModal, closeModal }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const { data } = await api.get('/admin/access-requests'); setRequests(data) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '--'

  const STATUS_COLORS = { pending: '#b8860b', approved: 'var(--success)', rejected: 'var(--error)' }

  const review = (req, action) => {
    openModal({
      title: `${action === 'approved' ? 'Approve' : 'Reject'} — ${req.institute}`,
      content: (
        <>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <div><strong>{req.full_name}</strong> · {req.email}</div>
            <div style={{ marginTop: '0.3rem', color: 'var(--text-muted)' }}>
              {req.institute} · Code: <strong>{req.code}</strong> · Plan: <strong>{req.plan}</strong> · Seats: <strong>{req.seat_limit}</strong>
            </div>
            {req.message && <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{req.message}"</div>}
          </div>
          <div className="form-group">
            <label>Admin Note (optional)</label>
            <textarea id="m-note" rows={3} placeholder={action === 'approved' ? 'Welcome message or instructions...' : 'Reason for rejection...'} />
          </div>
          <div id="m-alert" className="alert alert-error" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button
            className={action === 'approved' ? 'btn-action' : 'btn-danger'}
            onClick={async () => {
              const note = document.getElementById('m-note').value.trim()
              try {
                await api.patch(`/admin/access-requests/${req.id}`, { status: action, admin_note: note || null })
                closeModal(); load()
              } catch (err) {
                document.getElementById('m-alert').textContent = err.response?.data?.detail || 'Failed'
                document.getElementById('m-alert').style.display = 'block'
              }
            }}>
            {action === 'approved' ? 'Approve & Create College' : 'Reject'}
          </button>
        </>
      ),
    })
  }

  if (loading) return <div className="loading">Loading access requests...</div>

  const pending = requests.filter(r => r.status === 'pending')
  const reviewed = requests.filter(r => r.status !== 'pending')

  return (
    <>
      <div className="section-header">
        <h3>Access Requests ({requests.length})</h3>
        {pending.length > 0 && (
          <span style={{ fontSize: '0.78rem', background: '#b8860b', color: '#fff', padding: '0.2rem 0.6rem', fontWeight: 700 }}>
            {pending.length} pending
          </span>
        )}
      </div>

      {pending.length > 0 && (
        <>
          <div style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Pending Review
          </div>
          <table className="data-table" style={{ marginBottom: '1.5rem' }}>
            <thead><tr><th>Institute</th><th>Code</th><th>Contact</th><th>Plan</th><th>Seats</th><th>Requested</th><th>Actions</th></tr></thead>
            <tbody>
              {pending.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.institute}</td>
                  <td><span className="roll-number">{r.code}</span></td>
                  <td style={{ fontSize: '0.82rem' }}>{r.full_name}<br /><span style={{ color: 'var(--text-muted)' }}>{r.email}</span></td>
                  <td><span className="badge" style={{ background: 'rgba(26,58,92,0.1)', color: 'var(--accent)' }}>{r.plan}</span></td>
                  <td>{r.seat_limit}</td>
                  <td style={{ fontSize: '0.78rem' }}>{fmtDate(r.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn-action" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => review(r, 'approved')}>Approve</button>
                      <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => review(r, 'rejected')}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {reviewed.length > 0 && (
        <>
          <div style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Reviewed
          </div>
          <table className="data-table">
            <thead><tr><th>Institute</th><th>Code</th><th>Plan</th><th>Status</th><th>Reviewed</th><th>Note</th></tr></thead>
            <tbody>
              {reviewed.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.institute}</td>
                  <td><span className="roll-number">{r.code}</span></td>
                  <td>{r.plan}</td>
                  <td><span style={{ fontSize: '0.75rem', fontWeight: 700, color: STATUS_COLORS[r.status] }}>{r.status.toUpperCase()}</span></td>
                  <td style={{ fontSize: '0.78rem' }}>{fmtDate(r.reviewed_at)}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>{r.admin_note || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {requests.length === 0 && <div className="empty-state">No access requests yet.</div>}
    </>
  )
}
