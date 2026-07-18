'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Modal from '@/components/Modal'
import { useTheme } from '@/context/ThemeContext'
import CoursesSection from '@/components/sections/CoursesSection'
import BatchesSection from '@/components/sections/BatchesSection'
import GroupsSection from '@/components/sections/GroupsSection'
import QuestionBankSection from '@/components/sections/QuestionBankSection'
import TestsSection from '@/components/sections/TestsSection'
import GrievancesSection from '@/components/sections/GrievancesSection'
import FeedbackSection from '@/components/sections/FeedbackSection'
import AuditSection from '@/components/sections/AuditSection'
import ReportsSection from '@/components/sections/ReportsSection'
import TrashSection from '@/components/sections/TrashSection'
import AccessRequestsSection from '@/components/sections/AccessRequestsSection'
import CertificatesSection from '@/components/sections/CertificatesSection'
import BulkUploadSection from '@/components/sections/BulkUploadSection'
import QuestionApprovalSection from '@/components/sections/QuestionApprovalSection'
import TestApprovalSection from '@/components/sections/TestApprovalSection'
import DashboardSection from '@/components/sections/DashboardSection'
import '@/styles/admin.css'

const SECTIONS = ['students', 'papers', 'assignments', 'submissions', 'malpractice', 'lookup', 'colleges', 'courses', 'batches', 'groups', 'question-bank', 'tests', 'grievances', 'feedback', 'audit', 'rbac']
const SECTION_LABELS = {
  students: 'Students',
  papers: 'Question Papers',
  assignments: 'Assignments',
  submissions: 'Submissions',
  malpractice: 'Malpractice Logs',
  lookup: 'ID Lookup',
  colleges: 'Colleges',
  courses: 'Courses',
  batches: 'Batches',
  groups: 'Groups',
  'question-bank': 'Question Bank',
  tests: 'Tests',
  grievances: 'Grievances',
  feedback: 'Feedback',
  audit: 'Audit Log',
  rbac: 'Role-Based Access',
}

const PERMISSION_SECTION_MAP = {
  manage_students: 'students',
  manage_papers: 'papers',
  manage_assignments: 'assignments',
  view_submissions: 'submissions',
  view_malpractice: 'malpractice',
  manage_courses: 'courses',
  manage_batches: 'batches',
  manage_groups: 'groups',
  manage_tests: 'tests',
  manage_question_bank: 'question-bank',
  view_results: 'submissions',
  manage_grievances: 'grievances',
  view_audit_log: 'audit',
}

function fmtDate(str) {
  if (!str) return '--'
  return new Date(str).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function Admin() {
  const router = useRouter()
  const [section, setSection] = useState('dashboard')
  const [modal, setModal] = useState(null)
  const { theme, toggle: toggleTheme } = useTheme()

  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
  const permissions = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('permissions') || '[]') : []
  const isFullAccess = ['admin', 'super_admin', 'it_coordinator'].includes(role)
  const canAccess = (perm) => isFullAccess || permissions.includes(perm)

  const closeModal = () => setModal(null)
  const handleLogout = () => { localStorage.clear(); router.replace('/login') }

  // Collapsible nav groups
  const [openGroups, setOpenGroups] = useState({
    candidates: true, examination: false,
    reports: false, tools: false, access: false,
  })
  const toggleGroup = (g) => setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }))

  const NavItem = ({ id, label }) => (
    <div className={`nav-item nav-sub-item${section === id ? ' active' : ''}`} onClick={() => setSection(id)}>{label}</div>
  )

  const NavGroup = ({ id, label, children }) => {
    const childArray = Array.isArray(children) ? children : [children]
    const hasVisible = childArray.some(c => c)
    if (!hasVisible) return null
    return (
      <>
        <div className="nav-group-header" onClick={() => toggleGroup(id)}>
          <span className="nav-section-label" style={{ margin: 0, padding: 0 }}>{label}</span>
          <span className="nav-group-arrow">{openGroups[id] ? '▾' : '▸'}</span>
        </div>
        {openGroups[id] && <div className="nav-group-items">{children}</div>}
      </>
    )
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-label">Examination Management</div>
          <div className="brand-name">Exam Centre</div>
        </div>
        <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div className={`nav-item${section === 'dashboard' ? ' active' : ''}`}
            style={{ fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.04em' }}
            onClick={() => setSection('dashboard')}>
            Dashboard
          </div>

          {isFullAccess && (
            <NavGroup id="access" label="Access Control">
              <NavItem id="access-requests" label="Access Requests" />
              <NavItem id="colleges" label="Colleges" />
              <NavItem id="roles-super_admin" label="Super Admins" />
              <NavItem id="roles-admin" label="Admins" />
              <NavItem id="roles-it_coordinator" label="IT Coordinators" />
              <NavItem id="roles-exam_setter" label="Exam Setters" />
              <NavItem id="rbac" label="Staff Permissions" />
            </NavGroup>
          )}

          <NavGroup id="candidates" label="Candidates">
            {canAccess('manage_students') && <NavItem id="students" label="Candidates" />}
            {canAccess('manage_students') && <NavItem id="bulk-upload" label="Bulk Upload" />}
            {isFullAccess && <NavItem id="reports-candidates" label="Reports" />}
          </NavGroup>

          <NavGroup id="academic" label="Academic">
            {canAccess('manage_courses') && <NavItem id="courses" label="Courses" />}
            {canAccess('manage_batches') && <NavItem id="batches" label="Batches" />}
            {canAccess('manage_groups') && <NavItem id="groups" label="Groups" />}
            {isFullAccess && <NavItem id="reports-academic" label="Reports" />}
          </NavGroup>

          <NavGroup id="examination" label="Examination">
            {canAccess('manage_papers') && <NavItem id="papers" label="Question Papers" />}
            {canAccess('manage_question_bank') && <NavItem id="question-bank" label="Question Bank" />}
            {isFullAccess && <NavItem id="question-approval" label="Question Approval" />}
            {canAccess('manage_tests') && <NavItem id="tests" label="Tests" />}
            {isFullAccess && <NavItem id="test-approval" label="Test Approval" />}
            {canAccess('manage_assignments') && <NavItem id="assignments" label="Assignments" />}
            {isFullAccess && <NavItem id="ai-paper" label="AI Paper Generator" />}
            {isFullAccess && <NavItem id="reports-examination" label="Reports" />}
          </NavGroup>

          <NavGroup id="reports" label="Reports">
            {isFullAccess && <NavItem id="reports" label="Analytics" />}
            {canAccess('view_submissions') && <NavItem id="submissions" label="Submissions" />}
            {canAccess('view_malpractice') && <NavItem id="malpractice" label="Malpractice Logs" />}
            {canAccess('manage_grievances') && <NavItem id="grievances" label="Grievances" />}
            {canAccess('view_results') && <NavItem id="feedback" label="Feedback" />}
            {canAccess('view_results') && <NavItem id="certificates" label="Certificates" />}
          </NavGroup>

          <NavGroup id="tools" label="Tools">
            <NavItem id="lookup" label="ID Lookup" />
            {canAccess('view_audit_log') && <NavItem id="audit" label="Audit Log" />}
            {isFullAccess && <NavItem id="trash" label="Trash" />}
          </NavGroup>

          {/* Spacer */}
          <div style={{ flex: 1 }} />
        </nav>
        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme} style={{ marginBottom: '0.6rem', width: '100%' }}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <h2>{
            section === 'dashboard' ? 'Dashboard' :
            section.startsWith('roles-')
              ? `Manage ${section.replace('roles-', '').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}s`
              : SECTION_LABELS[section] || section
          }</h2>
        </div>
        <div className="admin-content">
          {section === 'dashboard'          && <DashboardSection setSection={setSection} />}
          {section === 'students'          && <StudentsSection openModal={setModal} closeModal={closeModal} />}
          {section === 'bulk-upload'        && <BulkUploadSection />}
          {section === 'courses'            && <CoursesSection openModal={setModal} closeModal={closeModal} />}
          {section === 'batches'            && <BatchesSection openModal={setModal} closeModal={closeModal} />}
          {section === 'groups'             && <GroupsSection openModal={setModal} closeModal={closeModal} />}
          {section === 'papers'             && <PapersSection openModal={setModal} closeModal={closeModal} />}
          {section === 'question-bank'      && <QuestionBankSection openModal={setModal} closeModal={closeModal} />}
          {section === 'question-approval'  && isFullAccess && <QuestionApprovalSection openModal={setModal} closeModal={closeModal} />}
          {section === 'tests'              && <TestsSection openModal={setModal} closeModal={closeModal} />}
          {section === 'test-approval'      && isFullAccess && <TestApprovalSection openModal={setModal} closeModal={closeModal} />}
          {section === 'ai-paper'           && isFullAccess && <AIPaperSection openModal={setModal} closeModal={closeModal} />}
          {section === 'assignments'        && <AssignmentsSection openModal={setModal} closeModal={closeModal} />}
          {section === 'submissions'        && <SubmissionsSection />}
          {section === 'malpractice'        && <MalpracticeSection />}
          {section === 'grievances'         && <GrievancesSection openModal={setModal} closeModal={closeModal} />}
          {section === 'certificates'       && canAccess('view_results') && <CertificatesSection />}
          {section === 'feedback'           && <FeedbackSection />}
          {section === 'audit'              && <AuditSection />}
          {section === 'lookup'             && <LookupSection />}
          {section === 'reports'            && isFullAccess && <ReportsSection defaultTab="candidates" />}
          {section === 'reports-candidates' && isFullAccess && <ReportsSection defaultTab="candidates" />}
          {section === 'reports-academic'   && isFullAccess && <ReportsSection defaultTab="batches" />}
          {section === 'reports-examination'&& isFullAccess && <ReportsSection defaultTab="submissions" />}
          {section === 'trash'              && isFullAccess && <TrashSection />}
          {section === 'access-requests'    && isFullAccess && <AccessRequestsSection openModal={setModal} closeModal={closeModal} />}
          {section === 'colleges'           && isFullAccess && <CollegesSection openModal={setModal} closeModal={closeModal} />}
          {section === 'roles-super_admin'  && isFullAccess && <RolesSection roleType="super_admin" openModal={setModal} closeModal={closeModal} />}
          {section === 'roles-admin'        && isFullAccess && <RolesSection roleType="admin" openModal={setModal} closeModal={closeModal} />}
          {section === 'roles-it_coordinator' && isFullAccess && <RolesSection roleType="it_coordinator" openModal={setModal} closeModal={closeModal} />}
          {section === 'roles-exam_setter'  && isFullAccess && <RolesSection roleType="exam_setter" openModal={setModal} closeModal={closeModal} />}
          {section === 'rbac'               && isFullAccess && <RBACSection openModal={setModal} closeModal={closeModal} />}
        </div>
      </div>

      {modal && (
        <Modal title={modal.title} onClose={closeModal} footer={modal.footer}>
          {modal.content}
        </Modal>
      )}
    </div>
  )
}

