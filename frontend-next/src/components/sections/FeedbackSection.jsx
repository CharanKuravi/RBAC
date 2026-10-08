'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export default function FeedbackSection() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/feedback/admin')
      .then(r => setFeedbacks(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fmtDate = (s) => s ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '--'
  const stars = (n) => n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '--'

  if (loading) return <div className="loading">Loading feedback...</div>

  return (
    <>
      <div className="section-header"><h3>Student Feedback ({feedbacks.length})</h3></div>
      <table className="data-table">
        <thead><tr><th>Student ID</th><th>Paper ID</th><th>Rating</th><th>Comment</th><th>Submitted</th></tr></thead>
        <tbody>
          {feedbacks.length === 0
            ? <tr><td colSpan={5} className="empty-state">No feedback submitted yet.</td></tr>
            : feedbacks.map(f => (
              <tr key={f.id}>
                <td>{f.student_id}</td>
                <td>{f.paper_id ? <span className="paper-id">{f.paper_id}</span> : '--'}</td>
                <td style={{ color: '#b8860b', fontWeight: 700, letterSpacing: '0.05em' }}>{stars(f.rating)}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '320px' }}>{f.comment || '--'}</td>
                <td style={{ fontSize: '0.82rem' }}>{fmtDate(f.created_at)}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </>
  )
}


