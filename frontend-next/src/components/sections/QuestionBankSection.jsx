'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export default function QuestionBankSection({ openModal, closeModal }) {
  const [questions, setQuestions] = useState([])
  const [papers, setPapers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ subject: '', topic: '', difficulty: '', keyword: '' })
  const [subjectTab, setSubjectTab] = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.subject) params.append('subject', filters.subject)
      if (filters.topic) params.append('topic', filters.topic)
      if (filters.difficulty) params.append('difficulty', filters.difficulty)
      if (filters.keyword) params.append('keyword', filters.keyword)
      const [qRes, pRes] = await Promise.all([
        api.get(`/question-bank?${params}`),
        api.get('/admin/papers'),
      ])
      setQuestions(qRes.data)
      setPapers(pRes.data)
      // Extract unique subjects
      const subs = [...new Set(qRes.data.map(q => q.subject).filter(Boolean))].sort()
      setSubjects(subs)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const displayedQuestions = subjectTab === 'all'
    ? questions
    : subjectTab === 'none'
    ? questions.filter(q => !q.subject)
    : questions.filter(q => q.subject === subjectTab)

  // ── Add question ────────────────────────────────────────────────────────────
  const showAdd = () => {
    openModal({
      title: 'Add to Question Bank',
      content: (
        <>
          <div className="form-group"><label>Question Text</label><textarea id="m-qtext" rows={3} placeholder="Enter question..." /></div>
          <div className="form-group"><label>Option A</label><input id="m-oa" type="text" /></div>
          <div className="form-group"><label>Option B</label><input id="m-ob" type="text" /></div>
          <div className="form-group"><label>Option C</label><input id="m-oc" type="text" /></div>
          <div className="form-group"><label>Option D</label><input id="m-od" type="text" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label>Correct Answer</label>
              <select id="m-correct"><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select>
            </div>
            <div className="form-group"><label>Marks</label><input id="m-marks" type="number" defaultValue={1} min={1} /></div>
            <div className="form-group">
              <label>Difficulty</label>
              <select id="m-diff"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group"><label>Subject</label><input id="m-subject" type="text" placeholder="e.g. Mathematics" /></div>
            <div className="form-group"><label>Topic</label><input id="m-topic" type="text" placeholder="e.g. Algebra" /></div>
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
            const payload = {
              question_text: document.getElementById('m-qtext').value.trim(),
              option_a: document.getElementById('m-oa').value.trim(),
              option_b: document.getElementById('m-ob').value.trim(),
              option_c: document.getElementById('m-oc').value.trim(),
              option_d: document.getElementById('m-od').value.trim(),
              correct_option: document.getElementById('m-correct').value,
              marks: parseInt(document.getElementById('m-marks').value),
              difficulty: document.getElementById('m-diff').value,
              subject: document.getElementById('m-subject').value.trim() || null,
              topic: document.getElementById('m-topic').value.trim() || null,
            }
            if (!payload.question_text || !payload.option_a || !payload.option_b || !payload.option_c || !payload.option_d) {
              alertEl.textContent = 'All question fields are required.'
              alertEl.style.display = 'block'
              return
            }
            try { await api.post('/question-bank', payload); closeModal(); load() }
            catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Add Question</button>
        </>
      ),
    })
  }

  // ── Edit question (versioned) ───────────────────────────────────────────────
  const showEdit = (q) => {
    openModal({
      title: `Edit Question #${q.id}`,
      content: (
        <>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Editing creates a new version. Current version: v{q.version}
          </div>
          <div className="form-group"><label>Question Text</label><textarea id="e-qtext" rows={3} defaultValue={q.question_text} /></div>
          <div className="form-group"><label>Option A</label><input id="e-oa" type="text" defaultValue={q.option_a} /></div>
          <div className="form-group"><label>Option B</label><input id="e-ob" type="text" defaultValue={q.option_b} /></div>
          <div className="form-group"><label>Option C</label><input id="e-oc" type="text" defaultValue={q.option_c} /></div>
          <div className="form-group"><label>Option D</label><input id="e-od" type="text" defaultValue={q.option_d} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label>Correct Answer</label>
              <select id="e-correct" defaultValue={q.correct_option}>
                <option value="A">A</option><option value="B">B</option>
                <option value="C">C</option><option value="D">D</option>
              </select>
            </div>
            <div className="form-group"><label>Marks</label><input id="e-marks" type="number" defaultValue={q.marks} min={1} /></div>
            <div className="form-group">
              <label>Difficulty</label>
              <select id="e-diff" defaultValue={q.difficulty}>
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group"><label>Subject</label><input id="e-subject" type="text" defaultValue={q.subject || ''} /></div>
            <div className="form-group"><label>Topic</label><input id="e-topic" type="text" defaultValue={q.topic || ''} /></div>
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
            const payload = {
              question_text: document.getElementById('e-qtext').value.trim(),
              option_a: document.getElementById('e-oa').value.trim(),
              option_b: document.getElementById('e-ob').value.trim(),
              option_c: document.getElementById('e-oc').value.trim(),
              option_d: document.getElementById('e-od').value.trim(),
              correct_option: document.getElementById('e-correct').value,
              marks: parseInt(document.getElementById('e-marks').value),
              difficulty: document.getElementById('e-diff').value,
              subject: document.getElementById('e-subject').value.trim() || null,
              topic: document.getElementById('e-topic').value.trim() || null,
            }
            if (!payload.question_text) {
              alertEl.textContent = 'Question text is required.'
              alertEl.style.display = 'block'
              return
            }
            try { await api.patch(`/question-bank/${q.id}`, payload); closeModal(); load() }
            catch (err) { alertEl.textContent = err.response?.data?.detail || 'Failed'; alertEl.style.display = 'block' }
          }}>Save New Version</button>
        </>
      ),
    })
  }

  // ── Add to paper ────────────────────────────────────────────────────────────
  const showAddToPaper = (q) => {
    openModal({
      title: `Add Question #${q.id} to Paper`,
      content: (
        <>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>{q.question_text}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              A: {q.option_a} &nbsp;|&nbsp; B: {q.option_b} &nbsp;|&nbsp; C: {q.option_c} &nbsp;|&nbsp; D: {q.option_d}
            </div>
            <div style={{ marginTop: '0.4rem', fontSize: '0.78rem' }}>
              Correct: <strong>{q.correct_option}</strong> &nbsp;&nbsp;
              Marks: <strong>{q.marks}</strong> &nbsp;&nbsp;
              Difficulty: <strong>{q.difficulty}</strong>
            </div>
          </div>
          <div className="form-group">
            <label>Select Paper</label>
            <select id="atp-paper">
              <option value="">-- Select a paper --</option>
              {papers.map(p => (
                <option key={p.id} value={p.id}>Set {p.id} — {p.title} ({p.subject})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Marks Override <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional — leave blank to use bank default of {q.marks})</span></label>
            <input id="atp-marks" type="number" min={1} placeholder={q.marks} />
          </div>
          <div id="atp-alert" className="alert alert-error" style={{ display: 'none' }} />
          <div id="atp-success" className="alert alert-success" style={{ display: 'none' }} />
        </>
      ),
      footer: (
        <>
          <button className="btn-secondary" onClick={closeModal}>Close</button>
          <button className="btn-action" onClick={async () => {
            const alertEl = document.getElementById('atp-alert')
            const successEl = document.getElementById('atp-success')
            alertEl.style.display = 'none'
            successEl.style.display = 'none'
            const paperId = document.getElementById('atp-paper').value
            const marksVal = document.getElementById('atp-marks').value
            if (!paperId) {
              alertEl.textContent = 'Select a paper first.'
              alertEl.style.display = 'block'
              return
            }
            const payload = {
              bank_id: q.id,
              marks: marksVal ? parseInt(marksVal) : q.marks,
              order_index: 0,
            }
            try {
              await api.post(`/admin/papers/${paperId}/questions`, payload)
              successEl.textContent = `Question added to Set ${paperId} successfully.`
              successEl.style.display = 'block'
              alertEl.style.display = 'none'
            } catch (err) {
              alertEl.textContent = err.response?.data?.detail || 'Failed to add question.'
              alertEl.style.display = 'block'
            }
          }}>Add to Paper</button>
        </>
      ),
    })
  }

  const DIFF_COLORS = { easy: 'var(--success)', medium: '#b8860b', hard: 'var(--error)' }

  return (
    <>
      <div className="section-header">
        <h3>Question Bank ({questions.length})</h3>
        <button className="btn-action" onClick={showAdd}>Add Question</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <input
          className="lookup-input" placeholder="Subject"
          value={filters.subject} onChange={e => setFilters({ ...filters, subject: e.target.value })}
        />
        <input
          className="lookup-input" placeholder="Topic"
          value={filters.topic} onChange={e => setFilters({ ...filters, topic: e.target.value })}
        />
        <select
          className="lookup-input"
          value={filters.difficulty} onChange={e => setFilters({ ...filters, difficulty: e.target.value })}
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            className="lookup-input" placeholder="Keyword search"
            value={filters.keyword} onChange={e => setFilters({ ...filters, keyword: e.target.value })}
            style={{ flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && load()}
          />
          <button className="btn-action" onClick={load}>Search</button>
        </div>
      </div>

      {/* Subject tabs */}
      {subjects.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[{ key: 'all', label: `All (${questions.length})` }, ...subjects.map(s => ({ key: s, label: `${s} (${questions.filter(q => q.subject === s).length})` })), { key: 'none', label: `No Subject (${questions.filter(q => !q.subject).length})` }].map(t => (
            <button key={t.key} onClick={() => setSubjectTab(t.key)} style={{
              padding: '0.3rem 0.75rem', fontSize: '0.78rem', cursor: 'pointer',
              fontWeight: subjectTab === t.key ? 700 : 400,
              background: subjectTab === t.key ? 'var(--accent)' : 'transparent',
              color: subjectTab === t.key ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}>{t.label}</button>
          ))}
        </div>
      )}

      {loading ? <div className="loading">Loading...</div> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>QB UID</th>
              <th>ID</th>
              <th>Question</th>
              <th>Subject</th>
              <th>Topic</th>
              <th>Difficulty</th>
              <th>Marks</th>
              <th>Ver.</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedQuestions.length === 0
              ? <tr><td colSpan={9} className="empty-state">No questions found.</td></tr>
              : displayedQuestions.map(q => (
                <tr key={q.id}>
                  <td><span className="roll-number" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>{q.qb_uid || '--'}</span></td>
                  <td><span className="paper-id">{q.id}</span></td>
                  <td style={{ maxWidth: '260px', fontSize: '0.85rem' }}>{q.question_text}</td>
                  <td style={{ fontSize: '0.82rem' }}>{q.subject || '--'}</td>
                  <td style={{ fontSize: '0.82rem' }}>{q.topic || '--'}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: DIFF_COLORS[q.difficulty] }}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td>{q.marks}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>v{q.version}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button className="btn-action" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => showEdit(q)}>
                        Edit
                      </button>
                      <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => showAddToPaper(q)}>
                        + Paper
                      </button>
                      <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={async () => {
                          if (!confirm('Archive this question? It will no longer appear in the bank.')) return
                          try { await api.delete(`/question-bank/${q.id}`); load() } catch {}
                        }}>
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      )}
    </>
  )
}


