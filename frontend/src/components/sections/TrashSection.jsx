import { useState, useEffect } from 'react'
import api from '../../api/client'

export default function TrashSection() {
  const [trash, setTrash] = useState({ users: [], papers: [] })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const { data } = await api.get('/admin/trash'); setTrash(data) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const restore = async (type, id) => {
    try {
      await api.post(`/admin/${type}/${id}/restore`)
      load()
    } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const permanentDelete = async (type, id) => {
    if (!confirm('Permanently delete? This cannot be undone.')) return
    try {
      await api.delete(`/admin/${type}/${id}/permanent`)
      load()
    } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const emptyTrash = async () => {
    if (!confirm('Empty entire trash? All items will be permanently deleted.')) return
    try { await api.post('/admin/trash/empty'); load() }
    catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const total = trash.users.length + trash.papers.length

  if (loading) return <div className="loading">Loading trash...</div>

  return (
    <>
      <div className="section-header">
        <h3>Trash ({total} items)</h3>
        {total > 0 && (
          <button className="btn-danger" onClick={emptyTrash}>Empty Trash</button>
        )}
      </div>

      {total === 0 ? (
        <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗑</div>
          <div>Trash is empty.</div>
        </div>
      ) : (
        <>
          {/* Deleted Users */}
          {trash.users.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem', marginTop: '1rem' }}>
                Candidates / Users ({trash.users.length})
              </div>
              <table className="data-table" style={{ marginBottom: '1.5rem' }}>
                <thead><tr><th>CID</th><th>Email</th><th>Name</th><th>Role</th><th>Actions</th></tr></thead>
                <tbody>
                  {trash.users.map(u => (
                    <tr key={u.id}>
                      <td><span className="roll-number">{u.cid || '--'}</span></td>
                      <td>{u.email}</td>
                      <td>{u.full_name || '--'}</td>
                      <td style={{ fontSize: '0.78rem', textTransform: 'uppercase' }}>{u.role}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                            onClick={() => restore('users', u.id)}>Restore</button>
                          <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                            onClick={() => permanentDelete('users', u.id)}>Delete Forever</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Deleted Papers */}
          {trash.papers.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Question Papers ({trash.papers.length})
              </div>
              <table className="data-table">
                <thead><tr><th>Set ID</th><th>Title</th><th>Subject</th><th>Actions</th></tr></thead>
                <tbody>
                  {trash.papers.map(p => (
                    <tr key={p.id}>
                      <td><span className="paper-id">{p.id}</span></td>
                      <td>{p.title}</td>
                      <td>{p.subject}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                            onClick={() => restore('papers', p.id)}>Restore</button>
                          <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                            onClick={() => permanentDelete('papers', p.id)}>Delete Forever</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </>
  )
}
