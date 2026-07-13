import { useState, useEffect } from 'react'
import api from '../../api/client'

function StatCard({ label, value, color }) {
  return (
    <div style={{ border: '1px solid var(--border)', padding: '1rem', textAlign: 'center', background: 'var(--bg-secondary)' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: color || 'var(--accent)' }}>{value ?? '--'}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  )
}

export default function ReportsSection({ defaultTab = 'candidates' }) {
  const [tab, setTab] = useState(defaultTab)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const TABS = [
    { key: 'candidates', label: 'Candidates' },
    { key: 'submissions', label: 'Submissions' },
    { key: 'malpractice', label: 'Malpractice' },
    { key: 'papers', label: 'Question Papers' },
    { key: 'courses', label: 'Courses' },
    { key: 'batches', label: 'Batches' },
    { key: 'groups', label: 'Groups' },
    { key: 'question-difficulty', label: 'Question Difficulty' },
  ]

  const load = async (t) => {
    setLoading(true)
    setData(null)
    try {
      const path = t === 'question-difficulty'
        ? '/admin/reports/question-difficulty'
        : t === 'papers'
        ? '/admin/papers'
        : `/admin/reports/${t}`
      const { data: d } = await api.get(path)
      setData(d)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load(tab) }, [tab])

  const renderContent = () => {
    if (loading) return <div className="loading">Loading report...</div>
    if (!data) return <div className="empty-state">No data available.</div>

    if (tab === 'candidates') return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <StatCard label="Total Candidates" value={data.total} />
        <StatCard label="Approved" value={data.approved} color="var(--success)" />
        <StatCard label="Pending Approval" value={data.pending_approval} color="#b8860b" />
        <StatCard label="Active" value={data.active} color="var(--accent)" />
      </div>
    )

    if (tab === 'submissions') return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <StatCard label="Total Submissions" value={data.total_submissions} />
        <StatCard label="Passed" value={data.passed} color="var(--success)" />
        <StatCard label="Failed" value={data.failed} color="var(--error)" />
        <StatCard label="Pass Rate" value={`${data.pass_rate}%`} color="var(--accent)" />
        <StatCard label="Average Score" value={data.average_score} />
        <StatCard label="Highest Score" value={data.highest_score} color="var(--success)" />
        <StatCard label="Lowest Score" value={data.lowest_score} color="var(--error)" />
      </div>
    )

    if (tab === 'malpractice') return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard label="Total Events" value={data.total_events} color="var(--error)" />
          <StatCard label="Students Flagged" value={data.students_flagged} color="#b8860b" />
        </div>
        <table className="data-table">
          <thead><tr><th>Event Type</th><th>Count</th></tr></thead>
          <tbody>
            {data.by_type.length === 0
              ? <tr><td colSpan={2} className="empty-state">No events.</td></tr>
              : data.by_type.map(e => (
                <tr key={e.event_type}>
                  <td style={{ fontFamily: 'Courier New, monospace', fontSize: '0.82rem' }}>{e.event_type}</td>
                  <td style={{ fontWeight: 700 }}>{e.count}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </>
    )

    if (tab === 'courses') return (
      <table className="data-table">
        <thead><tr><th>Code</th><th>Course Name</th><th>Candidates</th></tr></thead>
        <tbody>
          {data.length === 0
            ? <tr><td colSpan={3} className="empty-state">No courses.</td></tr>
            : data.map(c => (
              <tr key={c.id}>
                <td><span className="roll-number">{c.code}</span></td>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.candidate_count}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    )

    if (tab === 'batches' || tab === 'groups') return (
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Members</th>
            <th>Submissions</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Pass Rate</th>
            <th>Avg Score</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0
            ? <tr><td colSpan={7} className="empty-state">No {tab}.</td></tr>
            : data.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td>{r.member_count}</td>
                <td>{r.submissions}</td>
                <td style={{ color: 'var(--success)', fontWeight: 600 }}>{r.passed}</td>
                <td style={{ color: 'var(--error)', fontWeight: 600 }}>{r.failed}</td>
                <td>{r.pass_rate}%</td>
                <td>{r.average_score}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    )

    if (tab === 'papers') return (
      <table className="data-table">
        <thead>
          <tr><th>Set ID</th><th>Title</th><th>Subject</th><th>Duration</th><th>Total Marks</th><th>Pass %</th><th>Status</th></tr>
        </thead>
        <tbody>
          {!data || data.length === 0
            ? <tr><td colSpan={7} className="empty-state">No papers.</td></tr>
            : data.map(p => (
              <tr key={p.id}>
                <td><span className="paper-id">{p.id}</span></td>
                <td style={{ fontWeight: 600 }}>{p.title}</td>
                <td>{p.subject}</td>
                <td>{p.duration_minutes} min</td>
                <td>{p.total_marks}</td>
                <td>{p.pass_percentage}%</td>
                <td><span className={`badge ${p.is_active ? 'badge-active' : 'badge-inactive'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))
          }
        </tbody>
      </table>
    )

    if (tab === 'question-difficulty') return (
      <table className="data-table">
        <thead>
          <tr>
            <th>Q ID</th><th>Paper</th><th>Question</th><th>Difficulty</th>
            <th>Attempts</th><th>Correct</th><th>Wrong</th><th>Pass Rate</th>
          </tr>
        </thead>
        <tbody>
          {!data || data.length === 0
            ? <tr><td colSpan={8} className="empty-state">No question data yet.</td></tr>
            : data.map(q => (
              <tr key={q.question_id}>
                <td><span className="paper-id">{q.question_id}</span></td>
                <td><span className="paper-id">{q.paper_id}</span></td>
                <td style={{ maxWidth: '240px', fontSize: '0.82rem' }}>{q.question_text}</td>
                <td><span style={{ fontSize: '0.75rem', fontWeight: 700, color: q.difficulty === 'easy' ? 'var(--success)' : q.difficulty === 'hard' ? 'var(--error)' : '#b8860b' }}>{q.difficulty}</span></td>
                <td>{q.total_attempts}</td>
                <td style={{ color: 'var(--success)', fontWeight: 600 }}>{q.correct}</td>
                <td style={{ color: 'var(--error)', fontWeight: 600 }}>{q.wrong}</td>
                <td style={{ fontWeight: 700 }}>{q.pass_rate}%</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    )
  }

  return (
    <>
      <div className="section-header">
        <h3>Reports</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" style={{ fontSize: '0.78rem' }} onClick={async () => {
            try {
              const res = await api.get('/admin/export/candidates', { responseType: 'blob' })
              const url = URL.createObjectURL(res.data)
              const a = document.createElement('a'); a.href = url; a.download = 'candidates.csv'; a.click()
              URL.revokeObjectURL(url)
            } catch { alert('Export failed') }
          }}>Export Candidates CSV</button>
          <button className="btn-secondary" style={{ fontSize: '0.78rem' }} onClick={async () => {
            try {
              const res = await api.get('/admin/export/results', { responseType: 'blob' })
              const url = URL.createObjectURL(res.data)
              const a = document.createElement('a'); a.href = url; a.download = 'results.csv'; a.click()
              URL.revokeObjectURL(url)
            } catch { alert('Export failed') }
          }}>Export Results CSV</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.4rem 1rem',
              fontSize: '0.82rem',
              fontWeight: tab === t.key ? 700 : 400,
              background: tab === t.key ? 'var(--accent)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              letterSpacing: '0.03em',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {renderContent()}
    </>
  )
}
