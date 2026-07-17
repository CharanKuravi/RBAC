'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export default function CoursesSection({ openModal, closeModal }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const { data } = await api.get('/courses'); setCourses(data) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deleteCourse = async (id, name) => {
    if (!confirm(`Archive course "${name}"?`)) return
    try { await api.delete(`/courses/${id}`); load() } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const showEdit = (c) => {
    openModal({
      title: `Edit Course — ${c.code}`,
      content: (
        <>
          <div className="form-group"><label>Course Name</label><input id="e-name" type="text" defaultValue={c.name} /></div>
          <div className="form-group"><label>Course Code</label><input id="e-code" type="text" defaultValue={c.code} /></div>
          <div className="form-group"><label>Description</label><textarea id="e-desc" rows={2} defaultValue={c.description || ''} /></div>
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
            const code = document.getElementById('e-code').value.trim()
            if (!name || !code) { alertEl.textContent = 'Name and code are required.'; alertEl.style.display = 'block'; return }
            try {
              await api.patch(`/courses/${c.id}`, { name, code, description: document.getElementById('e-desc').value.trim() })
              closeModal(); load()
            } catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Save Changes</button>
        </>
      ),
    })
  }

  const showAdd = () => {
    openModal({
      title: 'Add Course',
      content: (
        <>
          <div className="form-group"><label>Course Name</label><input id="m-name" type="text" placeholder="e.g. B.Tech Computer Science" /></div>
          <div className="form-group"><label>Course Code</label><input id="m-code" type="text" placeholder="e.g. BTCS" /></div>
          <div className="form-group"><label>Description (optional)</label><textarea id="m-desc" rows={2} placeholder="Brief description..." /></div>
          <div id="m-alert" className="alert alert-error" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const name = document.getElementById('m-name').value.trim()
            const code = document.getElementById('m-code').value.trim()
            const description = document.getElementById('m-desc').value.trim()
            const alertEl = document.getElementById('m-alert')
            alertEl.style.display = 'none'
            if (!name || !code) { alertEl.textContent = 'Name and code are required.'; alertEl.style.display = 'block'; return }
            try { await api.post('/courses', { name, code, description }); closeModal(); load() }
            catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Add Course</button>
        </>
      ),
    })
  }

  if (loading) return <div className="loading">Loading courses...</div>

  return (
    <>
      <div className="section-header">
        <h3>Courses ({courses.length})</h3>
        <button className="btn-action" onClick={showAdd}>Add Course</button>
      </div>
      <table className="data-table">
        <thead><tr><th>Code</th><th>Name</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {courses.length === 0
            ? <tr><td colSpan={5} className="empty-state">No courses yet.</td></tr>
            : courses.map(c => (
              <tr key={c.id}>
                <td><span className="roll-number">{c.code}</span></td>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{c.description || '--'}</td>
                <td><span className={`badge ${c.is_active ? 'badge-active' : 'badge-inactive'}`}>{c.is_active ? 'Active' : 'Archived'}</span></td>
                <td style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn-secondary" onClick={() => showEdit(c)}>Edit</button>
                  <button className="btn-danger" onClick={() => deleteCourse(c.id, c.name)}>Archive</button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </>
  )
}