// ── Students / Candidates ──────────────────────────────────────────────────

function StudentsSection({ openModal, closeModal }) {
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')   // all | pending | approved
  const [selected, setSelected] = useState(new Set())

  const load = async () => {
    setLoading(true)
    try {
      const [u, c] = await Promise.all([api.get('/admin/users'), api.get('/courses')])
      setStudents(u.data.filter(u => u.role === 'student'))
      setCourses(c.data)
    } catch {}
    setLoading(false)
    setSelected(new Set())
  }

  useEffect(() => { load() }, [])

  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]))

  const filtered = tab === 'pending'
    ? students.filter(s => !s.is_approved)
    : tab === 'approved'
    ? students.filter(s => s.is_approved)
    : students

  const allSelected = filtered.length > 0 && filtered.every(s => selected.has(s.id))
  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map(s => s.id)))
  }
  const toggleOne = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const approve = async (id) => { try { await api.post(`/admin/users/${id}/approve`); load() } catch {} }
  const reject = async (id) => { try { await api.post(`/admin/users/${id}/reject`); load() } catch {} }

  const bulkApprove = async () => {
    if (!selected.size) return
    try { await api.post('/admin/users/bulk-approve', { user_ids: [...selected] }); load() } catch {}
  }
  const bulkReject = async () => {
    if (!selected.size) return
    if (!confirm(`Reject ${selected.size} candidate(s)?`)) return
    try { await api.post('/admin/users/bulk-reject', { user_ids: [...selected] }); load() } catch {}
  }

  const softDelete = async (id, email) => {
    if (!confirm(`Move ${email} to trash? You can restore from Tools → Trash.`)) return
    try { await api.delete(`/admin/users/${id}`); load() } catch {}
  }

  const showAdd = () => {
    openModal({
      title: 'Add Candidate',
      content: (
        <>
          <div className="form-group"><label>Full Name</label><input id="m-name" type="text" placeholder="Candidate full name" /></div>
          <div className="form-group"><label>Email Address</label><input id="m-email" type="email" placeholder="candidate@institution.edu" /></div>
          <div className="form-group"><label>Password</label><input id="m-password" type="password" placeholder="Minimum 8 characters" /></div>
          <div className="form-group">
            <label>Course (one per candidate)</label>
            <select id="m-course">
              <option value="">-- Select Course --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
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
            const email = document.getElementById('m-email').value.trim()
            const password = document.getElementById('m-password').value
            const full_name = document.getElementById('m-name').value.trim()
            const course_id = document.getElementById('m-course').value
            if (!email || !password) { alertEl.textContent = 'Email and password are required.'; alertEl.style.display = 'block'; return }
            try {
              await api.post('/admin/users', {
                email, password, role: 'student', full_name: full_name || null,
                course_id: course_id ? parseInt(course_id) : null,
              })
              closeModal(); load()
            } catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Add Candidate</button>
        </>
      ),
    })
  }

  const showEdit = (s) => {
    openModal({
      title: `Edit Candidate — ${s.roll_number || s.email}`,
      content: (
        <>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>CID: <strong>{s.roll_number || '--'}</strong></div>
          <div className="form-group"><label>Full Name</label><input id="e-name" type="text" defaultValue={s.full_name || ''} /></div>
          <div className="form-group"><label>Email</label><input id="e-email" type="email" defaultValue={s.email} /></div>
          <div className="form-group"><label>Phone</label><input id="e-phone" type="text" defaultValue={s.phone || ''} /></div>
          <div className="form-group">
            <label>Course (one per candidate)</label>
            <select id="e-course" defaultValue={s.course_id || ''}>
              <option value="">-- None --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
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
            try {
              await api.patch(`/admin/users/${s.id}`, {
                full_name: document.getElementById('e-name').value.trim() || null,
                email: document.getElementById('e-email').value.trim(),
                phone: document.getElementById('e-phone').value.trim() || null,
                course_id: document.getElementById('e-course').value ? parseInt(document.getElementById('e-course').value) : null,
              })
              closeModal(); load()
            } catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Save Changes</button>
        </>
      ),
    })
  }

  if (loading) return <div className="loading">Loading candidates...</div>

  return (
    <>
      <div className="section-header">
        <h3>Candidates ({students.length})</h3>
        <button className="btn-action" onClick={showAdd}>Add Candidate</button>
      </div>

      {/* Tab filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {[['all', 'All'], ['pending', 'Pending Approval'], ['approved', 'Approved']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '0.35rem 0.9rem', fontSize: '0.8rem', cursor: 'pointer',
            fontWeight: tab === key ? 700 : 400,
            background: tab === key ? 'var(--accent)' : 'transparent',
            color: tab === key ? '#fff' : 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}>{label}</button>
        ))}
        {selected.size > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>{selected.size} selected</span>
            <button className="btn-action" style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }} onClick={bulkApprove}>Approve All</button>
            <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }} onClick={bulkReject}>Reject All</button>
          </div>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '36px' }}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            </th>
            <th>CID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Course</th>
            <th>Status</th>
            <th>Registered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0
            ? <tr><td colSpan={8} className="empty-state">No candidates found.</td></tr>
            : filtered.map(s => (
              <tr key={s.id}>
                <td><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} /></td>
                <td><span className="roll-number">{s.roll_number || '--'}</span></td>
                <td>{s.full_name || '--'}</td>
                <td style={{ fontSize: '0.85rem' }}>{s.email}</td>
                <td style={{ fontSize: '0.82rem' }}>{courseMap[s.course_id]?.name || '--'}</td>
                <td>
                  {s.is_approved
                    ? <span className="badge badge-active">Approved</span>
                    : <span className="badge badge-inactive">Pending</span>
                  }
                </td>
                <td style={{ fontSize: '0.78rem' }}>{fmtDate(s.created_at)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {!s.is_approved && (
                      <button className="btn-action" style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                        onClick={() => approve(s.id)}>Approve</button>
                    )}
                    {s.is_approved && (
                      <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                        onClick={() => reject(s.id)}>Revoke</button>
                    )}
                    <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                      onClick={() => showEdit(s)}>Edit</button>
                    <button className="btn-danger" style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                      onClick={() => softDelete(s.id, s.email)}>Trash</button>
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

// ── Papers ─────────────────────────────────────────────────────────────────

function PapersSection({ openModal, closeModal }) {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/papers')
      setPapers(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deletePaper = async (id, title) => {
    if (!confirm(`Delete paper "${title}"? All questions will be removed.`)) return
    try {
      await api.delete(`/admin/papers/${id}`)
      load()
    } catch (err) { alert(err.response?.data?.detail || 'Failed.') }
  }

  const showEditPaper = (p) => {
    openModal({
      title: `Edit Paper — Set ${p.id}`,
      content: (
        <>
          <div className="form-group"><label>Title</label><input id="ep-title" type="text" defaultValue={p.title} /></div>
          <div className="form-group"><label>Subject</label><input id="ep-subject" type="text" defaultValue={p.subject} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group"><label>Duration (min)</label><input id="ep-duration" type="number" defaultValue={p.duration_minutes} min={1} /></div>
            <div className="form-group"><label>Total Marks</label><input id="ep-marks" type="number" defaultValue={p.total_marks} min={1} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group"><label>Pass %</label><input id="ep-pass" type="number" defaultValue={p.pass_percentage} min={0} max={100} /></div>
            <div className="form-group"><label>Negative Marks</label><input id="ep-neg" type="number" defaultValue={p.negative_marks} min={0} step={0.25} /></div>
          </div>
          <div id="ep-alert" className="alert alert-error" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const alertEl = document.getElementById('ep-alert')
            alertEl.style.display = 'none'
            try {
              await api.patch(`/admin/papers/${p.id}`, {
                title: document.getElementById('ep-title').value.trim(),
                subject: document.getElementById('ep-subject').value.trim(),
                duration_minutes: parseInt(document.getElementById('ep-duration').value),
                total_marks: parseInt(document.getElementById('ep-marks').value),
                pass_percentage: parseFloat(document.getElementById('ep-pass').value),
                negative_marks: parseFloat(document.getElementById('ep-neg').value),
              })
              closeModal(); load()
            } catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Save Changes</button>
        </>
      ),
    })
  }

  const showCreateModal = () => {
    openModal({
      title: 'Create Question Paper',
      content: <CreatePaperForm />,
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const title = document.getElementById('m-title').value.trim()
            const subject = document.getElementById('m-subject').value.trim()
            const duration = parseInt(document.getElementById('m-duration').value)
            const marks = parseInt(document.getElementById('m-marks').value)
            const alertEl = document.getElementById('m-alert')
            if (!title || !subject || !duration || !marks) {
              alertEl.textContent = 'All fields are required.'
              alertEl.style.display = 'block'
              return
            }
            try {
              await api.post('/admin/papers', { title, subject, duration_minutes: duration, total_marks: marks })
              closeModal()
              load()
            } catch (err) {
              alertEl.textContent = err.response?.data?.detail || 'Failed.'
              alertEl.style.display = 'block'
            }
          }}>Create Paper</button>
        </>
      ),
    })
  }

  const manageQuestions = (paper) => {
    openModal({
      title: `Questions — ${paper.title}`,
      content: <QuestionsManager paper={paper} openModal={openModal} closeModal={closeModal} />,
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Close</button>
          <button className="btn-action" onClick={() => showAddQuestionModal(paper, openModal, closeModal)}>
            Add Question
          </button>
        </>
      ),
    })
  }

  if (loading) return <div className="loading">Loading papers...</div>

  return (
    <>
      <div className="section-header">
        <h3>Question Papers ({papers.length})</h3>
        <button className="btn-action" onClick={showCreateModal}>Create Paper</button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Set ID</th>
            <th>Title</th>
            <th>Subject</th>
            <th>Duration</th>
            <th>Total Marks</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {papers.length === 0 ? (
            <tr><td colSpan={7} className="empty-state">No papers created yet.</td></tr>
          ) : papers.map((p) => (
            <tr key={p.id}>
              <td><span className="paper-id">{p.id}</span></td>
              <td>{p.title}</td>
              <td>{p.subject}</td>
              <td>{p.duration_minutes} min</td>
              <td>{p.total_marks}</td>
              <td><span className={`badge ${p.is_active ? 'badge-active' : 'badge-inactive'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
              <td style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={() => manageQuestions(p)}>Questions</button>
                <button className="btn-secondary" onClick={() => showEditPaper(p)}>Edit</button>
                <button className="btn-danger" onClick={() => deletePaper(p.id, p.title)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function CreatePaperForm() {
  return (
    <>
      <div className="form-group"><label>Title</label><input id="m-title" type="text" placeholder="e.g. Mid-Term Examination 2025" /></div>
      <div className="form-group"><label>Subject</label><input id="m-subject" type="text" placeholder="e.g. Mathematics" /></div>
      <div className="form-group"><label>Duration (minutes)</label><input id="m-duration" type="number" defaultValue={60} min={1} /></div>
      <div className="form-group"><label>Total Marks</label><input id="m-marks" type="number" defaultValue={100} min={1} /></div>
      <div id="m-alert" className="alert alert-error" style={{ display: 'none' }}></div>
    </>
  )
}

function QuestionsManager({ paper, openModal, closeModal }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/papers/${paper.id}/questions`)
      setQuestions(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deleteQ = async (id) => {
    if (!confirm('Remove this question?')) return
    try {
      await api.delete(`/admin/questions/${id}`)
      load()
    } catch (err) { alert(err.response?.data?.detail || 'Failed.') }
  }

  const showEditQ = (q) => {
    openModal({
      title: `Edit Question #${q.id}`,
      content: (
        <>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            QB UID: <strong>{q.qb_uid || '--'}</strong> · Editing creates a new version in the bank.
          </div>
          <div className="form-group"><label>Question Text</label><textarea id="eq-qtext" rows={3} defaultValue={q.question_text} /></div>
          <div className="form-group"><label>Option A</label><input id="eq-oa" type="text" defaultValue={q.option_a} /></div>
          <div className="form-group"><label>Option B</label><input id="eq-ob" type="text" defaultValue={q.option_b} /></div>
          <div className="form-group"><label>Option C</label><input id="eq-oc" type="text" defaultValue={q.option_c} /></div>
          <div className="form-group"><label>Option D</label><input id="eq-od" type="text" defaultValue={q.option_d} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label>Correct Answer</label>
              <select id="eq-correct" defaultValue={q.correct_option}>
                <option value="A">A</option><option value="B">B</option>
                <option value="C">C</option><option value="D">D</option>
              </select>
            </div>
            <div className="form-group"><label>Marks</label><input id="eq-marks" type="number" defaultValue={q.marks} min={1} /></div>
          </div>
          <div id="eq-alert" className="alert alert-error" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const alertEl = document.getElementById('eq-alert')
            alertEl.style.display = 'none'
            try {
              // Update the bank entry (creates new version)
              await api.patch(`/question-bank/${q.bank_id}`, {
                question_text: document.getElementById('eq-qtext').value.trim(),
                option_a: document.getElementById('eq-oa').value.trim(),
                option_b: document.getElementById('eq-ob').value.trim(),
                option_c: document.getElementById('eq-oc').value.trim(),
                option_d: document.getElementById('eq-od').value.trim(),
                correct_option: document.getElementById('eq-correct').value,
                marks: parseInt(document.getElementById('eq-marks').value),
              })
              closeModal(); load()
            } catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Save (New Version)</button>
        </>
      ),
    })
  }

  if (loading) return <div className="loading">Loading questions...</div>
  if (questions.length === 0) return <div className="empty-state">No questions added yet. Use "Add Question" below.</div>

  return (
    <div>
      {questions.map((q, idx) => (
        <div key={q.id} className="question-admin-card">
          <div className="qa-header">
            <span className="qa-num">Q{idx + 1} &mdash; {q.marks} mark{q.marks > 1 ? 's' : ''}</span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                onClick={() => showEditQ(q)}>Edit</button>
              <button className="btn-danger" onClick={() => deleteQ(q.id)}>Remove</button>
            </div>
          </div>
          <p className="qa-text">{q.question_text}</p>
          <div className="qa-options">
            <span><strong>A.</strong> {q.option_a}</span>
            <span><strong>B.</strong> {q.option_b}</span>
            <span><strong>C.</strong> {q.option_c}</span>
            <span><strong>D.</strong> {q.option_d}</span>
          </div>
          <div className="qa-answer">Correct: <strong>{q.correct_option}</strong></div>
        </div>
      ))}
    </div>
  )
}

function showAddQuestionModal(paper, openModal, closeModal) {
  openModal({
    title: `Add Question — ${paper.title}`,
    content: <AddQuestionForm />,
    footer: (
      <>
        <button className="btn-secondary" onClick={closeModal}>Cancel</button>
        <button className="btn-action" onClick={async () => {
          const alertEl = document.getElementById('m-alert')
          alertEl.style.display = 'none'

          // Check if QB UID was entered
          const qbUid = document.getElementById('m-qbuid')?.value.trim().toUpperCase()
          if (qbUid) {
            try {
              const { data: bankQ } = await api.get(`/question-bank/by-uid/${qbUid}`)
              await api.post(`/admin/papers/${paper.id}/questions`, {
                bank_id: bankQ.id,
                marks: bankQ.marks,
                order_index: 0,
              })
              closeModal()
            } catch (err) {
              alertEl.textContent = err.response?.status === 404
                ? `Invalid QB UID: "${qbUid}" — question not found.`
                : err.response?.data?.detail || 'Failed.'
              alertEl.style.display = 'block'
            }
            return
          }

          // Manual entry
          const qtext = document.getElementById('m-qtext').value.trim()
          const oa = document.getElementById('m-oa').value.trim()
          const ob = document.getElementById('m-ob').value.trim()
          const oc = document.getElementById('m-oc').value.trim()
          const od = document.getElementById('m-od').value.trim()
          const correct = document.getElementById('m-correct').value
          const marks = parseInt(document.getElementById('m-qmarks').value)
          if (!qtext || !oa || !ob || !oc || !od) {
            alertEl.textContent = 'Enter a QB UID or fill all question fields.'
            alertEl.style.display = 'block'
            return
          }
          try {
            await api.post(`/admin/papers/${paper.id}/questions`, {
              question_text: qtext, option_a: oa, option_b: ob, option_c: oc, option_d: od,
              correct_option: correct, marks,
            })
            closeModal()
          } catch (err) {
            alertEl.textContent = err.response?.data?.detail || 'Failed.'
            alertEl.style.display = 'block'
          }
        }}>Add Question</button>
      </>
    ),
  })
}

function AddQuestionForm() {
  return (
    <>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>Quick Add by QB UID</div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input id="m-qbuid" type="text" placeholder="e.g. 09DS, 22QB" style={{ flex: 1, textTransform: 'uppercase' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Enter UID to add directly</span>
        </div>
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center' }}>— or fill manually below —</div>
      <div className="form-group"><label>Question Text</label><textarea id="m-qtext" rows={3} placeholder="Enter the question..." /></div>
      <div className="form-group"><label>Option A</label><input id="m-oa" type="text" placeholder="Option A" /></div>
      <div className="form-group"><label>Option B</label><input id="m-ob" type="text" placeholder="Option B" /></div>
      <div className="form-group"><label>Option C</label><input id="m-oc" type="text" placeholder="Option C" /></div>
      <div className="form-group"><label>Option D</label><input id="m-od" type="text" placeholder="Option D" /></div>
      <div className="form-group">
        <label>Correct Option</label>
        <select id="m-correct">
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>
      <div className="form-group"><label>Marks</label><input id="m-qmarks" type="number" defaultValue={1} min={1} /></div>
      <div id="m-alert" className="alert alert-error" style={{ display: 'none' }}></div>
    </>
  )
}

// ── Assignments ────────────────────────────────────────────────────────────

function AssignmentsSection({ openModal, closeModal }) {
  const [assignments, setAssignments] = useState([])
  const [users, setUsers] = useState([])
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [a, u, p] = await Promise.all([
        api.get('/admin/assignments'),
        api.get('/admin/users'),
        api.get('/admin/papers'),
      ])
      setAssignments(a.data)
      setUsers(u.data)
      setPapers(p.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))
  const paperMap = Object.fromEntries(papers.map((p) => [p.id, p]))
  const students = users.filter((u) => u.role === 'student')

  const showAssignModal = () => {
    openModal({
      title: 'Assign Paper to Student',
      content: <AssignForm students={students} papers={papers} />,
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const studentId = parseInt(document.getElementById('m-student').value)
            const paperId = parseInt(document.getElementById('m-paper').value)
            const alertEl = document.getElementById('m-alert')
            try {
              await api.post('/admin/assign', { student_id: studentId, paper_id: paperId })
              closeModal()
              load()
            } catch (err) {
              alertEl.textContent = err.response?.data?.detail || 'Failed.'
              alertEl.style.display = 'block'
            }
          }}>Assign</button>
        </>
      ),
    })
  }

  const showBatchAssignModal = () => {
    const batches = [...new Set(users.filter(u => u.role === 'student').map(u => u))]
    openModal({
      title: 'Assign Paper to Entire Batch',
      content: (
        <>
          <div className="form-group">
            <label>Select Batch</label>
            <select id="ba-batch">
              <option value="">-- Select Batch --</option>
            </select>
          </div>
          <div className="form-group">
            <label>Question Paper</label>
            <select id="ba-paper">
              {papers.map(p => <option key={p.id} value={p.id}>[{p.id}] {p.title}</option>)}
            </select>
          </div>
          <div id="ba-alert" className="alert alert-error" style={{ display: 'none' }} />
          <div id="ba-success" className="alert alert-success" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const batchId = document.getElementById('ba-batch').value
            const paperId = document.getElementById('ba-paper').value
            const alertEl = document.getElementById('ba-alert')
            const successEl = document.getElementById('ba-success')
            alertEl.style.display = 'none'
            successEl.style.display = 'none'
            if (!batchId) { alertEl.textContent = 'Select a batch.'; alertEl.style.display = 'block'; return }
            try {
              const { data } = await api.post('/admin/assign-batch', { batch_id: parseInt(batchId), paper_id: parseInt(paperId) })
              successEl.textContent = data.message
              successEl.style.display = 'block'
              load()
            } catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Assign to Batch</button>
        </>
      ),
    })
    // Load batches after modal renders
    setTimeout(async () => {
      try {
        const { data } = await api.get('/batches')
        const sel = document.getElementById('ba-batch')
        if (sel) {
          data.forEach(b => {
            const opt = document.createElement('option')
            opt.value = b.id; opt.textContent = `${b.name} (${b.member_count} students)`
            sel.appendChild(opt)
          })
        }
      } catch {}
    }, 100)
  }

  if (loading) return <div className="loading">Loading assignments...</div>

  return (
    <>
      <div className="section-header">
        <h3>Paper Assignments ({assignments.length})</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={showBatchAssignModal}>Assign to Batch</button>
          <button className="btn-action" onClick={showAssignModal}>Assign Paper</button>
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Student Email</th>
            <th>Paper Set ID</th>
            <th>Paper Title</th>
            <th>Assigned On</th>
          </tr>
        </thead>
        <tbody>
          {assignments.length === 0 ? (
            <tr><td colSpan={5} className="empty-state">No assignments yet.</td></tr>
          ) : assignments.map((a) => (
            <tr key={a.id}>
              <td><span className="roll-number">{userMap[a.student_id]?.roll_number || '--'}</span></td>
              <td>{userMap[a.student_id]?.email || '--'}</td>
              <td><span className="paper-id">{a.paper_id}</span></td>
              <td>{paperMap[a.paper_id]?.title || '--'}</td>
              <td>{fmtDate(a.assigned_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function AssignForm({ students, papers }) {
  return (
    <>
      <div className="form-group">
        <label>Student</label>
        <select id="m-student">
          {students.length === 0
            ? <option disabled>No students available</option>
            : students.map((s) => <option key={s.id} value={s.id}>{s.roll_number} — {s.email}</option>)
          }
        </select>
      </div>
      <div className="form-group">
        <label>Question Paper</label>
        <select id="m-paper">
          {papers.length === 0
            ? <option disabled>No papers available</option>
            : papers.map((p) => <option key={p.id} value={p.id}>[{p.id}] {p.title}</option>)
          }
        </select>
      </div>
      <div id="m-alert" className="alert alert-error" style={{ display: 'none' }}></div>
    </>
  )
}

// ── Submissions ────────────────────────────────────────────────────────────

function SubmissionsSection() {
  const [submissions, setSubmissions] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([api.get('/admin/submissions'), api.get('/admin/users')])
      .then(([s, u]) => { setSubmissions(s.data); setUsers(u.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  const regrantAccess = async (submissionId, studentEmail) => {
    if (!confirm(`Re-grant exam access to ${studentEmail}? Their submission will be deleted and they can retake the exam.`)) return
    try {
      await api.delete(`/admin/submissions/${submissionId}/reset`)
      alert('Exam access re-granted. Student can now retake the exam.')
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to re-grant access.')
    }
  }

  if (loading) return <div className="loading">Loading submissions...</div>

  return (
    <>
      <div className="section-header"><h3>Submissions ({submissions.length})</h3></div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Student Email</th>
            <th>Paper Set ID</th>
            <th>Score</th>
            <th>Result</th>
            <th>Submitted At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.length === 0 ? (
            <tr><td colSpan={7} className="empty-state">No submissions yet.</td></tr>
          ) : submissions.map((s) => (
            <tr key={s.id}>
              <td><span className="roll-number">{userMap[s.student_id]?.roll_number || '--'}</span></td>
              <td>{userMap[s.student_id]?.email || '--'}</td>
              <td><span className="paper-id">{s.paper_id}</span></td>
              <td>{s.score !== null ? `${s.score} / ${s.total_marks}` : 'Pending'}</td>
              <td>
                {s.passed !== null
                  ? <span style={{ fontWeight: 700, fontSize: '0.78rem', color: s.passed ? 'var(--success)' : 'var(--error)' }}>
                      {s.passed ? 'PASS' : 'FAIL'}
                    </span>
                  : '--'
                }
              </td>
              <td>{fmtDate(s.submitted_at)}</td>
              <td>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                    onClick={() => regrantAccess(s.id, userMap[s.student_id]?.email || 'student')}
                  >
                    Re-grant Access
                  </button>
                  {s.passed && (
                    <button
                      className="btn-action"
                      style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                      onClick={async () => {
                        try {
                          await api.post(`/certificates/issue/${s.id}`)
                          alert('Certificate issued successfully.')
                        } catch (err) { alert(err.response?.data?.detail || 'Failed') }
                      }}
                    >
                      Issue Cert
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

// ── Malpractice ────────────────────────────────────────────────────────────

function MalpracticeSection() {
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/admin/malpractice'), api.get('/admin/users')])
      .then(([l, u]) => { setLogs(l.data); setUsers(u.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  if (loading) return <div className="loading">Loading malpractice logs...</div>

  return (
    <>
      <div className="section-header"><h3>Malpractice Logs ({logs.length})</h3></div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Student Email</th>
            <th>Event</th>
            <th>Description</th>
            <th>Paper Set ID</th>
            <th>Logged At</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr><td colSpan={6} className="empty-state">No malpractice events recorded.</td></tr>
          ) : logs.map((log) => (
            <tr key={log.id}>
              <td><span className="roll-number">{userMap[log.student_id]?.roll_number || '--'}</span></td>
              <td>{userMap[log.student_id]?.email || '--'}</td>
              <td><span className="badge badge-inactive" style={{ textTransform: 'none' }}>{log.event_type}</span></td>
              <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{log.description || '--'}</td>
              <td>{log.paper_id ? <span className="paper-id">{log.paper_id}</span> : '--'}</td>
              <td>{fmtDate(log.logged_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

// ── RBAC ───────────────────────────────────────────────────────────────────

const PERMISSION_LABELS = {
  manage_students: 'Manage Students',
  manage_papers: 'Manage Question Papers',
  manage_assignments: 'Manage Assignments',
  view_submissions: 'View Submissions',
  view_malpractice: 'View Malpractice Logs',
}

function RBACSection({ openModal, closeModal }) {
  const [staffList, setStaffList] = useState([])
  const [availablePerms, setAvailablePerms] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, p] = await Promise.all([
        api.get('/admin/rbac/staff'),
        api.get('/admin/rbac/permissions'),
      ])
      setStaffList(s.data)
      setAvailablePerms(p.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deleteStaff = async (id, name) => {
    if (!confirm(`Remove staff member "${name}"?`)) return
    try {
      await api.delete(`/admin/rbac/staff/${id}`)
      load()
    } catch (err) { alert(err.response?.data?.detail || 'Failed.') }
  }

  const toggleStaff = async (id, isActive) => {
    try {
      await api.patch(`/admin/rbac/staff/${id}`, { is_active: !isActive })
      load()
    } catch (err) { alert(err.response?.data?.detail || 'Failed.') }
  }

  const showAddModal = () => {
    openModal({
      title: 'Add Staff Member',
      content: <AddStaffForm availablePerms={availablePerms} />,
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const name = document.getElementById('m-name').value.trim()
            const designation = document.getElementById('m-designation').value.trim()
            const email = document.getElementById('m-email').value.trim()
            const password = document.getElementById('m-password').value
            const alertEl = document.getElementById('m-alert')
            alertEl.style.display = 'none'

            const selectedPerms = availablePerms
              .filter(p => document.getElementById(`perm-${p.key}`)?.checked)
              .map(p => p.key)

            if (!name || !email || !password) {
              alertEl.textContent = 'Name, email and password are required.'
              alertEl.style.display = 'block'
              return
            }
            try {
              await api.post('/admin/rbac/staff', {
                full_name: name,
                designation,
                email,
                password,
                permissions: selectedPerms,
              })
              closeModal()
              load()
            } catch (err) {
              alertEl.textContent = err.response?.data?.detail || 'Failed.'
              alertEl.style.display = 'block'
            }
          }}>Add Staff</button>
        </>
      ),
    })
  }

  const showEditModal = (staff) => {
    const profile = staff.staff_profile
    const currentPerms = profile?.permissions || []
    openModal({
      title: `Edit — ${profile?.full_name || staff.email}`,
      content: <EditStaffForm staff={staff} availablePerms={availablePerms} currentPerms={currentPerms} />,
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const name = document.getElementById('m-name').value.trim()
            const designation = document.getElementById('m-designation').value.trim()
            const alertEl = document.getElementById('m-alert')
            alertEl.style.display = 'none'

            const selectedPerms = availablePerms
              .filter(p => document.getElementById(`perm-${p.key}`)?.checked)
              .map(p => p.key)

            try {
              await api.patch(`/admin/rbac/staff/${staff.id}`, {
                full_name: name,
                designation,
                permissions: selectedPerms,
              })
              closeModal()
              load()
            } catch (err) {
              alertEl.textContent = err.response?.data?.detail || 'Failed.'
              alertEl.style.display = 'block'
            }
          }}>Save Changes</button>
        </>
      ),
    })
  }

  if (loading) return <div className="loading">Loading staff...</div>

  return (
    <>
      <div className="section-header">
        <h3>Staff Members ({staffList.length})</h3>
        <button className="btn-action" onClick={showAddModal}>Add Staff Member</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Designation</th>
            <th>Email</th>
            <th>Permissions</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staffList.length === 0 ? (
            <tr><td colSpan={6} className="empty-state">No staff members added yet.</td></tr>
          ) : staffList.map((s) => {
            const profile = s.staff_profile
            const perms = profile?.permissions || []
            return (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{profile?.full_name || '--'}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{profile?.designation || '--'}</td>
                <td>{s.email}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {perms.length === 0
                      ? <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No permissions</span>
                      : perms.map(p => (
                        <span key={p} className="perm-tag">{PERMISSION_LABELS[p] || p}</span>
                      ))
                    }
                  </div>
                </td>
                <td>
                  <span className={`badge ${s.is_active ? 'badge-active' : 'badge-inactive'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-secondary" onClick={() => showEditModal(s)}>Edit</button>
                  <button className="btn-secondary" onClick={() => toggleStaff(s.id, s.is_active)}>
                    {s.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button className="btn-danger" onClick={() => deleteStaff(s.id, profile?.full_name || s.email)}>
                    Remove
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}

function AddStaffForm({ availablePerms }) {
  return (
    <>
      <div className="form-group">
        <label>Full Name</label>
        <input id="m-name" type="text" placeholder="e.g. Rajesh Kumar" />
      </div>
      <div className="form-group">
        <label>Designation</label>
        <input id="m-designation" type="text" placeholder="e.g. Invigilator, Coordinator" />
      </div>
      <div className="form-group">
        <label>Email Address</label>
        <input id="m-email" type="email" placeholder="staff@institution.edu" />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input id="m-password" type="password" placeholder="Minimum 8 characters" />
      </div>
      <div className="form-group">
        <label>Permissions</label>
        <div className="perm-checklist">
          {availablePerms.map(p => (
            <label key={p.key} className="perm-check-item">
              <input type="checkbox" id={`perm-${p.key}`} value={p.key} />
              <span>{p.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div id="m-alert" className="alert alert-error" style={{ display: 'none' }}></div>
    </>
  )
}

function EditStaffForm({ staff, availablePerms, currentPerms }) {
  const profile = staff.staff_profile
  return (
    <>
      <div className="form-group">
        <label>Full Name</label>
        <input id="m-name" type="text" defaultValue={profile?.full_name || ''} />
      </div>
      <div className="form-group">
        <label>Designation</label>
        <input id="m-designation" type="text" defaultValue={profile?.designation || ''} />
      </div>
      <div className="form-group">
        <label>Permissions</label>
        <div className="perm-checklist">
          {availablePerms.map(p => (
            <label key={p.key} className="perm-check-item">
              <input
                type="checkbox"
                id={`perm-${p.key}`}
                value={p.key}
                defaultChecked={currentPerms.includes(p.key)}
              />
              <span>{p.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div id="m-alert" className="alert alert-error" style={{ display: 'none' }}></div>
    </>
  )
}

// ── ID Lookup ──────────────────────────────────────────────────────────────

function LookupSection() {
  const [queryType, setQueryType] = useState('paper')
  const [queryValue, setQueryValue] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const QUERY_TYPES = [
    { key: 'paper',    label: 'Paper Set ID',   placeholder: 'Enter numeric Set ID e.g. 2' },
    { key: 'question', label: 'Question ID',     placeholder: 'Enter numeric Question ID' },
    { key: 'user',     label: 'User ID',         placeholder: 'Enter numeric User ID' },
    { key: 'roll',     label: 'Roll Number',     placeholder: 'Enter 9-char roll number e.g. A3F7K2M91' },
  ]

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!queryValue.trim()) return
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const endpoint = queryType === 'roll'
        ? `/admin/lookup/roll/${queryValue.trim().toUpperCase()}`
        : `/admin/lookup/${queryType}/${queryValue.trim()}`
      const { data } = await api.get(endpoint)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Not found.')
    } finally {
      setLoading(false)
    }
  }

  const current = QUERY_TYPES.find(q => q.key === queryType)

  return (
    <div className="lookup-wrapper">
      <div className="section-header">
        <h3>ID Lookup</h3>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Query any entity by its ID — paper, question, user, or roll number.
      </p>

      <form onSubmit={handleSearch} className="lookup-form">
        <div className="lookup-type-tabs">
          {QUERY_TYPES.map(q => (
            <button
              key={q.key}
              type="button"
              className={`lookup-tab${queryType === q.key ? ' active' : ''}`}
              onClick={() => { setQueryType(q.key); setQueryValue(''); setResult(null); setError('') }}
            >
              {q.label}
            </button>
          ))}
        </div>
        <div className="lookup-input-row">
          <input
            type="text"
            value={queryValue}
            onChange={e => setQueryValue(e.target.value)}
            placeholder={current.placeholder}
            className="lookup-input"
          />
          <button type="submit" className="btn-action" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

      {result && <LookupResult result={result} />}
    </div>
  )
}

function LookupResult({ result }) {
  const fmtDate = (str) => str ? new Date(str).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '--'

  if (result.type === 'paper') {
    return (
      <div className="lookup-result">
        <div className="lookup-result-header">
          <span className="lookup-result-type">Question Paper</span>
          <span className="lookup-result-id">Set ID: {result.id}</span>
        </div>
        <div className="lookup-fields">
          <LookupField label="Title" value={result.title} />
          <LookupField label="Subject" value={result.subject} />
          <LookupField label="Duration" value={`${result.duration_minutes} minutes`} />
          <LookupField label="Total Marks" value={result.total_marks} />
          <LookupField label="Status" value={result.is_active ? 'Active' : 'Inactive'} />
          <LookupField label="Questions" value={result.question_count} />
          <LookupField label="Assigned To" value={`${result.assigned_to} student(s)`} />
          <LookupField label="Submissions" value={result.submissions} />
          <LookupField label="Created" value={fmtDate(result.created_at)} />
        </div>
        {result.questions.length > 0 && (
          <>
            <div className="lookup-sub-header">Questions in this paper</div>
            <table className="data-table" style={{ marginTop: '0.5rem' }}>
              <thead>
                <tr>
                  <th>Q ID</th>
                  <th>No.</th>
                  <th>Question</th>
                  <th>Marks</th>
                  <th>Answer</th>
                </tr>
              </thead>
              <tbody>
                {result.questions.map(q => (
                  <tr key={q.id}>
                    <td><span className="paper-id">{q.id}</span></td>
                    <td>{q.order}</td>
                    <td style={{ maxWidth: '320px', fontSize: '0.85rem' }}>{q.question_text}</td>
                    <td>{q.marks}</td>
                    <td><strong>{q.correct_option}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    )
  }

  if (result.type === 'question') {
    return (
      <div className="lookup-result">
        <div className="lookup-result-header">
          <span className="lookup-result-type">Question</span>
          <span className="lookup-result-id">Question ID: {result.id}</span>
        </div>
        <div className="lookup-fields">
          <LookupField label="Question" value={result.question_text} wide />
          <LookupField label="Option A" value={result.option_a} />
          <LookupField label="Option B" value={result.option_b} />
          <LookupField label="Option C" value={result.option_c} />
          <LookupField label="Option D" value={result.option_d} />
          <LookupField label="Correct Answer" value={result.correct_option} highlight />
          <LookupField label="Marks" value={result.marks} />
        </div>
        {result.belongs_to_paper && (
          <div className="lookup-belongs">
            Belongs to Paper — Set ID: <span className="paper-id">{result.belongs_to_paper.id}</span> &nbsp;
            <strong>{result.belongs_to_paper.title}</strong> ({result.belongs_to_paper.subject})
          </div>
        )}
      </div>
    )
  }

  if (result.type === 'user') {
    return (
      <div className="lookup-result">
        <div className="lookup-result-header">
          <span className="lookup-result-type">{result.role.charAt(0).toUpperCase() + result.role.slice(1)}</span>
          <span className="lookup-result-id">User ID: {result.id}</span>
        </div>
        <div className="lookup-fields">
          <LookupField label="Email" value={result.email} />
          <LookupField label="Role" value={result.role} />
          <LookupField label="Status" value={result.is_active ? 'Active' : 'Inactive'} />
          <LookupField label="Registered" value={fmtDate(result.created_at)} />
          {result.roll_number && <LookupField label="Roll Number" value={result.roll_number} mono />}
          {result.full_name && <LookupField label="Full Name" value={result.full_name} />}
          {result.designation && <LookupField label="Designation" value={result.designation} />}
          {result.permissions && (
            <LookupField label="Permissions" value={result.permissions.join(', ') || 'None'} />
          )}
          {result.malpractice_events !== undefined && (
            <LookupField label="Malpractice Events" value={result.malpractice_events} />
          )}
        </div>

        {result.assigned_papers?.length > 0 && (
          <>
            <div className="lookup-sub-header">Assigned Papers</div>
            <table className="data-table" style={{ marginTop: '0.5rem' }}>
              <thead><tr><th>Paper Set ID</th><th>Assigned On</th></tr></thead>
              <tbody>
                {result.assigned_papers.map((a, i) => (
                  <tr key={i}>
                    <td><span className="paper-id">{a.paper_id}</span></td>
                    <td>{fmtDate(a.assigned_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {result.submissions?.length > 0 && (
          <>
            <div className="lookup-sub-header">Submissions</div>
            <table className="data-table" style={{ marginTop: '0.5rem' }}>
              <thead><tr><th>Paper Set ID</th><th>Score</th><th>Submitted At</th></tr></thead>
              <tbody>
                {result.submissions.map((s, i) => (
                  <tr key={i}>
                    <td><span className="paper-id">{s.paper_id}</span></td>
                    <td>{s.score !== null ? `${s.score} / ${s.total_marks}` : 'Pending'}</td>
                    <td>{fmtDate(s.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    )
  }

  return null
}

function LookupField({ label, value, wide, mono, highlight }) {
  return (
    <div className={`lookup-field${wide ? ' wide' : ''}`}>
      <span className="lookup-field-label">{label}</span>
      <span className={`lookup-field-value${mono ? ' mono' : ''}${highlight ? ' highlight' : ''}`}>
        {value}
      </span>
    </div>
  )
}

// ── Colleges ───────────────────────────────────────────────────────────────

const PLAN_LIMITS = { basic: 600, limited: 1800, standard: 3000, premium: 5000 }
const PLAN_MIN = 100
const PLAN_COLORS = { basic: '#6a1b9a', limited: '#1565c0', standard: '#1a5c2a', premium: '#b8860b' }

function CollegesSection({ openModal, closeModal }) {
  const [colleges, setColleges] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCollege, setSelectedCollege] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/colleges')
      setColleges(data)
      if (selectedCollege) {
        const updated = data.find(c => c.id === selectedCollege.id)
        if (updated) setSelectedCollege(updated)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deleteCollege = async (id, name) => {
    if (!confirm(`Delete college "${name}"? All associated students will lose their college link.`)) return
    try {
      await api.delete(`/admin/colleges/${id}`)
      if (selectedCollege?.id === id) setSelectedCollege(null)
      load()
    } catch (err) { alert(err.response?.data?.detail || 'Failed.') }
  }

  const showCreateModal = () => {
    openModal({
      title: 'Add College',
      content: <CollegeForm />,
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const name = document.getElementById('m-cname').value.trim()
            const code = document.getElementById('m-ccode').value.trim()
            const plan = document.getElementById('m-cplan').value
            const limit = parseInt(document.getElementById('m-climit').value)
            const alertEl = document.getElementById('m-alert')
            alertEl.style.display = 'none'
            if (!name || !code || !limit) {
              alertEl.textContent = 'All fields are required.'
              alertEl.style.display = 'block'
              return
            }
            const max = PLAN_LIMITS[plan]
            if (limit < PLAN_MIN || limit > max) {
              alertEl.textContent = `Seat limit for ${plan} plan must be between ${PLAN_MIN} and ${max}.`
              alertEl.style.display = 'block'
              return
            }
            try {
              const subtype = document.getElementById('m-subtype')?.value || null
              const validUntil = document.getElementById('m-valid')?.value || null
              await api.post('/admin/colleges', {
                name, code, plan, seat_limit: limit,
                subscription_type: subtype || null,
                valid_until: validUntil ? new Date(validUntil).toISOString() : null,
              })
              closeModal()
              load()
            } catch (err) {              alertEl.textContent = err.response?.data?.detail || 'Failed.'
              alertEl.style.display = 'block'
            }
          }}>Add College</button>
        </>
      ),
    })
  }

  const showBatchModal = (college) => {
    openModal({
      title: `Add Students — ${college.name}`,
      content: <BatchAddForm college={college} />,
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" id="batch-submit-btn">Add Students</button>
        </>
      ),
    })
    // Attach handler after render
    setTimeout(() => {
      const btn = document.getElementById('batch-submit-btn')
      if (btn) btn.onclick = () => handleBatchSubmit(college, closeModal, load)
    }, 100)
  }

  if (loading) return <div className="loading">Loading colleges...</div>

  return (
    <div className="colleges-layout">
      <div className="colleges-main">
        <div className="section-header">
          <h3>Colleges ({colleges.length})</h3>
          <button className="btn-action" onClick={showCreateModal}>Add College</button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Plan</th>
              <th>Seats Used</th>
              <th>Remaining</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {colleges.length === 0 ? (
              <tr><td colSpan={7} className="empty-state">No colleges added yet.</td></tr>
            ) : colleges.map(c => (
              <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedCollege(c)}>
                <td><span className="roll-number">{c.code}</span></td>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>
                  <span className="badge" style={{ background: `${PLAN_COLORS[c.plan]}18`, color: PLAN_COLORS[c.plan] }}>
                    {c.plan}
                  </span>
                </td>
                <td>{c.students_count} / {c.seat_limit}</td>
                <td style={{ color: c.seats_remaining === 0 ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>
                  {c.seats_remaining}
                </td>
                <td><span className={`badge ${c.is_active ? 'badge-active' : 'badge-inactive'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                <td style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                  <button className="btn-secondary" onClick={() => showBatchModal(c)}>Add Students</button>
                  <button className="btn-danger" onClick={() => deleteCollege(c.id, c.name)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quota panel */}
      {selectedCollege && (
        <div className="quota-panel">
          <div className="quota-header">
            <div className="quota-code">{selectedCollege.code}</div>
            <div className="quota-name">{selectedCollege.name}</div>
          </div>
          <div className="quota-plan-badge" style={{ background: `${PLAN_COLORS[selectedCollege.plan]}18`, color: PLAN_COLORS[selectedCollege.plan] }}>
            {selectedCollege.plan.toUpperCase()} PLAN
          </div>
          <div className="quota-bar-wrap">
            <div className="quota-bar-track">
              <div
                className="quota-bar-fill"
                style={{
                  width: `${Math.min(100, (selectedCollege.students_count / selectedCollege.seat_limit) * 100)}%`,
                  background: selectedCollege.seats_remaining === 0 ? 'var(--error)' : 'var(--success)',
                }}
              />
            </div>
            <div className="quota-bar-label">
              {selectedCollege.students_count} / {selectedCollege.seat_limit} seats used
            </div>
          </div>
          <div className="quota-stats">
            <div className="quota-stat">
              <span className="quota-stat-val">{selectedCollege.students_count}</span>
              <span className="quota-stat-label">Enrolled</span>
            </div>
            <div className="quota-stat">
              <span className="quota-stat-val" style={{ color: selectedCollege.seats_remaining === 0 ? 'var(--error)' : 'var(--success)' }}>
                {selectedCollege.seats_remaining}
              </span>
              <span className="quota-stat-label">Remaining</span>
            </div>
            <div className="quota-stat">
              <span className="quota-stat-val">{selectedCollege.seat_limit}</span>
              <span className="quota-stat-label">Total Seats</span>
            </div>
          </div>
          <div className="quota-plan-info">
            <div className="quota-plan-row">
              <span>Plan</span><strong>{selectedCollege.plan}</strong>
            </div>
            <div className="quota-plan-row">
              <span>Max allowed</span><strong>{PLAN_LIMITS[selectedCollege.plan].toLocaleString()}</strong>
            </div>
            <div className="quota-plan-row">
              <span>Min required</span><strong>{PLAN_MIN}</strong>
            </div>
          </div>
          <button className="btn-action" style={{ width: '100%', marginTop: '1rem' }}
            onClick={() => showBatchModal(selectedCollege)}>
            Add Students to this College
          </button>
        </div>
      )}
    </div>
  )
}

