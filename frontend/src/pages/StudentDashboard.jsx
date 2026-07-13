import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useTheme } from '../context/ThemeContext'
import '../styles/exam.css'
import '../styles/auth.css'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const [tab, setTab] = useState('tests')
  const [tests, setTests] = useState([])
  const [results, setResults] = useState([])
  const [grievances, setGrievances] = useState([])
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const rollNumber = localStorage.getItem('roll_number')

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      try {
        const [t, r, g, c] = await Promise.all([
          api.get('/tests/my-tests'),
          api.get('/exam/my-results'),
          api.get('/grievances/my'),
          api.get('/certificates/my-certificates'),
        ])
        setTests(t.data)
        setResults(r.data)
        setGrievances(g.data)
        setCertificates(c.data)
      } catch {}
      setLoading(false)
    }
    loadAll()
  }, [])

  const [grievanceForm, setGrievanceForm] = useState({ subject: '', description: '' })
  const [grievanceMsg, setGrievanceMsg] = useState('')
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '', paper_id: '' })
  const [feedbackMsg, setFeedbackMsg] = useState('')

  const submitGrievance = async (e) => {
    e.preventDefault()
    try {
      await api.post('/grievances', grievanceForm)
      setGrievanceMsg('Grievance submitted successfully.')
      setGrievanceForm({ subject: '', description: '' })
      const { data } = await api.get('/grievances/my')
      setGrievances(data)
    } catch (err) {
      setGrievanceMsg(err.response?.data?.detail || 'Failed to submit.')
    }
  }

  const submitFeedback = async (e) => {
    e.preventDefault()
    try {
      await api.post('/feedback', {
        rating: parseInt(feedbackForm.rating),
        comment: feedbackForm.comment,
        paper_id: feedbackForm.paper_id ? parseInt(feedbackForm.paper_id) : null,
      })
      setFeedbackMsg('Feedback submitted. Thank you.')
      setFeedbackForm({ rating: 5, comment: '', paper_id: '' })
    } catch (err) {
      setFeedbackMsg(err.response?.data?.detail || 'Failed.')
    }
  }

  const STATUS_COLORS = { open: 'var(--error)', in_progress: '#b8860b', resolved: 'var(--success)' }
  const fmtDate = (s) => s ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '--'

  return (
    <div className="review-layout">
      <header className="review-topbar">
        <div className="topbar-left">
          <span className="site-title">Exam Centre</span>
          <span className="exam-title">Student Dashboard</span>
        </div>
        <div className="topbar-right" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'Courier New, monospace' }}>{rollNumber}</span>
          <button className="theme-toggle" onClick={toggle}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
          <button className="theme-toggle" onClick={() => navigate('/profile')}>My Profile</button>
          <button className="theme-toggle" onClick={() => { navigate('/exam') }}>Take Exam</button>
          <button className="theme-toggle" onClick={() => { localStorage.clear(); navigate('/login') }}>Sign Out</button>
        </div>
      </header>

      <main className="review-body">
        {/* Tab bar */}
        <div className="review-stats-bar" style={{ marginBottom: '1.5rem' }}>
          {[
            { id: 'tests', label: 'My Tests' },
            { id: 'results', label: 'Results' },
            { id: 'certificates', label: 'Certificates' },
            { id: 'grievances', label: 'Grievances' },
            { id: 'feedback', label: 'Feedback' },
          ].map(t => (
            <button key={t.id} className={`review-stat-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              <span className="stat-label">{t.label}</span>
            </button>
          ))}
        </div>

        {loading && <div className="loading">Loading...</div>}

        {/* Tests */}
        {!loading && tab === 'tests' && (
          <>
            <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 700 }}>Assigned Tests</h3>
            {tests.length === 0
              ? <div className="empty-state">No tests assigned yet.</div>
              : tests.map(t => (
                <div key={t.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '1.25rem 1.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {t.start_time ? `Starts: ${fmtDate(t.start_time)}` : 'No scheduled time'} · {t.duration_minutes} min
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {t.submitted
                        ? <span style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 600 }}>
                            Submitted — {t.score !== null ? `Score: ${t.score}` : 'Pending'}
                          </span>
                        : <button className="btn-action" onClick={() => navigate(`/exam?testId=${t.id}`)}>Take Exam</button>
                      }
                      <div style={{ marginTop: '0.5rem' }}>
                        <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                          onClick={async () => {
                            try {
                              const res = await api.get(`/certificates/hall-ticket/${t.id}`, { responseType: 'blob' })
                              const url = URL.createObjectURL(res.data)
                              const a = document.createElement('a'); a.href = url
                              a.download = `hall_ticket_${t.id}.pdf`; a.click()
                              URL.revokeObjectURL(url)
                            } catch (err) { alert('Failed to download hall ticket.') }
                          }}>
                          Hall Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </>
        )}

        {/* Results */}
        {!loading && tab === 'results' && (
          <>
            <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 700 }}>My Results</h3>
            {results.length === 0
              ? <div className="empty-state">No results yet.</div>
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--white)', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--off-white)' }}>
                      <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Paper</th>
                      <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Score</th>
                      <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Result</th>
                      <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Rank</th>
                      <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Submitted</th>
                      <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.id}>
                        <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}><span className="paper-id">{r.paper_id}</span></td>
                        <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>{r.score !== null ? `${r.score} / ${r.total_marks}` : 'Pending'}</td>
                        <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                          {r.passed !== null
                            ? <span style={{ fontWeight: 700, color: r.passed ? 'var(--success)' : 'var(--error)' }}>{r.passed ? 'PASS' : 'FAIL'}</span>
                            : '--'
                          }
                        </td>
                        <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                          {r.rank ? `#${r.rank}` : '--'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>{fmtDate(r.submitted_at)}</td>
                        <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                          <button className="btn-secondary" onClick={() => navigate(`/review/${r.id}`)}>Review</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </>
        )}

        {/* Certificates */}
        {!loading && tab === 'certificates' && (
          <>
            <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 700 }}>My Certificates</h3>
            {certificates.length === 0
              ? <div className="empty-state">No certificates available yet. Certificates are issued by admin after result publication.</div>
              : certificates.map(c => (
                <div key={c.cert_id} style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '1.25rem 1.5rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.3rem' }}>{c.cert_id}</div>
                    <div style={{ fontWeight: 600 }}>{c.paper_title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {c.subject} · Score: {c.score}/{c.total_marks} ({c.percentage?.toFixed(1)}%)
                      {c.rank && ` · Rank #${c.rank}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Issued: {c.issued_at ? new Date(c.issued_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '--'}
                    </div>
                  </div>
                  <button className="btn-action"
                    onClick={async () => {
                      try {
                        const res = await api.get(`/certificates/download/${c.cert_id}`, { responseType: 'blob' })
                        const url = URL.createObjectURL(res.data)
                        const a = document.createElement('a'); a.href = url
                        a.download = `certificate_${c.cert_id}.pdf`; a.click()
                        URL.revokeObjectURL(url)
                      } catch (err) { alert('Failed to download certificate.') }
                    }}>
                    Download PDF
                  </button>
                </div>
              ))
            }
          </>
        )}

        {/* Grievances */}
        {!loading && tab === 'grievances' && (
          <>
            <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 700 }}>My Grievances</h3>
            <form onSubmit={submitGrievance} style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>Raise a Grievance</div>
              <div className="form-group"><label>Subject</label><input type="text" value={grievanceForm.subject} onChange={e => setGrievanceForm({...grievanceForm, subject: e.target.value})} placeholder="Brief subject of your complaint" required /></div>
              <div className="form-group"><label>Description</label><textarea rows={3} value={grievanceForm.description} onChange={e => setGrievanceForm({...grievanceForm, description: e.target.value})} placeholder="Describe your issue in detail..." required /></div>
              {grievanceMsg && <div className={`alert ${grievanceMsg.includes('success') ? 'alert-success' : 'alert-error'}`}>{grievanceMsg}</div>}
              <button type="submit" className="btn-action">Submit Grievance</button>
            </form>

            {grievances.length === 0
              ? <div className="empty-state">No grievances raised yet.</div>
              : grievances.map(g => (
                <div key={g.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderLeft: `4px solid ${STATUS_COLORS[g.status]}`, padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontFamily: 'Courier New, monospace', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)' }}>{g.tracking_id}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: STATUS_COLORS[g.status] }}>{g.status.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.subject}</div>
                  {g.admin_note && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Admin: {g.admin_note}</div>}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{fmtDate(g.created_at)}</div>
                </div>
              ))
            }
          </>
        )}

        {/* Feedback */}
        {!loading && tab === 'feedback' && (
          <form onSubmit={submitFeedback} style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '1.5rem', maxWidth: '520px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>Submit Feedback</div>
            <div className="form-group">
              <label>Rating (1-5)</label>
              <select value={feedbackForm.rating} onChange={e => setFeedbackForm({...feedbackForm, rating: e.target.value})}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} — {'★'.repeat(n)}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Paper ID (optional)</label><input type="number" value={feedbackForm.paper_id} onChange={e => setFeedbackForm({...feedbackForm, paper_id: e.target.value})} placeholder="Leave blank for general feedback" /></div>
            <div className="form-group"><label>Comment</label><textarea rows={3} value={feedbackForm.comment} onChange={e => setFeedbackForm({...feedbackForm, comment: e.target.value})} placeholder="Share your experience..." /></div>
            {feedbackMsg && <div className={`alert ${feedbackMsg.includes('Thank') ? 'alert-success' : 'alert-error'}`}>{feedbackMsg}</div>}
            <button type="submit" className="btn-action">Submit Feedback</button>
          </form>
        )}
      </main>
    </div>
  )
}
