import { useState, useEffect } from 'react'
import api from '../../api/client'

export default function AuditSection() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ action: '', actor: '', entity_type: '' })

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.action) params.append('action', filters.action)
      if (filters.actor) params.append('actor_email', filters.actor)
      if (filters.entity_type) params.append('entity_type', filters.entity_type)
      const { data } = await api.get(`/audit?${params}`)
      setLogs(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const fmtDate = (s) => s ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '--'

  const ACTION_COLORS = {
    CREATE: '#22c55e', UPDATE: '#3b82f6', DELETE: '#ef4444',
    APPROVE: '#22c55e', REJECT: '#ef4444', DISABLE: '#f59e0b',
  }
  const getActionColor = (action) => {
    const key = Object.keys(ACTION_COLORS).find(k => action?.startsWith(k))
    return key ? ACTION_COLORS[key] : 'var(--accent)'
  }

  return (
    <>
      <div className="section-header">
        <h3>Audit Log ({logs.length})</h3>
        <button className="btn-secondary" style={{ fontSize: '0.78rem' }} onClick={async () => {
          try {
            const res = await api.get('/audit?limit=1000', { responseType: 'blob' })
            // Convert to CSV manually
            const text = await res.data.text()
            const data = JSON.parse(text)
            const rows = [['Time', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'Detail']]
            data.forEach(l => rows.push([l.created_at, l.actor_email || '', l.action, l.entity_type || '', l.entity_id || '', l.detail || '']))
            const csv = '\ufeff' + rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = 'audit_log.csv'; a.click()
            URL.revokeObjectURL(url)
          } catch { alert('Export failed') }
        }}>Export CSV</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <input className="lookup-input" placeholder="Filter by action (e.g. CREATE)" value={filters.action}
          onChange={e => setFilters({ ...filters, action: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && load()} />
        <input className="lookup-input" placeholder="Filter by actor email" value={filters.actor}
          onChange={e => setFilters({ ...filters, actor: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && load()} />
        <input className="lookup-input" placeholder="Filter by entity type (e.g. User)" value={filters.entity_type}
          onChange={e => setFilters({ ...filters, entity_type: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && load()} />
        <button className="btn-action" onClick={load}>Search</button>
      </div>

      {loading ? <div className="loading">Loading audit log...</div> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0
              ? <tr><td colSpan={5} className="empty-state">No audit entries.</td></tr>
              : logs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{fmtDate(l.created_at)}</td>
                  <td style={{ fontSize: '0.82rem' }}>{l.actor_email || '--'}</td>
                  <td>
                    <span style={{
                      fontFamily: 'Courier New, monospace',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: getActionColor(l.action),
                      background: 'rgba(0,0,0,0.04)',
                      padding: '0.15rem 0.4rem',
                      border: `1px solid ${getActionColor(l.action)}30`,
                    }}>{l.action}</span>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {l.entity_type && <span>{l.entity_type} <span className="paper-id">#{l.entity_id}</span></span>}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '240px' }}>{l.detail || '--'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      )}
    </>
  )
}