function CollegeForm() {
  const [plan, setPlan] = useState('basic')
  const max = PLAN_LIMITS[plan]
  return (
    <>
      <div className="form-group"><label>College Name</label><input id="m-cname" type="text" placeholder="e.g. Sri Venkateswara College of Engineering" /></div>
      <div className="form-group"><label>College Code</label><input id="m-ccode" type="text" placeholder="e.g. SVCE" style={{ textTransform: 'uppercase' }} /></div>
      <div className="form-group">
        <label>Plan</label>
        <select id="m-cplan" value={plan} onChange={e => setPlan(e.target.value)}>
          <option value="basic">Basic (100 - 600 students)</option>
          <option value="limited">Limited (100 - 1800 students)</option>
          <option value="standard">Standard (100 - 3000 students)</option>
          <option value="premium">Premium (100 - 5000 students)</option>
        </select>
      </div>
      <div className="form-group">
        <label>Subscription Type</label>
        <select id="m-subtype">
          <option value="">-- Select --</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div className="form-group">
        <label>Valid Until (subscription expiry)</label>
        <input id="m-valid" type="date" />
      </div>
      <div className="form-group">
        <label>Seat Limit ({PLAN_MIN} - {max})</label>
        <input id="m-climit" type="number" min={PLAN_MIN} max={max} defaultValue={PLAN_MIN} />
      </div>
      <div id="m-alert" className="alert alert-error" style={{ display: 'none' }}></div>
    </>
  )
}

