import { useState, useEffect } from 'react'
import api from '../../api/client'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  RadialBarChart, RadialBar,
} from 'recharts'

const COLORS = {
  blue:   '#3b82f6',
  green:  '#22c55e',
  amber:  '#f59e0b',
  red:    '#ef4444',
  purple: '#8b5cf6',
  slate:  '#64748b',
  teal:   '#14b8a6',
}

function StatCard({ label, value, color, sub, onClick }) {
  return (
    <div onClick={onClick} style={{
      border: '1px solid var(--border)',
      padding: '1.25rem 1.5rem',
      background: 'var(--bg-secondary)',
      display: 'flex', flexDirection: 'column', gap: '0.3rem',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.15s',
    }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = color || COLORS.blue)}
    onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ fontSize: '2rem', fontWeight: 700, color: color || COLORS.blue, lineHeight: 1 }}>
        {value ?? '--'}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '0.6rem 0.85rem', fontSize: '0.82rem' }}>
      {label && <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  )
}

export default function DashboardSection({ setSection }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard-stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const role = localStorage.getItem('role')
  const name = role ? role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Admin'

  if (loading) return <div className="loading">Loading dashboard...</div>
  if (!stats) return <div className="empty-state">Could not load dashboard stats.</div>

  // ── Chart data ─────────────────────────────────────────────────────────────

  const candidatePieData = [
    { name: 'Approved', value: stats.approved || 0, color: COLORS.green },
    { name: 'Pending', value: stats.pending_approval || 0, color: COLORS.amber },
  ].filter(d => d.value > 0)

  const submissionPieData = [
    { name: 'Passed', value: stats.passed_submissions || 0, color: COLORS.green },
    { name: 'Failed', value: (stats.total_submissions - stats.passed_submissions) || 0, color: COLORS.red },
  ].filter(d => d.value > 0)

  const overviewBarData = [
    { name: 'Candidates', value: stats.total_candidates, fill: COLORS.blue },
    { name: 'Colleges', value: stats.total_colleges, fill: COLORS.purple },
    { name: 'Papers', value: stats.total_papers, fill: COLORS.teal },
    { name: 'Tests', value: stats.total_tests, fill: COLORS.amber },
    { name: 'Submissions', value: stats.total_submissions, fill: COLORS.green },
    { name: 'Questions', value: stats.total_questions, fill: COLORS.slate },
  ]

  const approvalBarData = [
    { name: 'Candidates', pending: stats.pending_approval || 0 },
    { name: 'Questions', pending: stats.pending_question_approval || 0 },
    { name: 'Tests', pending: stats.pending_test_approval || 0 },
    { name: 'Grievances', pending: stats.open_grievances || 0 },
  ]

  const totalPending = (stats.pending_approval || 0) + (stats.pending_question_approval || 0) + (stats.pending_test_approval || 0) + (stats.open_grievances || 0)

  return (
    <div style={{ maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
          Welcome back
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{name}</h2>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Exam Centre — Administration Panel
        </div>
      </div>

      {/* Alerts row */}
      {totalPending > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.75rem' }}>
          {[
            { label: 'Candidates Pending', value: stats.pending_approval, id: 'students', color: COLORS.amber },
            { label: 'Questions Pending', value: stats.pending_question_approval, id: 'question-approval', color: COLORS.amber },
            { label: 'Tests Pending', value: stats.pending_test_approval, id: 'test-approval', color: COLORS.amber },
            { label: 'Open Grievances', value: stats.open_grievances, id: 'grievances', color: COLORS.red },
          ].map(a => a.value > 0 && (
            <div key={a.id} onClick={() => setSection(a.id)} style={{
              border: `1px solid ${a.color}`,
              borderLeft: `4px solid ${a.color}`,
              padding: '0.75rem 1rem',
              background: 'var(--bg-secondary)',
              cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{a.label}</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: a.color }}>{a.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top stat cards */}
      <SectionTitle>Platform Overview</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        <StatCard label="Total Candidates" value={stats.total_candidates} color={COLORS.blue} onClick={() => setSection('students')} />
        <StatCard label="Colleges" value={stats.total_colleges} color={COLORS.purple} onClick={() => setSection('colleges')} />
        <StatCard label="Question Papers" value={stats.total_papers} color={COLORS.teal} onClick={() => setSection('papers')} />
        <StatCard label="Tests" value={stats.total_tests} color={COLORS.amber} onClick={() => setSection('tests')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Submissions" value={stats.total_submissions} color={COLORS.slate} onClick={() => setSection('submissions')} />
        <StatCard label="Passed" value={stats.passed_submissions} color={COLORS.green} />
        <StatCard label="Pass Rate" value={`${stats.pass_rate}%`} color={stats.pass_rate >= 60 ? COLORS.green : stats.pass_rate >= 40 ? COLORS.amber : COLORS.red} />
        <StatCard label="Malpractice Events" value={stats.malpractice_events} color={COLORS.red} onClick={() => setSection('malpractice')} />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>

        {/* Candidate status pie */}
        <div style={{ border: '1px solid var(--border)', padding: '1.25rem', background: 'var(--bg-secondary)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Candidate Status
          </div>
          {candidatePieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={candidatePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {candidatePieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                {candidatePieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div style={{ width: 10, height: 10, background: d.color, borderRadius: '50%' }} />
                    {d.name}: <strong>{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No candidates yet</div>
          )}
        </div>

        {/* Submission result pie */}
        <div style={{ border: '1px solid var(--border)', padding: '1.25rem', background: 'var(--bg-secondary)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Submission Results
          </div>
          {submissionPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={submissionPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {submissionPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                {submissionPieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div style={{ width: 10, height: 10, background: d.color, borderRadius: '50%' }} />
                    {d.name}: <strong>{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No submissions yet</div>
          )}
        </div>

        {/* Pending approvals */}
        <div style={{ border: '1px solid var(--border)', padding: '1.25rem', background: 'var(--bg-secondary)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Pending Actions
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={approvalBarData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pending" name="Pending" fill={COLORS.amber} radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Platform overview bar chart */}
      <SectionTitle>Platform Totals</SectionTitle>
      <div style={{ border: '1px solid var(--border)', padding: '1.25rem', background: 'var(--bg-secondary)', marginBottom: '1.75rem' }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={overviewBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Count" radius={[2, 2, 0, 0]}>
              {overviewBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick actions */}
      <SectionTitle>Quick Actions</SectionTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Manage Candidates', id: 'students' },
          { label: 'Question Papers', id: 'papers' },
          { label: 'Tests', id: 'tests' },
          { label: 'Submissions', id: 'submissions' },
          { label: 'Analytics', id: 'reports' },
          { label: 'Certificates', id: 'certificates' },
          { label: 'Grievances', id: 'grievances' },
          { label: 'Audit Log', id: 'audit' },
        ].map(item => (
          <button key={item.id} className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
            onClick={() => setSection(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {/* Access Control */}
      <SectionTitle>Access Control</SectionTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {[
          { label: 'Access Requests', id: 'access-requests' },
          { label: 'Colleges', id: 'colleges' },
          { label: 'Super Admins', id: 'roles-super_admin' },
          { label: 'Admins', id: 'roles-admin' },
          { label: 'IT Coordinators', id: 'roles-it_coordinator' },
          { label: 'Exam Setters', id: 'roles-exam_setter' },
          { label: 'Staff Permissions', id: 'rbac' },
        ].map(item => (
          <button key={item.id} className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
            onClick={() => setSection(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
