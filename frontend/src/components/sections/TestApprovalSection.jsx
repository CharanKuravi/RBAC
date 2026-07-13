import { useState, useEffect } from 'react'
import api from '../../api/client'

export default function TestApprovalSection({ openModal, closeModal }) {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/tests/pending-approval')
      setTests(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const decide = async (id, status, note = '') => {
    try {
      await api.post(`/tests/${id}/approve`, { status, note })
      load()
    } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const showReject = (t) => {
    openModal({
      title: `Reject Test — ${t.name}`,
      content: (
        <>
          <div className="form-group">
            <label>Rejection Note (optional)</label>
            <textarea id="rej-note" rows={3} placeholder="Reason for rejection..." />
          </div>
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-danger" onClick={() => {
            const note = document.getElementById('rej-note').value.trim()
            decide(t.id, 'rejected', note)
            closeModal()
          }}>Reject</button>
        </>
      ),
    })
  }

  if (loading) return <div className="loading">Loading pending tests...</div>

  return (
    <>
      <div className="section-header">
        <h3>Test Approval ({tests.length} pending)</h3>
      </div>

      {tests.length === 0 ? (
        <div className="empty-state">No tests pending approval.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Paper</th>
              <th>Duration</th>
              <th>Scheduled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(t => (
              <tr key={t.id}>
                <td><span className="paper-id">{t.id}</span></td>
                <td style={{ fontWeight: 600 }}>{t.name}</td>
                <td><span className="paper-id">{t.paper_id}</span></td>
                <td>{t.duration_minutes} min</td>
                <td style={{ fontSize: '0.82rem' }}>
                  {t.start_time ? new Date(t.start_time).toLocaleString() : '--'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn-action" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      onClick={() => decide(t.id, 'approved')}>Approve</button>
                    <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      onClick={() => showReject(t)}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