function BatchAddForm({ college }) {
  const [mode, setMode] = useState('count')
  const [preview, setPreview] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const remaining = college.seats_remaining

  const doPreview = async () => {
    const rollStart = document.getElementById('b-roll-start')?.value.trim().toUpperCase()
    const rollEnd = document.getElementById('b-roll-end')?.value.trim().toUpperCase()
    const alertEl = document.getElementById('b-alert')
    if (!rollStart || !rollEnd) return
    alertEl.style.display = 'none'
    setPreviewing(true)
    setPreview(null)
    try {
      const domain = document.getElementById('b-domain')?.value.trim().replace('@', '') || 'college.edu'
      const { data } = await api.post(`/admin/colleges/${college.id}/preview-roll-range`, {
        college_id: college.id,
        roll_start: rollStart,
        roll_end: rollEnd,
        email_domain: domain,
        default_password: 'preview',
      })
      setPreview(data)
    } catch (err) {
      alertEl.textContent = err.response?.data?.detail || 'Invalid roll range.'
      alertEl.style.display = 'block'
    } finally {
      setPreviewing(false)
    }
  }

  return (
    <div>
      <div className="quota-mini">
        Seats remaining: <strong style={{ color: remaining === 0 ? 'var(--error)' : 'var(--success)' }}>{remaining}</strong> / {college.seat_limit}
      </div>

      <div className="batch-mode-tabs">
        <button type="button" className={`lookup-tab${mode === 'count' ? ' active' : ''}`}
          onClick={() => { setMode('count'); setPreview(null) }}>By Count</button>
        <button type="button" className={`lookup-tab${mode === 'roll' ? ' active' : ''}`}
          onClick={() => { setMode('roll'); setPreview(null) }}>By Roll Range</button>
      </div>

      {mode === 'count' && (
        <div style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label>Number of Students (max {remaining})</label>
            <input id="b-count" type="number" min={1} max={remaining} placeholder={`1 - ${remaining}`} />
          </div>
          <div className="form-group">
            <label>Email Domain</label>
            <input id="b-domain" type="text" placeholder="college.edu" />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Students get: student1@college.edu, student2@college.edu...
            </small>
          </div>
          <div className="form-group">
            <label>Default Password</label>
            <input id="b-password" type="text" placeholder="e.g. College@2025" />
          </div>
        </div>
      )}

      {mode === 'roll' && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label>Start Roll Number</label>
              <input id="b-roll-start" type="text" placeholder="e.g. 242UA05100"
                style={{ textTransform: 'uppercase' }}
                onChange={() => setPreview(null)} />
            </div>
            <div className="form-group">
              <label>End Roll Number</label>
              <input id="b-roll-end" type="text" placeholder="e.g. 242UA05500"
                style={{ textTransform: 'uppercase' }}
                onChange={() => setPreview(null)} />
            </div>
          </div>
          <div className="form-group">
            <label>Email Domain</label>
            <input id="b-domain" type="text" placeholder="college.edu" />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Students get: 242ua05100@college.edu...
            </small>
          </div>
          <div className="form-group">
            <label>Default Password</label>
            <input id="b-password" type="text" placeholder="e.g. College@2025" />
          </div>

          <button type="button" className="btn-secondary" style={{ marginBottom: '0.75rem' }}
            onClick={doPreview} disabled={previewing}>
            {previewing ? 'Checking...' : 'Preview Range'}
          </button>

          {preview && (
            <div className={`roll-preview ${preview.status}`}>
              <div className="roll-preview-count">{preview.count} students</div>
              <div className="roll-preview-range">{preview.roll_start} → {preview.roll_end}</div>
              <div className="roll-preview-msg">{preview.message}</div>
              <div className="roll-preview-seats">
                Seats: {preview.seats_used} used / {preview.seat_limit} total / <strong>{preview.seats_remaining} remaining</strong>
              </div>
            </div>
          )}
        </div>
      )}

      <div id="b-alert" className="alert alert-error" style={{ display: 'none' }}></div>
      <div id="b-success" className="alert alert-success" style={{ display: 'none' }}></div>
      <input type="hidden" id="b-mode" value={mode} />
    </div>
  )
}

