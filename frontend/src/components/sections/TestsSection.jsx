import { useState, useEffect } from 'react'
import api from '../../api/client'

export default function TestsSection({ openModal, closeModal }) {
  const [tests, setTests] = useState([])
  const [papers, setPapers] = useState([])
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [t, p, c, b, g] = await Promise.all([
        api.get('/tests'), api.get('/admin/papers'),
        api.get('/courses'), api.get('/batches'), api.get('/groups'),
      ])
      setTests(t.data); setPapers(p.data); setCourses(c.data); setBatches(b.data); setGroups(g.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const paperMap = Object.fromEntries(papers.map(p => [p.id, p]))

  const STATUS_COLORS = { upcoming: '#1565c0', live: 'var(--success)', completed: 'var(--text-muted)', archived: 'var(--text-muted)' }

  const showCreate = () => {
    openModal({
      title: 'Create Test',
      content: (
        <>
          <div className="form-group"><label>Test Name</label><input id="m-name" type="text" placeholder="e.g. Mid-Term Test 2025" /></div>
          <div className="form-group"><label>Test Code (optional)</label><input id="m-code" type="text" placeholder="e.g. MT2025-01" /></div>
          <div className="form-group">
            <label>Question Paper</label>
            <select id="m-paper">
              <option value="">-- Select Paper --</option>
              {papers.map(p => <option key={p.id} value={p.id}>[{p.id}] {p.title}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group"><label>Start Time</label><input id="m-start" type="datetime-local" /></div>
            <div className="form-group"><label>End Time</label><input id="m-end" type="datetime-local" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group"><label>Duration (min)</label><input id="m-dur" type="number" defaultValue={60} min={1} /></div>
            <div className="form-group"><label>Negative Marks</label><input id="m-neg" type="number" defaultValue={0} min={0} step={0.25} /></div>
            <div className="form-group"><label>Pass % </label><input id="m-pass" type="number" defaultValue={40} min={0} max={100} /></div>
          </div>
          <div id="m-alert" className="alert alert-error" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const name = document.getElementById('m-name').value.trim()
            const paper_id = parseInt(document.getElementById('m-paper').value)
            const alertEl = document.getElementById('m-alert')
            alertEl.style.display = 'none'
            if (!name || !paper_id) { alertEl.textContent = 'Name and paper are required.'; alertEl.style.display = 'block'; return }
            try {
              await api.post('/tests', {
                name,
                code: document.getElementById('m-code').value.trim() || null,
                paper_id,
                start_time: document.getElementById('m-start').value || null,
                end_time: document.getElementById('m-end').value || null,
                duration_minutes: parseInt(document.getElementById('m-dur').value),
                negative_marks: parseFloat(document.getElementById('m-neg').value),
                pass_percentage: parseFloat(document.getElementById('m-pass').value),
              })
              closeModal(); load()
            } catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Create Test</button>
        </>
      ),
    })
  }

  const showReport = async (test) => {
    let report = null
    try { const { data } = await api.get(`/tests/${test.id}/report`); report = data } catch {}
    openModal({
      title: `Report — ${test.name}`,
      content: report ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          {[
            ['Total Submissions', report.total_submissions],
            ['Passed', report.passed],
            ['Failed', report.failed],
            ['Pass Rate', `${report.pass_rate}%`],
            ['Average Score', report.average_score],
            ['Highest Score', report.highest_score],
            ['Lowest Score', report.lowest_score],
          ].map(([label, val]) => (
            <div key={label} style={{ border: '1px solid var(--border)', padding: '0.85rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)' }}>{val}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">No submissions yet for this test.</div>
      ),
      footer: <button className="btn-secondary" onClick={closeModal}>Close</button>,
    })
  }

  const showAssign = (test) => {
    openModal({
      title: `Assign — ${test.name}`,
      content: (
        <>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Assign this test to individual students, batches, or groups.
          </p>
          <div className="form-group">
            <label>Batch</label>
            <select id="m-batch">
              <option value="">-- None --</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Group</label>
            <select id="m-group">
              <option value="">-- None --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div id="m-alert" className="alert alert-error" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const batch_id = document.getElementById('m-batch').value
            const group_id = document.getElementById('m-group').value
            const alertEl = document.getElementById('m-alert')
            alertEl.style.display = 'none'
            if (!batch_id && !group_id) { alertEl.textContent = 'Select at least one batch or group.'; alertEl.style.display = 'block'; return }
            try {
              await api.post(`/tests/${test.id}/assign`, {
                batch_ids: batch_id ? [parseInt(batch_id)] : [],
                group_ids: group_id ? [parseInt(group_id)] : [],
              })
              closeModal()
            } catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Assign</button>
        </>
      ),
    })
  }

  if (loading) return <div className="loading">Loading tests...</div>

  return (
    <>
      <div className="section-header">
        <h3>Tests ({tests.length})</h3>
        <button className="btn-action" onClick={showCreate}>Create Test</button>
      </div>
      <table className="data-table">
        <thead><tr><th>Name</th><th>Paper</th><th>Start Time</th><th>Duration</th><th>Neg. Marks</th><th>Pass %</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {tests.length === 0
            ? <tr><td colSpan={8} className="empty-state">No tests yet.</td></tr>
            : tests.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>{t.name}</td>
                <td><span className="paper-id">{t.paper_id}</span> {paperMap[t.paper_id]?.title || ''}</td>
                <td style={{ fontSize: '0.82rem' }}>{t.start_time ? new Date(t.start_time).toLocaleString() : '--'}</td>
                <td>{t.duration_minutes} min</td>
                <td>{t.negative_marks > 0 ? `-${t.negative_marks}` : '0'}</td>
                <td>{t.pass_percentage}%</td>
                <td><span style={{ fontSize: '0.75rem', fontWeight: 700, color: STATUS_COLORS[t.status] }}>{t.status}</span></td>
                <td style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn-secondary" onClick={() => showReport(t)}>Report</button>
                  <button className="btn-secondary" onClick={() => showAssign(t)}>Assign</button>
                  <button className="btn-danger" onClick={async () => {
                    if (!confirm(`Archive test "${t.name}"?`)) return
                    try { await api.delete(`/tests/${t.id}`); load() } catch {}
                  }}>Archive</button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </>
  )
}
