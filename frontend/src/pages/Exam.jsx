import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import QuestionCard from '../components/QuestionCard'
import Timer from '../components/Timer'
import { useTheme } from '../context/ThemeContext'
import '../styles/exam.css'

const MAX_VIOLATIONS = 5  // auto-submit threshold

export default function Exam() {
  const navigate = useNavigate()
  const [examData, setExamData]   = useState(null)
  const [answers, setAnswers]     = useState({})
  const [status, setStatus]       = useState('loading') // loading | preflight | ready | submitted | error
  const [errorMsg, setErrorMsg]   = useState('')
  const [result, setResult]       = useState(null)
  const [violations, setViolations] = useState(0)
  const [toast, setToast]         = useState({ msg: '', key: 0 })
  const [fsBlocked, setFsBlocked] = useState(false) // show "re-enter fullscreen" overlay

  const submitted    = useRef(false)
  const violationRef = useRef(0)
  const autoSubmitRef = useRef(null) // holds the submit function once defined
  const rollNumber   = localStorage.getItem('roll_number')
  const { theme, toggle: toggleTheme } = useTheme()

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(t => ({ msg, key: t.key + 1 }))
  }, [])

  // ── Log to backend ───────────────────────────────────────────────────────
  const logViolation = useCallback(async (eventType, description, paperId) => {
    try {
      await api.post('/exam/log-malpractice', {
        event_type: eventType,
        description,
        paper_id: paperId,
      })
    } catch {}
  }, [])

  // ── Add violation ────────────────────────────────────────────────────────
  const addViolation = useCallback((eventType, description, paperId) => {
    if (submitted.current) return
    violationRef.current += 1
    const count = violationRef.current
    setViolations(count)
    logViolation(eventType, `${description} (violation #${count})`, paperId)
    showToast(`Violation #${count}: ${description}`)
    if (count >= MAX_VIOLATIONS) {
      showToast('Maximum violations reached. Submitting exam automatically.')
      setTimeout(() => {
        if (autoSubmitRef.current) autoSubmitRef.current()
      }, 2000)
    }
  }, [logViolation, showToast])

  // ── Fullscreen helpers ───────────────────────────────────────────────────
  const enterFullscreen = () => {
    const el = document.documentElement
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen()
  }

  const isFullscreen = () =>
    !!(document.fullscreenElement ||
       document.webkitFullscreenElement ||
       document.mozFullScreenElement)

  // ── Fullscreen change handler ────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return

    const onFSChange = () => {
      if (submitted.current) return
      if (!isFullscreen()) {
        setFsBlocked(true)
        addViolation('fullscreen_exit', 'Exited fullscreen mode', examData?.paper?.id)
      } else {
        setFsBlocked(false)
      }
    }

    document.addEventListener('fullscreenchange', onFSChange)
    document.addEventListener('webkitfullscreenchange', onFSChange)
    document.addEventListener('mozfullscreenchange', onFSChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFSChange)
      document.removeEventListener('webkitfullscreenchange', onFSChange)
      document.removeEventListener('mozfullscreenchange', onFSChange)
    }
  }, [status, examData, addViolation])

  // ── Tab / window visibility ──────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return

    const onVisibility = () => {
      if (submitted.current || !examData) return
      if (document.hidden) {
        addViolation('tab_switch', 'Switched tab or minimized window', examData.paper.id)
      }
    }

    const onBlur = () => {
      if (submitted.current || !examData) return
      // Only count if not caused by fullscreen dialog
      if (!isFullscreen()) return
      addViolation('window_blur', 'Window lost focus', examData.paper.id)
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
    }
  }, [status, examData, addViolation])

  // ── Block right-click, copy, paste, shortcuts, back/forward ─────────────
  useEffect(() => {
    const noContext = (e) => {
      e.preventDefault()
      // Right-click is silently blocked — not counted as a violation
    }

    const noCopy = (e) => {
      e.preventDefault()
      // Copy is silently blocked — not counted as a violation
    }

    const noPaste = (e) => { e.preventDefault() }

    const noKeys = (e) => {
      // Block browser shortcuts
      if ((e.ctrlKey || e.metaKey) && ['c','v','u','s','a','p','w','t','n'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
      // Block F12, F5, Alt+Tab (partial)
      if (['F12', 'F5', 'F11'].includes(e.key)) e.preventDefault()
      // Block Alt+F4 / Alt+Tab
      if (e.altKey && ['F4', 'Tab'].includes(e.key)) e.preventDefault()
      // Block Escape from exiting fullscreen silently
      if (e.key === 'Escape') e.preventDefault()
    }

    // Block browser back/forward
    const noPopState = (e) => {
      window.history.pushState(null, '', window.location.href)
    }
    window.history.pushState(null, '', window.location.href)

    document.addEventListener('contextmenu', noContext)
    document.addEventListener('copy', noCopy)
    document.addEventListener('paste', noPaste)
    document.addEventListener('keydown', noKeys)
    window.addEventListener('popstate', noPopState)

    return () => {
      document.removeEventListener('contextmenu', noContext)
      document.removeEventListener('copy', noCopy)
      document.removeEventListener('paste', noPaste)
      document.removeEventListener('keydown', noKeys)
      window.removeEventListener('popstate', noPopState)
    }
  }, [status, examData, addViolation])

  // ── Block page close/refresh during exam ─────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return
    const onBeforeUnload = (e) => {
      if (submitted.current) return
      e.preventDefault()
      e.returnValue = ''
      addViolation('close_attempt', 'Attempted to close or refresh the exam', examData?.paper?.id)
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [status, examData, addViolation])

  // ── Load exam ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // Check if launched from a specific test
        const params = new URLSearchParams(window.location.search)
        const testId = params.get('testId')

        let data
        if (testId) {
          // Test-based exam flow
          const res = await api.get(`/exam/test/${testId}`)
          const td = res.data
          // Mark attendance
          try { await api.post(`/certificates/attendance/mark/${testId}`) } catch {}
          // Normalise to same shape as paper-based
          data = {
            paper: {
              id: td.paper_id,
              title: td.test_name,
              subject: '',
              duration_minutes: td.duration_minutes,
              total_marks: td.questions.reduce((s, q) => s + q.marks, 0),
              negative_marks: td.negative_marks,
              pass_percentage: td.pass_percentage,
            },
            questions: td.questions,
            assignment: { id: 0, student_id: 0, paper_id: td.paper_id, assigned_at: new Date().toISOString(), start_time: null, end_time: null },
            _testId: parseInt(testId),
          }
        } else {
          // Legacy paper-based exam flow
          const res = await api.get('/exam/my-paper')
          data = res.data
          data._testId = null
        }

        setExamData(data)
        const initial = {}
        data.questions.forEach((q) => { initial[q.id] = null })
        setAnswers(initial)
        setStatus('preflight')
      } catch (err) {
        setErrorMsg(err.response?.data?.detail || 'Failed to load exam.')
        setStatus('error')
      }
    }
    load()
  }, [])

  // ── Enter exam (after fullscreen confirmed) ──────────────────────────────
  const startExam = () => {
    enterFullscreen()
    // Small delay to let fullscreen settle
    setTimeout(() => setStatus('ready'), 400)
  }

  // ── Answer handler ───────────────────────────────────────────────────────
  const handleAnswer = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (auto = false) => {
    if (submitted.current) return

    if (!auto) {
      const answeredCount = Object.values(answers).filter(Boolean).length
      const total = examData.questions.length
      const unanswered = total - answeredCount
      if (unanswered > 0) {
        const ok = window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)
        if (!ok) return
      }
    }

    submitted.current = true
    if (isFullscreen()) document.exitFullscreen().catch(() => {})

    const payload = examData._testId
      ? {
          test_id: examData._testId,
          paper_id: examData.paper.id,
          answers: examData.questions.map((q) => ({
            question_id: q.id,
            selected_option: answers[q.id] || null,
          })),
        }
      : {
          paper_id: examData.paper.id,
          answers: examData.questions.map((q) => ({
            question_id: q.id,
            selected_option: answers[q.id] || null,
          })),
        }

    const endpoint = examData._testId ? '/exam/submit-test' : '/exam/submit'

    try {
      const { data } = await api.post(endpoint, payload)
      setResult(data)
      setStatus('submitted')
    } catch (err) {
      alert(err.response?.data?.detail || 'Submission failed. Contact the invigilator.')
      submitted.current = false
    }
  }

  // Register handleSubmit into the ref so addViolation can call it
  autoSubmitRef.current = () => handleSubmit(true)

  const handleTimeUp = () => {
    showToast('Time is up. Submitting automatically.')
    setTimeout(() => handleSubmit(true), 1500)
  }

  const answeredCount = Object.values(answers).filter(Boolean).length
  const totalCount    = examData?.questions?.length || 0

  // ── Screens ──────────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="exam-center-screen">
        <div className="exam-info-box">
          <p className="muted">Loading examination paper...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="exam-center-screen">
        <div className="exam-info-box">
          <h2>No Exam Assigned</h2>
          <p>{errorMsg}</p>
          <p className="muted" style={{ marginTop: '0.75rem' }}>Please contact your examination coordinator.</p>
          <button className="btn-secondary" style={{ marginTop: '1.5rem' }}
            onClick={() => { localStorage.clear(); navigate('/login') }}>
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  if (status === 'preflight') {
    return (
      <div className="exam-preflight">
        <div className="preflight-box">
          <div className="preflight-badge">Examination Environment</div>
          <h1>{examData.paper.title}</h1>
          <p className="preflight-subject">{examData.paper.subject}</p>
          <hr className="divider" />
          <div className="preflight-rules">
            <div className="rule-item">Fullscreen mode is mandatory throughout the exam</div>
            <div className="rule-item">Tab switching or minimizing the window is a violation</div>
            <div className="rule-item">Right-click, copy, and paste are disabled</div>
            <div className="rule-item">Exiting fullscreen is a violation</div>
            <div className="rule-item">Each violation is recorded and reported</div>
            <div className="rule-item">{MAX_VIOLATIONS} violations will result in automatic submission</div>
          </div>
          <hr className="divider" />
          <div className="preflight-meta">
            <span><strong>{totalCount}</strong> Questions</span>
            <span><strong>{examData.paper.total_marks}</strong> Marks</span>
            <span><strong>{examData.paper.duration_minutes}</strong> Minutes</span>
          </div>
          <button className="preflight-start-btn" onClick={startExam}>
            Enter Fullscreen and Begin Exam
          </button>
          <p className="preflight-note">
            By proceeding, you confirm that you will not engage in any malpractice.
            All activity is monitored and recorded.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'submitted') {
    return (
      <div className="exam-center-screen">
        <div className="exam-info-box">
          <h2>Examination Submitted</h2>
          <p>Your responses have been recorded successfully.</p>
          <hr className="divider" />
          <div className="score-display">{result.score} / {result.total_marks}</div>
          <p className="muted">Score out of {result.total_marks} marks</p>
          {violationRef.current > 0 && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--error)' }}>
              Total violations recorded: {violationRef.current}
            </p>
          )}
          <hr className="divider" />
          <button
            className="btn-primary"
            style={{ marginTop: '0.5rem' }}
            onClick={() => navigate(`/review/${result.id}`)}
          >
            Review Answers
          </button>
          <p className="muted" style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
            You may now close this window.
          </p>
        </div>
      </div>
    )
  }

  // ── Exam UI ───────────────────────────────────────────────────────────────

  return (
    <div className="exam-layout" style={{ userSelect: 'none' }}>

      {/* Fullscreen blocked overlay */}
      {fsBlocked && (
        <div className="fs-blocked-overlay">
          <div className="fs-blocked-box">
            <div className="fs-blocked-title">Fullscreen Required</div>
            <p>You exited fullscreen. This has been recorded as a violation.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--error)' }}>
              Violations: {violations} / {MAX_VIOLATIONS}
            </p>
            <button className="preflight-start-btn" style={{ marginTop: '1.25rem' }}
              onClick={() => { enterFullscreen(); setFsBlocked(false) }}>
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.msg && <ViolationToast message={toast.msg} toastKey={toast.key} />}

      <header className="exam-topbar">
        <div className="topbar-left">
          <span className="site-title">Exam Centre</span>
          <span className="exam-title">{examData.paper.title}</span>
        </div>
        <div className="topbar-right">
          <div className="student-info">
            <div className="info-label">Roll Number</div>
            <div className="info-value mono">{rollNumber || '--'}</div>
          </div>
          <div className="student-info">
            <div className="info-label">Set No.</div>
            <div className="info-value mono">{examData.paper.id}</div>
          </div>
          {/* Violation counter */}
          <div className={`violation-counter${violations > 0 ? ' has-violations' : ''}`}>
            <div className="info-label">Violations</div>
            <div className="violation-value">{violations} / {MAX_VIOLATIONS}</div>
          </div>
          <Timer durationMinutes={examData.paper.duration_minutes} onTimeUp={handleTimeUp} />
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      <main className="exam-body">
        <div className="exam-meta-bar">
          <div className="meta-item">
            <span className="meta-label">Subject</span>
            <span className="meta-value">{examData.paper.subject}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Total Questions</span>
            <span className="meta-value">{totalCount}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Total Marks</span>
            <span className="meta-value">{examData.paper.total_marks}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Duration</span>
            <span className="meta-value">{examData.paper.duration_minutes} min</span>
          </div>
        </div>

        {examData.questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={idx}
            selected={answers[q.id]}
            onSelect={handleAnswer}
          />
        ))}
      </main>

      <footer className="exam-submit-bar">
        <div className="progress-info">
          Answered: <strong>{answeredCount}</strong> / <strong>{totalCount}</strong>
        </div>
        <button className="btn-submit" onClick={() => handleSubmit(false)}>
          Submit Exam
        </button>
      </footer>
    </div>
  )
}

// ── Violation Toast ───────────────────────────────────────────────────────────
function ViolationToast({ message, toastKey }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 4500)
    return () => clearTimeout(t)
  }, [toastKey])

  if (!visible) return null
  return <div className="violation-toast">{message}</div>
}