async function handleBatchSubmit(college, closeModal, reload) {
  const mode = document.getElementById('b-mode')?.value
  const domain = document.getElementById('b-domain')?.value.trim().replace('@', '')
  const password = document.getElementById('b-password')?.value
  const alertEl = document.getElementById('b-alert')
  const successEl = document.getElementById('b-success')
  if (alertEl) alertEl.style.display = 'none'
  if (successEl) successEl.style.display = 'none'

  if (!domain || !password) {
    if (alertEl) { alertEl.textContent = 'Email domain and password are required.'; alertEl.style.display = 'block' }
    return
  }

  try {
    let res
    if (mode === 'count') {
      const count = parseInt(document.getElementById('b-count')?.value)
      if (!count || count < 1) {
        if (alertEl) { alertEl.textContent = 'Enter a valid count.'; alertEl.style.display = 'block' }
        return
      }
      res = await api.post(`/admin/colleges/${college.id}/batch-by-count`, {
        college_id: college.id, count, email_domain: domain, default_password: password,
      })
    } else {
      const rollStart = document.getElementById('b-roll-start')?.value.trim().toUpperCase()
      const rollEnd = document.getElementById('b-roll-end')?.value.trim().toUpperCase()
      if (!rollStart || !rollEnd) {
        if (alertEl) { alertEl.textContent = 'Enter start and end roll numbers.'; alertEl.style.display = 'block' }
        return
      }
      res = await api.post(`/admin/colleges/${college.id}/batch-by-roll`, {
        college_id: college.id, roll_start: rollStart, roll_end: rollEnd,
        email_domain: domain, default_password: password,
      })
    }
    if (successEl) {
      successEl.textContent = res.data.message
      successEl.style.display = 'block'
    }
    setTimeout(() => { closeModal(); reload() }, 1500)
  } catch (err) {
    if (alertEl) {
      alertEl.textContent = err.response?.data?.detail || 'Failed.'
      alertEl.style.display = 'block'
    }
  }
}

