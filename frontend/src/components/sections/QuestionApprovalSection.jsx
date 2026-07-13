import { useState, useEffect } from 'react'
import api from '../../api/client'

export default function QuestionApprovalSection({ openModal, closeModal }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/question-bank/pending-approval')
      setQuestions(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const decide = async (id, status, note = '') => {
    try {
      await api.post(`/question-bank/${id}/approve`, { status, note })
      load()
    } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const showReject = (q) => {
    openModal({
      title: `Reject Question #${q.id}`,
      content: (
        <>
          <div style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>{q.question_text}</div>
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
            decide(q.id, 'rejected', note)
            closeModal()
          }}>Reject</button>
        </>
      ),
    })
  }

  const DIFF_COLORS = { easy: 'var(--success)', medium: '#b8860b', hard: 'var(--error)' }

  if (loading) return <div className="loading">Loading pending questions...</div>

  return (
    <>
      <div className="section-header">
        <h3>Question Approval ({questions.length} pending)</h3>
      </div>

      {questions.length === 0 ? (
        <div className="empty-state">No questions pending approval.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Question</th>
              <th>Subject</th>
              <th>Difficulty</th>
              <th>Marks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map(q => (
              <tr key={q.id}>
                <td><span className="paper-id">{q.id}</span></td>
                <td style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{q.question_type?.replace('_', ' ')}</td>
                <td style={{ maxWidth: '260px', fontSize: '0.85rem' }}>{q.question_text}</td>
                <td style={{ fontSize: '0.82rem' }}>{q.subject || '--'}</td>
                <td><span style={{ fontSize: '0.75rem', fontWeight: 700, color: DIFF_COLORS[q.difficulty] }}>{q.difficulty}</span></td>
                <td>{q.marks}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn-action" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      onClick={() => decide(q.id, 'approved')}>Approve</button>
                    <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      onClick={() => showReject(q)}>Reject</button>
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
