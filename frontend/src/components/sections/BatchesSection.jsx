import { useState, useEffect } from 'react'
import api from '../../api/client'

export default function BatchesSection({ openModal, closeModal }) {
  const [batches, setBatches] = useState([])
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [members, setMembers] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const [b, c, s] = await Promise.all([
        api.get('/batches'),
        api.get('/courses'),
        api.get('/admin/users?is_deleted=false'),
      ])
      setBatches(b.data)
      setCourses(c.data)
      setStudents(s.data.filter(u => u.role === 'student' && !u.is_deleted))
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const loadMembers = async (batchId) => {
    try { const { data } = await api.get(`/batches/${batchId}/students`); setMembers(data) } catch {}
  }

  const selectBatch = (b) => { setSelected(b); loadMembers(b.id) }
  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]))

  // ── Create ──────────────────────────────────────────────────────────────────
  const showAdd = () => {
    openModal({
      title: 'Create Batch',
      content: (
        <>
          <div className="form-group"><label>Batch Name</label><input id="m-name" type="text" placeholder="e.g. Nov 2025 Batch" /></div>
          <div className="form-group">
            <label>Linked Course</label>
            <select id="m-course">
              <option value="">-- None --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group"><label>Start Date</label><input id="m-start" type="datetime-local" /></div>
            <div className="form-group"><label>End Date</label><input id="m-end" type="datetime-local" /></div>
          </div>
          <div id="m-alert" className="alert alert-error" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const name = document.getElementById('m-name').value.trim()
            const course_id = document.getElementById('m-course').value || null
            const start_date = document.getElementById('m-start').value || null
            const end_date = document.getElementById('m-end').value || null
            const alertEl = document.getElementById('m-alert')
            alertEl.style.display = 'none'
            if (!name) { alertEl.textContent = 'Batch name is required.'; alertEl.style.display = 'block'; return }
            try {
              await api.post('/batches', { name, course_id: course_id ? parseInt(course_id) : null, start_date, end_date })
              closeModal(); load()
            } catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Create Batch</button>
        </>
      ),
    })
  }

  // ── Edit ────────────────────────────────────────────────────────────────────
  const showEdit = (b) => {
    openModal({
      title: `Edit Batch — ${b.name}`,
      content: (
        <>
          <div className="form-group"><label>Batch Name</label><input id="e-name" type="text" defaultValue={b.name} /></div>
          <div className="form-group">
            <label>Linked Course</label>
            <select id="e-course" defaultValue={b.course_id || ''}>
              <option value="">-- None --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group"><label>Start Date</label><input id="e-start" type="datetime-local" defaultValue={b.start_date ? b.start_date.slice(0, 16) : ''} /></div>
            <div className="form-group"><label>End Date</label><input id="e-end" type="datetime-local" defaultValue={b.end_date ? b.end_date.slice(0, 16) : ''} /></div>
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
            if (!name) { alertEl.textContent = 'Batch name is required.'; alertEl.style.display = 'block'; return }
            try {
              await api.patch(`/batches/${b.id}`, {
                name,
                course_id: document.getElementById('e-course').value ? parseInt(document.getElementById('e-course').value) : null,
                start_date: document.getElementById('e-start').value || null,
                end_date: document.getElementById('e-end').value || null,
              })
              closeModal(); load()
            } catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Save Changes</button>
        </>
      ),
    })
  }

  // ── Assign students ─────────────────────────────────────────────────────────
  const showAssignStudents = (b) => {
    const memberIds = new Set(members.map(m => m.id))
    const available = students.filter(s => !memberIds.has(s.id))

    openModal({
      title: `Assign Students — ${b.name}`,
      content: (
        <>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            {available.length} students available to add.
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
              {available.map(s => (
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
              const { data } = await api.post(`/batches/${b.id}/assign-students`, { student_ids: ids })
              successEl.textContent = `Added ${data.added} student(s). ${data.skipped} already in batch.`
              successEl.style.display = 'block'
              loadMembers(b.id)
            } catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Add Selected</button>
        </>
      ),
    })
  }

  const removeMember = async (studentId) => {
    if (!selected) return
    try { await api.delete(`/batches/${selected.id}/students/${studentId}`); loadMembers(selected.id) }
    catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  if (loading) return <div className="loading">Loading batches...</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
      <div>
        <div className="section-header">
          <h3>Batches ({batches.length})</h3>
          <button className="btn-action" onClick={showAdd}>Create Batch</button>
        </div>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Course</th><th>Students</th><th>Start</th><th>End</th><th>Actions</th></tr></thead>
          <tbody>
            {batches.length === 0
              ? <tr><td colSpan={6} className="empty-state">No batches yet.</td></tr>
              : batches.map(b => (
                <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => selectBatch(b)}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td>{courseMap[b.course_id]?.name || '--'}</td>
                  <td>{b.member_count}</td>
                  <td style={{ fontSize: '0.82rem' }}>{b.start_date ? new Date(b.start_date).toLocaleDateString() : '--'}</td>
                  <td style={{ fontSize: '0.82rem' }}>{b.end_date ? new Date(b.end_date).toLocaleDateString() : '--'}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => { selectBatch(b); showAssignStudents(b) }}>+ Students</button>
                      <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => showEdit(b)}>Edit</button>
                      <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={async () => {
                          if (!confirm(`Archive batch "${b.name}"?`)) return
                          try { await api.delete(`/batches/${b.id}`); load() } catch {}
                        }}>Archive</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Members panel */}
      {selected && (
        <div className="quota-panel">
          <div className="quota-header">
            <div className="quota-code">{selected.name}</div>
            <div className="quota-name">{courseMap[selected.course_id]?.name || 'No course'}</div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {members.length} student{members.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '300px', overflowY: 'auto' }}>
            {members.length === 0
              ? <div className="empty-state" style={{ padding: '1rem' }}>No students in this batch.</div>
              : members.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
                  <span className="roll-number">{m.roll_number}</span>
                  <button className="btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                    onClick={() => removeMember(m.id)}>Remove</button>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