// ── AI Paper Generator ─────────────────────────────────────────────────────

function AIPaperSection({ openModal, closeModal }) {
  const [form, setForm] = useState({
    topic: '',
    subject: '',
    num_questions: 10,
    marks_per_question: 2,
    level: 'standard',
    additional_instructions: '',
  })
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!form.topic.trim()) { setError('Topic is required.'); return }
    setError('')
    setGenerating(true)
    setGenerated(null)
    setSaved(false)
    try {
      const { data } = await api.post('/admin/ai/generate-paper', {
        topic: form.topic,
        subject: form.subject || form.topic,
        num_questions: parseInt(form.num_questions),
        marks_per_question: parseInt(form.marks_per_question),
        level: form.level,
        additional_instructions: form.additional_instructions || null,
      })
      setGenerated(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Generation failed. Check your Gemini API key.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSavePaper = async () => {
    if (!generated) return
    setSaving(true)
    try {
      // Create paper
      const paperRes = await api.post('/admin/papers', {
        title: `${generated.topic} — AI Generated`,
        subject: generated.subject,
        duration_minutes: generated.questions.length * 2,
        total_marks: generated.total_marks,
      })
      const paperId = paperRes.data.id

      // Add all questions
      for (let i = 0; i < generated.questions.length; i++) {
        const q = generated.questions[i]
        await api.post(`/admin/papers/${paperId}/questions`, {
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          marks: q.marks,
          order_index: i,
        })
      }
      setSaved(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save paper.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '860px' }}>
      <div className="section-header">
        <h3>AI Paper Generator</h3>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Powered by Gemini</span>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Generate MCQ question papers automatically. Set the topic, difficulty, and marks — Gemini will create the questions.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label>Topic</label>
            <input type="text" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})}
              placeholder="e.g. Binary Trees, OOP in Java, AWS S3" />
          </div>
          <div className="form-group">
            <label>Subject (optional)</label>
            <input type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
              placeholder="Defaults to topic if empty" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label>No. of Questions</label>
              <input type="number" value={form.num_questions} min={1} max={30}
                onChange={e => setForm({...form, num_questions: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Marks per Question</label>
              <input type="number" value={form.marks_per_question} min={1} max={10}
                onChange={e => setForm({...form, marks_per_question: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Difficulty Level</label>
            <select value={form.level} onChange={e => setForm({...form, level: e.target.value})}>
              <option value="easy">Easy — Basic recall and simple understanding</option>
              <option value="standard">Standard — Moderate application and analysis</option>
              <option value="hard">Hard — Advanced problem solving</option>
            </select>
          </div>
          <div className="form-group">
            <label>Additional Instructions (optional)</label>
            <textarea value={form.additional_instructions}
              onChange={e => setForm({...form, additional_instructions: e.target.value})}
              rows={2} placeholder="e.g. Focus on time complexity, include code snippets..." />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" className="btn-action" style={{ width: '100%' }} disabled={generating}>
            {generating ? 'Generating with Gemini...' : 'Generate Paper'}
          </button>
        </form>

        <div>
          {generating && (
            <div className="ai-generating">
              <div className="ai-spinner" />
              <p>Gemini is generating your questions...</p>
            </div>
          )}

          {generated && (
            <div className="ai-result">
              <div className="ai-result-header">
                <div>
                  <div className="ai-result-title">{generated.topic}</div>
                  <div className="ai-result-meta">{generated.questions.length} questions · {generated.total_marks} marks · {form.level}</div>
                </div>
                {!saved ? (
                  <button className="btn-action" onClick={handleSavePaper} disabled={saving}>
                    {saving ? 'Saving...' : 'Save as Paper'}
                  </button>
                ) : (
                  <span className="badge badge-active" style={{ padding: '0.4rem 0.75rem' }}>Saved</span>
                )}
              </div>
              <div className="ai-questions-list">
                {generated.questions.map((q, i) => (
                  <div key={i} className="ai-question-item">
                    <div className="ai-q-num">Q{i + 1} · {q.marks} mark{q.marks > 1 ? 's' : ''}</div>
                    <div className="ai-q-text">{q.question_text}</div>
                    <div className="ai-q-options">
                      {['a','b','c','d'].map(opt => (
                        <span key={opt} className={`ai-q-opt${q.correct_option.toLowerCase() === opt ? ' correct' : ''}`}>
                          <strong>{opt.toUpperCase()}.</strong> {q[`option_${opt}`]}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Roles Management ───────────────────────────────────────────────────────────

const ROLE_LABELS = {
  admin: 'Admin',
  it_coordinator: 'IT Coordinator',
  exam_setter: 'Exam Setter',
}

const ROLE_DESCRIPTIONS = {
  admin: 'Full access to all modules. Can manage all operations.',
  it_coordinator: 'System-level administrator. Equivalent access to Admin.',
  exam_setter: 'Can create and manage question papers, question bank, and tests.',
}

function RolesSection({ roleType, openModal, closeModal }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/roles/${roleType}`)
      setUsers(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [roleType])

  const toggleUser = async (id, isActive) => {
    try {
      await api.patch(`/admin/roles/${roleType}/${id}`, { is_active: !isActive })
      load()
    } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const deleteUser = async (id, email) => {
    if (!confirm(`Delete ${ROLE_LABELS[roleType]} "${email}"? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/roles/${roleType}/${id}`)
      load()
    } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const showAdd = () => {
    openModal({
      title: `Add ${ROLE_LABELS[roleType]}`,
      content: (
        <>
          <div style={{ background: 'var(--off-white)', border: '1px solid var(--border)', padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {ROLE_DESCRIPTIONS[roleType]}
          </div>
          <div className="form-group"><label>Full Name</label><input id="m-name" type="text" placeholder="e.g. Rajesh Kumar" /></div>
          <div className="form-group"><label>Designation</label><input id="m-designation" type="text" placeholder={`e.g. ${ROLE_LABELS[roleType]}`} /></div>
          <div className="form-group"><label>Email Address</label><input id="m-email" type="email" placeholder="user@institution.edu" /></div>
          <div className="form-group"><label>Password</label><input id="m-password" type="password" placeholder="Minimum 8 characters" /></div>
          <div id="m-alert" className="alert alert-error" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const full_name = document.getElementById('m-name').value.trim()
            const designation = document.getElementById('m-designation').value.trim()
            const email = document.getElementById('m-email').value.trim()
            const password = document.getElementById('m-password').value
            const alertEl = document.getElementById('m-alert')
            alertEl.style.display = 'none'
            if (!full_name || !email || !password) {
              alertEl.textContent = 'Name, email and password are required.'
              alertEl.style.display = 'block'
              return
            }
            try {
              await api.post(`/admin/roles/${roleType}`, { full_name, designation, email, password, role_type: roleType })
              closeModal()
              load()
            } catch (err) {
              alertEl.textContent = err.response?.data?.detail || 'Failed.'
              alertEl.style.display = 'block'
            }
          }}>Add {ROLE_LABELS[roleType]}</button>
        </>
      ),
    })
  }

  const showEdit = (user) => {
    openModal({
      title: `Edit — ${user.full_name || user.email}`,
      content: (
        <>
          <div className="form-group"><label>Full Name</label><input id="m-name" type="text" defaultValue={user.full_name || ''} /></div>
          <div className="form-group"><label>Designation</label><input id="m-designation" type="text" defaultValue={user.designation || ''} /></div>
          <div className="form-group"><label>New Password (leave blank to keep)</label><input id="m-password" type="password" placeholder="Leave blank to keep current" /></div>
          <div id="m-alert" className="alert alert-error" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-action" onClick={async () => {
            const full_name = document.getElementById('m-name').value.trim()
            const designation = document.getElementById('m-designation').value.trim()
            const password = document.getElementById('m-password').value
            const alertEl = document.getElementById('m-alert')
            alertEl.style.display = 'none'
            const payload = {}
            if (full_name) payload.full_name = full_name
            if (designation) payload.designation = designation
            if (password) payload.password = password
            try {
              await api.patch(`/admin/roles/${roleType}/${user.id}`, payload)
              closeModal()
              load()
            } catch (err) {
              alertEl.textContent = err.response?.data?.detail || 'Failed.'
              alertEl.style.display = 'block'
            }
          }}>Save Changes</button>
        </>
      ),
    })
  }

  if (loading) return <div className="loading">Loading {ROLE_LABELS[roleType]}s...</div>

  return (
    <>
      <div className="section-header">
        <div>
          <h3>{ROLE_LABELS[roleType]}s ({users.length})</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{ROLE_DESCRIPTIONS[roleType]}</p>
        </div>
        <button className="btn-action" onClick={showAdd}>Add {ROLE_LABELS[roleType]}</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Designation</th>
            <th>Email</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr><td colSpan={6} className="empty-state">No {ROLE_LABELS[roleType]}s added yet.</td></tr>
          ) : users.map(u => (
            <tr key={u.id}>
              <td style={{ fontWeight: 600 }}>{u.full_name || '--'}</td>
              <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{u.designation || '--'}</td>
              <td>{u.email}</td>
              <td><span className={`badge ${u.is_active ? 'badge-active' : 'badge-inactive'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
              <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '--'}</td>
              <td style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn-secondary" onClick={() => showEdit(u)}>Edit</button>
                <button className="btn-secondary" onClick={() => toggleUser(u.id, u.is_active)}>
                  {u.is_active ? 'Disable' : 'Enable'}
                </button>
                <button className="btn-danger" onClick={() => deleteUser(u.id, u.email)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}


