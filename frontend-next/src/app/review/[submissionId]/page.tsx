'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useTheme } from '@/context/ThemeContext'
import '@/styles/review.css'

export default function ReviewPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const router = useRouter()
  const { theme, toggle: toggleTheme } = useTheme()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'correct' | 'wrong' | 'skipped'>('all')

  useEffect(() => {
    api.get(`/exam/my-results/${submissionId}/review`)
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load review.'))
      .finally(() => setLoading(false))
  }, [submissionId])

  if (loading) return <div className="review-center"><p style={{ color: 'var(--text-muted)' }}>Loading review...</p></div>

  if (error) return (
    <div className="review-center">
      <div className="exam-info-box">
        <h2>Review Unavailable</h2>
        <p>{error}</p>
        <button className="btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => router.push('/exam')}>Back</button>
      </div>
    </div>
  )

  const correct = data.questions.filter((q: any) => q.is_correct).length
  const wrong   = data.questions.filter((q: any) => !q.is_correct && q.selected_option).length
  const skipped = data.questions.filter((q: any) => !q.selected_option).length
  const total   = data.questions.length
  const pct     = Math.round((data.score / data.total_marks) * 100)

  const filtered = data.questions.filter((q: any) => {
    if (filter === 'correct') return q.is_correct
    if (filter === 'wrong')   return !q.is_correct && q.selected_option
    if (filter === 'skipped') return !q.selected_option
    return true
  })

  const fmtDate = (str: string) => str ? new Date(str).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '--'

  return (
    <div className="review-layout">
      <header className="review-topbar">
        <div className="topbar-left">
          <span className="site-title">Exam Centre</span>
          <span className="exam-title">Answer Review</span>
        </div>
        <div className="topbar-right">
          <button className="theme-toggle" onClick={toggleTheme}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
        </div>
      </header>
      <main className="review-body">
        <div className="review-score-card">
          <div className="review-score-left">
            <div className="review-paper-title">{data.paper_title}</div>
            <div className="review-paper-subject">{data.paper_subject}</div>
            <div className="review-submitted">Submitted: {fmtDate(data.submitted_at)}</div>
          </div>
          <div className="review-score-right">
            <div className="review-score-big">{data.score} / {data.total_marks}</div>
            <div className="review-score-pct">{pct}%</div>
          </div>
        </div>
        <div className="review-stats-bar">
          {([['all', 'Total', total], ['correct', 'Correct', correct], ['wrong', 'Wrong', wrong], ['skipped', 'Skipped', skipped]] as const).map(([key, label, val]) => (
            <button key={key} className={`review-stat-btn${key !== 'all' ? ` ${key}` : ''}${filter === key ? ' active' : ''}`} onClick={() => setFilter(key)}>
              <span className="stat-val">{val}</span>
              <span className="stat-label">{label}</span>
            </button>
          ))}
        </div>
        {filtered.length === 0 && <div className="empty-state">No questions in this category.</div>}
        {filtered.map((q: any) => {
          const options = [{ key: 'A', text: q.option_a }, { key: 'B', text: q.option_b }, { key: 'C', text: q.option_c }, { key: 'D', text: q.option_d }]
          const statusClass = q.is_correct ? 'correct' : q.selected_option ? 'wrong' : 'skipped'
          const statusLabel = q.is_correct ? 'Correct' : q.selected_option ? 'Wrong' : 'Not Answered'
          return (
            <div key={q.id} className={`review-question-card ${statusClass}`}>
              <div className="review-q-header">
                <div className="review-q-left">
                  <span className="review-q-num">Question {q.order_index + 1}</span>
                  <span className={`review-q-status ${statusClass}`}>{statusLabel}</span>
                </div>
                <div className="review-q-right">
                  <span className="review-q-marks">{q.marks_obtained} / {q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                </div>
              </div>
              <p className="review-q-text">{q.question_text}</p>
              <div className="review-options">
                {options.map((opt) => {
                  const isCorrect  = opt.key === q.correct_option.toUpperCase()
                  const isSelected = q.selected_option && opt.key === q.selected_option.toUpperCase()
                  let cls = 'review-option'
                  if (isCorrect) cls += ' is-correct'
                  if (isSelected && !isCorrect) cls += ' is-wrong'
                  if (isSelected && isCorrect) cls += ' is-selected-correct'
                  return (
                    <div key={opt.key} className={cls}>
                      <span className="review-opt-key">{opt.key}</span>
                      <span className="review-opt-text">{opt.text}</span>
                      <span className="review-opt-tag">
                        {isCorrect && !isSelected && 'Correct Answer'}
                        {isSelected && isCorrect && 'Your Answer (Correct)'}
                        {isSelected && !isCorrect && 'Your Answer (Wrong)'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <button className="btn-secondary" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
        </div>
      </main>
    </div>
  )
}
