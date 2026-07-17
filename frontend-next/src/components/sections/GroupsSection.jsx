'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export default function GroupsSection({ openModal, closeModal }) {
  const [groups, setGroups] = useState([])
  const [batches, setBatches] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [g, b, s] = await Promise.all([
        api.get('/groups'),
        api.get('/batches'),
        api.get('/admin/users'),
      ])
      setGroups(g.data)
      setBatches(b.data)
      setStudents(s.data.filter(u => u.role === 'student'))
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const batchMap = Object.fromEntries(batches.map(b => [b.id, b]))

  // ── Create ──────────────────────────────────────────────────────────────────
  const showAdd = () => {
    openModal({
      title: 'Create Group',
      content: (
        <>
          <div className="form-group"><label>Group Name</label><input id="m-name" type="text" placeholder="e.g. Section A, Dept CSE" /></div>
          <div className="form-group"><label>Description (optional)</label><input id="m-desc" type="text" placeholder="Optional description" /></div>
          <div className="form-group">
            <label>Link to Batch (optional)</label>
            <select id="m-batch">
              <option value="">-- None --</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div id="m-alert" className="alert alert-error" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const name = document.getElementById('m-name').value.trim()
            const description = document.getElementById('m-desc').value.trim()
            const batch_id = document.getElementById('m-batch').value || null
            const alertEl = document.getElementById('m-alert')
            alertEl.style.display = 'none'
            if (!name) { alertEl.textContent = 'Group name is required.'; alertEl.style.display = 'block'; return }
            try {
              await api.post('/groups', { name, description, batch_id: batch_id ? parseInt(batch_id) : null })
              closeModal(); load()
            } catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Create Group</button>
        </>
      ),
    })
  }

  // ── Edit ────────────────────────────────────────────────────────────────────
  const showEdit = (g) => {
    openModal({
      title: `Edit Group — ${g.name}`,
      content: (
        <>
          <div className="form-group"><label>Group Name</label><input id="e-name" type="text" defaultValue={g.name} /></div>
          <div className="form-group"><label>Description</label><input id="e-desc" type="text" defaultValue={g.description || ''} /></div>
          <div className="form-group">
            <label>Link to Batch</label>
            <select id="e-batch" defaultValue={g.batch_id || ''}>
              <option value="">-- None --</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div id="e-alert" className="alert alert-error" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const alertEl = document.getElementById('e-alert')
            alertEl.style.display = 'none'
            const name = document.getElementById('e-name').value.trim()
            if (!name) { alertEl.textContent = 'Group name is required.'; alertEl.style.display = 'block'; return }
            try {
              await api.patch(`/groups/${g.id}`, {
                name,
                description: document.getElementById('e-desc').value.trim() || null,
                batch_id: document.getElementById('e-batch').value ? parseInt(document.getElementById('e-batch').value) : null,
              })
              closeModal(); load()
            } catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Save Changes</button>
        </>
      ),
    })
  }

  // ── Assign students ─────────────────────────────────────────────────────────
  const showAssignStudents = (g) => {
    openModal({
      title: `Assign Students — ${g.name}`,
      content: (
        <>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            {students.length} students available.
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
              <input type="checkbox" id="m-select-all" onChange={e => {
                const sel = document.getElementById('m-students')
                if (sel) Array.from(sel.options).forEach(o => o.selected = e.target.checked)
              }} />
              Select All
            </label>
          </div>
          <div className="form-group">
            <select id="m-students" multiple style={{ height: '180px' }}>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.roll_number} — {s.email}
                </option>
              ))}
            </select>
          </div>
          <div id="m-alert" className="alert alert-error" style={{ display: 'none' }} />
          <div id="m-success" className="alert alert-success" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Close</button>
          <button className="btn-action" onClick={async () => {
            const alertEl = document.getElementById('m-alert')
            const successEl = document.getElementById('m-success')
            alertEl.style.display = 'none'
            successEl.style.display = 'none'
            const sel = document.getElementById('m-students')
            const ids = Array.from(sel.selectedOptions).map(o => parseInt(o.value))
            if (ids.length === 0) { alertEl.textContent = 'Select at least one student.'; alertEl.style.display = 'block'; return }
            try {
              const { data } = await api.post(`/groups/${g.id}/assign-students`, { student_ids: ids })
              successEl.textContent = `Added ${data.added} student(s).`
              successEl.style.display = 'block'
              load()
            } catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Add Selected</button>
        </>
      ),
    })
  }

  if (loading) return <div className="loading">Loading groups...</div>

  return (
    <>
      <div className="section-header">
        <h3>Groups ({groups.length})</h3>
        <button className="btn-action" onClick={showAdd}>Create Group</button>
      </div>
      <table className="data-table">
        <thead><tr><th>Name</th><th>Description</th><th>Batch</th><th>Members</th><th>Actions</th></tr></thead>
        <tbody>
          {groups.length === 0
            ? <tr><td colSpan={5} className="empty-state">No groups yet.</td></tr>
            : groups.map(g => (
              <tr key={g.id}>
                <td style={{ fontWeight: 600 }}>{g.name}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{g.description || '--'}</td>
                <td>{batchMap[g.batch_id]?.name || '--'}</td>
                <td>{g.member_count}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      onClick={() => showAssignStudents(g)}>+ Students</button>
                    <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      onClick={() => showEdit(g)}>Edit</button>
                    <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      onClick={async () => {
                        if (!confirm(`Archive group "${g.name}"?`)) return
                        try { await api.delete(`/groups/${g.id}`); load() } catch {}
                      }}>Archive</button>
                  </div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </>
  )
}


