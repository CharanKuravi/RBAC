'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export default function HackathonSection({ openModal, closeModal }) {
  const [hackathons, setHackathons] = useState([])
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [hRes, pRes] = await Promise.all([
        api.get('/hackathons'),
        api.get('/admin/papers'),
      ])
      setHackathons(hRes.data)
      setPapers(pRes.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const paperMap = {}
  papers.forEach(p => { paperMap[p.id] = p })

  // ── Create Hackathon ─────────────────────────────────────────────────────
  const showCreate = () => {
    openModal({
      title: 'Create Hackathon',
      content: (
        <>
          <div className="form-group">
            <label>Hackathon Name *</label>
            <input id="m-name" type="text" placeholder="e.g., AWS Cloud Quiz Challenge" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea id="m-desc" rows={3} placeholder="Brief description of the hackathon..." />
          </div>
          <div className="form-group">
            <label>Question Paper *</label>
            <select id="m-paper">
              <option value="">-- Select Paper --</option>
              {papers.map(p => (
                <option key={p.id} value={p.id}>Set {p.id} — {p.title} ({p.subject})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label>Start Date & Time *</label>
              <input id="m-start" type="datetime-local" />
            </div>
            <div className="form-group">
              <label>End Date & Time *</label>
              <input id="m-end" type="datetime-local" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input id="m-duration" type="number" defaultValue={60} min={1} />
            </div>
            <div className="form-group">
              <label>Max Participants</label>
              <input id="m-max" type="number" placeholder="Leave empty for unlimited" />
            </div>
            <div className="form-group">
              <label>Pass Percentage *</label>
              <input id="m-pass" type="number" defaultValue={40} min={0} max={100} />
            </div>
          </div>
          <div className="form-group">
            <label>
              <input id="m-public" type="checkbox" defaultChecked /> 
              <span style={{ marginLeft: '0.5rem' }}>Public Registration (Anyone can register)</span>
            </label>
          </div>
          <div className="form-group">
            <label>
              <input id="m-leaderboard" type="checkbox" defaultChecked /> 
              <span style={{ marginLeft: '0.5rem' }}>Show Live Leaderboard</span>
            </label>
          </div>
          <div id="m-alert" className="alert alert-error" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const alertEl = document.getElementById('m-alert')
            alertEl.style.display = 'none'
            
            const name = document.getElementById('m-name').value.trim()
            const paper_id = document.getElementById('m-paper').value
            const start_time = document.getElementById('m-start').value
            const end_time = document.getElementById('m-end').value
            const duration = parseInt(document.getElementById('m-duration').value)
            
            if (!name || !paper_id || !start_time || !end_time) {
              alertEl.textContent = 'Please fill all required fields'
              alertEl.style.display = 'block'
              return
            }
            
            const payload = {
              name,
              description: document.getElementById('m-desc').value.trim() || null,
              paper_id: parseInt(paper_id),
              start_time,
              end_time,
              duration_minutes: duration,
              max_participants: document.getElementById('m-max').value ? parseInt(document.getElementById('m-max').value) : null,
              pass_percentage: parseInt(document.getElementById('m-pass').value),
              is_public: document.getElementById('m-public').checked,
              show_leaderboard: document.getElementById('m-leaderboard').checked,
            }
            
            try {
              await api.post('/hackathons', payload)
              closeModal()
              load()
            } catch (err) {
              alertEl.textContent = err.response?.data?.detail || 'Failed to create hackathon'
              alertEl.style.display = 'block'
            }
          }}>Create Hackathon</button>
        </>
      ),
    })
  }

  // ── Bulk Upload Participants ─────────────────────────────────────────────
  const showBulkUpload = (hackathon) => {
    openModal({
      title: `Bulk Upload Participants — ${hackathon.name}`,
      content: (
        <>
          <div style={{ 
            padding: '1rem', 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border)',
            marginBottom: '1rem',
            fontSize: '0.82rem'
          }}>
            <strong>📋 CSV Format:</strong><br />
            <code style={{ fontFamily: 'Courier New', fontSize: '0.8rem' }}>
              full_name,email,phone,college_name
            </code><br />
            <div style={{ marginTop: '0.5rem', fontSize: '0.78rem' }}>
              Example: John Doe,john@email.com,9876543210,ABC College
            </div>
            <button 
              className="btn-secondary" 
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', marginTop: '0.75rem' }}
              onClick={() => {
                const csv = 'full_name,email,phone,college_name\nJohn Doe,john@email.com,9876543210,ABC College'
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'hackathon_participants_template.csv'
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              📥 Download Template
            </button>
          </div>
          
          <div className="form-group">
            <label>Upload CSV File</label>
            <input 
              id="m-file" 
              type="file" 
              accept=".csv,.xlsx,.xls"
              style={{ 
                padding: '0.5rem', 
                border: '1px solid var(--border)', 
                width: '100%' 
              }}
            />
          </div>
          
          <div className="form-group">
            <label>Default Password for All</label>
            <input id="m-password" type="text" defaultValue="Hackathon@2024" />
          </div>
          
          <div id="m-alert" className="alert alert-error" style={{ display: 'none' }} />
          <div id="m-result" style={{ display: 'none', marginTop: '1rem' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Close</button>
          <button className="btn-action" onClick={async () => {
            const fileInput = document.getElementById('m-file')
            const file = fileInput.files[0]
            const alertEl = document.getElementById('m-alert')
            const resultEl = document.getElementById('m-result')
            
            alertEl.style.display = 'none'
            resultEl.style.display = 'none'
            
            if (!file) {
              alertEl.textContent = 'Please select a file'
              alertEl.style.display = 'block'
              return
            }
            
            const formData = new FormData()
            formData.append('file', file)
            formData.append('hackathon_id', hackathon.id)
            formData.append('default_password', document.getElementById('m-password').value)
            
            try {
              const { data } = await api.post('/hackathons/bulk-upload-participants', formData)
              
              resultEl.innerHTML = `
                <div style="display: grid; gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem'">
                  <div style="border: 1px solid var(--border); padding: 1rem; textAlign: center;">
                    <div style="fontSize: 1.6rem; fontWeight: 700; color: var(--success)">${data.created}</div>
                    <div style="fontSize: 0.72rem; color: var(--text-muted)">REGISTERED</div>
                  </div>
                  <div style="border: 1px solid var(--border); padding: 1rem; textAlign: center;">
                    <div style="fontSize: 1.6rem; fontWeight: 700; color: var(--error)">${data.skipped}</div>
                    <div style="fontSize: 0.72rem; color: var(--text-muted)">SKIPPED</div>
                  </div>
                </div>
              `
              resultEl.style.display = 'block'
              load()
            } catch (err) {
              alertEl.textContent = err.response?.data?.detail || 'Upload failed'
              alertEl.style.display = 'block'
            }
          }}>Upload & Register</button>
        </>
      ),
    })
  }

  // ── View Participants ────────────────────────────────────────────────────
  const showParticipants = async (hackathon) => {
    try {
      const { data } = await api.get(`/hackathons/${hackathon.id}/participants`)
      
      openModal({
        title: `Participants — ${hackathon.name} (${data.length})`,
        content: (
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {data.length === 0 ? (
              <div className="empty-state">No participants yet</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>College</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((p, i) => (
                    <tr key={i}>
                      <td>{p.full_name}</td>
                      <td style={{ fontSize: '0.82rem' }}>{p.email}</td>
                      <td style={{ fontSize: '0.82rem' }}>{p.college_name || '--'}</td>
                      <td>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          color: p.submitted ? 'var(--success)' : 'var(--text-muted)'
                        }}>
                          {p.submitted ? 'SUBMITTED' : 'REGISTERED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ),
        footer: (
          <button className="btn-secondary" onClick={closeModal}>Close</button>
        ),
      })
    } catch (err) {
      alert('Failed to load participants')
    }
  }

  // ── View Leaderboard ─────────────────────────────────────────────────────
  const showLeaderboard = async (hackathon) => {
    try {
      const { data } = await api.get(`/hackathons/${hackathon.id}/leaderboard`)
      
      openModal({
        title: `🏆 Leaderboard — ${hackathon.name}`,
        content: (
          <div style={{ maxHeight: '500px', overflow: 'auto' }}>
            {data.length === 0 ? (
              <div className="empty-state">No submissions yet</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Score</th>
                    <th>Time Taken</th>
                    <th>College</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((entry, i) => (
                    <tr key={i} style={{ background: i < 3 ? 'var(--off-white)' : 'transparent' }}>
                      <td>
                        <span style={{ 
                          fontWeight: 700, 
                          fontSize: '0.9rem',
                          color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'inherit'
                        }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{entry.student_name}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {entry.score} / {entry.total_marks}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{entry.time_taken || '--'}</td>
                      <td style={{ fontSize: '0.82rem' }}>{entry.college_name || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ),
        footer: (
          <button className="btn-secondary" onClick={closeModal}>Close</button>
        ),
      })
    } catch (err) {
      alert('Failed to load leaderboard')
    }
  }

  const STATUS_COLORS = { 
    upcoming: '#b8860b', 
    active: 'var(--success)', 
    completed: 'var(--text-muted)' 
  }

  if (loading) return <div className="loading">Loading hackathons...</div>

  return (
    <>
      <div className="section-header">
        <h3>🏆 Hackathons ({hackathons.length})</h3>
        <button className="btn-action" onClick={showCreate}>Create Hackathon</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Paper</th>
            <th>Start Time</th>
            <th>Duration</th>
            <th>Participants</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {hackathons.length === 0 ? (
            <tr><td colSpan={7} className="empty-state">No hackathons yet. Create one to get started!</td></tr>
          ) : (
            hackathons.map(h => (
              <tr key={h.id}>
                <td style={{ fontWeight: 600 }}>{h.name}</td>
                <td>
                  <span className="paper-id">{h.paper_id}</span> 
                  {paperMap[h.paper_id]?.title || ''}
                </td>
                <td style={{ fontSize: '0.82rem' }}>
                  {h.start_time ? new Date(h.start_time).toLocaleString() : '--'}
                </td>
                <td>{h.duration_minutes} min</td>
                <td style={{ fontWeight: 600, textAlign: 'center' }}>
                  {h.participant_count || 0}
                  {h.max_participants ? ` / ${h.max_participants}` : ''}
                </td>
                <td>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: STATUS_COLORS[h.status] 
                  }}>
                    {h.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      onClick={() => showParticipants(h)}
                    >
                      Participants
                    </button>
                    <button 
                      className="btn-secondary" 
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      onClick={() => showBulkUpload(h)}
                    >
                      📤 Bulk Upload
                    </button>
                    {h.show_leaderboard && (
                      <button 
                        className="btn-action" 
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => showLeaderboard(h)}
                      >
                        🏆 Leaderboard
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  )
}
