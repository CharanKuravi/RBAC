'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export default function QuestionBulkUploadSection() {
  const [file, setFile] = useState(null)
  const [uploadMethod, setUploadMethod] = useState('excel') // excel, ai
  const [extractedQuestions, setExtractedQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [defaultSubject, setDefaultSubject] = useState('')
  const [defaultTopic, setDefaultTopic] = useState('')
  const [defaultDifficulty, setDefaultDifficulty] = useState('medium')

  // ── Excel/CSV Template Upload ────────────────────────────────────────────────
  const uploadExcel = async () => {
    if (!file) { setError('Select a file first.'); return }
    setError(''); setResult(null); setLoading(true)
    
    try {
      const form = new FormData()
      form.append('file', file)
      if (defaultSubject) form.append('subject', defaultSubject)
      if (defaultTopic) form.append('topic', defaultTopic)
      form.append('difficulty', defaultDifficulty)
      
      const { data } = await api.post('/question-bank/bulk-upload', form)
      setResult(data)
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.')
    }
    setLoading(false)
  }

  // ── AI-Powered Question Extraction ───────────────────────────────────────────
  const extractWithAI = async () => {
    if (!file) { setError('Select a file first.'); return }
    setError(''); setExtractedQuestions([]); setLoading(true)
    
    try {
      const form = new FormData()
      form.append('file', file)
      
      const { data } = await api.post('/ai/extract-questions', form)
      setExtractedQuestions(data.questions || [])
      if (data.questions.length === 0) {
        setError('No questions found in the file. Please check the file format.')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'AI extraction failed. Try manual Excel upload.')
    }
    setLoading(false)
  }

  // ── Save Extracted Questions ─────────────────────────────────────────────────
  const saveExtracted = async () => {
    if (extractedQuestions.length === 0) return
    setLoading(true); setError(''); setResult(null)
    
    try {
      const payload = {
        questions: extractedQuestions,
        default_subject: defaultSubject || null,
        default_topic: defaultTopic || null,
        default_difficulty: defaultDifficulty,
      }
      const { data } = await api.post('/question-bank/bulk-save', payload)
      setResult(data)
      setExtractedQuestions([])
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save questions.')
    }
    setLoading(false)
  }

  // ── Edit extracted question ──────────────────────────────────────────────────
  const updateQuestion = (index, field, value) => {
    const updated = [...extractedQuestions]
    updated[index][field] = value
    setExtractedQuestions(updated)
  }

  const removeQuestion = (index) => {
    setExtractedQuestions(extractedQuestions.filter((_, i) => i !== index))
  }

  // ── Download Templates ───────────────────────────────────────────────────────
  const downloadExcelTemplate = () => {
    const csv = [
      'question_text,option_a,option_b,option_c,option_d,correct_option,marks,difficulty,subject,topic',
      'What is 2+2?,3,4,5,6,B,1,easy,Mathematics,Arithmetic',
      'Capital of France?,Berlin,Paris,Rome,Madrid,B,1,easy,Geography,Capitals',
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'question_bulk_upload_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="section-header">
        <h3>Bulk Upload Questions</h3>
      </div>

      {/* Upload Method Selection */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        borderBottom: '2px solid var(--border)',
        paddingBottom: '0.5rem'
      }}>
        <button 
          onClick={() => setUploadMethod('excel')}
          style={{
            padding: '0.5rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: uploadMethod === 'excel' ? 700 : 400,
            background: uploadMethod === 'excel' ? 'var(--accent)' : 'transparent',
            color: uploadMethod === 'excel' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: uploadMethod === 'excel' ? '3px solid var(--accent)' : 'none',
            cursor: 'pointer',
          }}
        >
          📊 Excel/CSV Template
        </button>
        <button 
          onClick={() => setUploadMethod('ai')}
          style={{
            padding: '0.5rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: uploadMethod === 'ai' ? 700 : 400,
            background: uploadMethod === 'ai' ? 'var(--accent)' : 'transparent',
            color: uploadMethod === 'ai' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: uploadMethod === 'ai' ? '3px solid var(--accent)' : 'none',
            cursor: 'pointer',
          }}
        >
          🤖 AI-Powered Extraction
        </button>
      </div>

      {/* Excel/CSV Upload Method */}
      {uploadMethod === 'excel' && (
        <div style={{ maxWidth: '800px' }}>
          <div style={{ 
            padding: '1rem', 
            border: '1px solid var(--border)', 
            background: 'var(--bg-secondary)', 
            marginBottom: '1.5rem', 
            fontSize: '0.82rem', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.7 
          }}>
            <strong>📋 Excel/CSV Format:</strong><br />
            The file must have these columns (row 1 = headers):<br />
            <code style={{ fontFamily: 'Courier New', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem', padding: '0.5rem', background: 'var(--white)' }}>
              question_text, option_a, option_b, option_c, option_d, correct_option, marks, difficulty, subject, topic
            </code>
            <div style={{ marginTop: '0.5rem', fontSize: '0.78rem' }}>
              • <strong>correct_option</strong> must be A, B, C, or D<br />
              • <strong>difficulty</strong> must be easy, medium, or hard<br />
              • <strong>subject</strong> and <strong>topic</strong> can be empty (will use defaults below)
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <button 
                className="btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                onClick={downloadExcelTemplate}
              >
                📥 Download Template
              </button>
            </div>
          </div>

          {/* Default Values */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '0.75rem', 
            marginBottom: '1.5rem' 
          }}>
            <div className="form-group">
              <label>Default Subject (optional)</label>
              <input 
                type="text" 
                value={defaultSubject} 
                onChange={e => setDefaultSubject(e.target.value)}
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="form-group">
              <label>Default Topic (optional)</label>
              <input 
                type="text" 
                value={defaultTopic} 
                onChange={e => setDefaultTopic(e.target.value)}
                placeholder="e.g. Algebra"
              />
            </div>
            <div className="form-group">
              <label>Default Difficulty</label>
              <select value={defaultDifficulty} onChange={e => setDefaultDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Upload Excel/CSV File</label>
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              onChange={e => setFile(e.target.files[0])}
              style={{ 
                padding: '0.5rem', 
                border: '1px solid var(--border)', 
                width: '100%', 
                background: 'var(--bg-secondary)', 
                color: 'var(--text-primary)' 
              }} 
            />
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <button className="btn-action" onClick={uploadExcel} disabled={loading || !file}>
            {loading ? 'Uploading...' : '📤 Upload and Import Questions'}
          </button>
        </div>
      )}

      {/* AI-Powered Extraction Method */}
      {uploadMethod === 'ai' && (
        <div style={{ maxWidth: '100%' }}>
          <div style={{ 
            padding: '1rem', 
            border: '1px solid var(--border)', 
            background: 'var(--bg-secondary)', 
            marginBottom: '1.5rem', 
            fontSize: '0.82rem', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.7 
          }}>
            <strong>🤖 AI-Powered Question Extraction:</strong><br />
            Upload any document and our AI will automatically extract questions:<br />
            <div style={{ marginTop: '0.5rem' }}>
              ✅ <strong>Supported formats:</strong> PDF, Word (.docx), Images (JPG, PNG), Excel<br />
              ✅ <strong>What AI recognizes:</strong> Question text, options A-D, correct answers, marks<br />
              ✅ <strong>Review & Edit:</strong> You can review and edit before saving<br />
              ⚠️ <strong>Note:</strong> AI extraction requires backend integration with Gemini/OpenAI
            </div>
          </div>

          {/* Default Values */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '0.75rem', 
            marginBottom: '1.5rem' 
          }}>
            <div className="form-group">
              <label>Default Subject (optional)</label>
              <input 
                type="text" 
                value={defaultSubject} 
                onChange={e => setDefaultSubject(e.target.value)}
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="form-group">
              <label>Default Topic (optional)</label>
              <input 
                type="text" 
                value={defaultTopic} 
                onChange={e => setDefaultTopic(e.target.value)}
                placeholder="e.g. Algebra"
              />
            </div>
            <div className="form-group">
              <label>Default Difficulty</label>
              <select value={defaultDifficulty} onChange={e => setDefaultDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Upload Document (PDF, Word, Image, Excel)</label>
            <input 
              type="file" 
              accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.jpeg,.png" 
              onChange={e => setFile(e.target.files[0])}
              style={{ 
                padding: '0.5rem', 
                border: '1px solid var(--border)', 
                width: '100%', 
                background: 'var(--bg-secondary)', 
                color: 'var(--text-primary)' 
              }} 
            />
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <button className="btn-action" onClick={extractWithAI} disabled={loading || !file}>
            {loading ? '🔄 Extracting with AI...' : '🤖 Extract Questions with AI'}
          </button>

          {/* Extracted Questions Review */}
          {extractedQuestions.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid var(--border)'
              }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  ✅ Extracted {extractedQuestions.length} Questions - Review & Edit
                </h4>
                <button className="btn-action" onClick={saveExtracted} disabled={loading}>
                  {loading ? 'Saving...' : `💾 Save All ${extractedQuestions.length} Questions`}
                </button>
              </div>

              {extractedQuestions.map((q, idx) => (
                <div key={idx} style={{ 
                  border: '1px solid var(--border)', 
                  background: 'var(--white)',
                  padding: '1rem', 
                  marginBottom: '1rem',
                  borderRadius: '4px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: '0.85rem',
                      color: 'var(--accent)'
                    }}>
                      Question #{idx + 1}
                    </span>
                    <button 
                      className="btn-danger" 
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      onClick={() => removeQuestion(idx)}
                    >
                      🗑️ Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Question Text</label>
                    <textarea 
                      rows={2} 
                      value={q.question_text}
                      onChange={e => updateQuestion(idx, 'question_text', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label>Option A</label>
                      <input 
                        type="text" 
                        value={q.option_a}
                        onChange={e => updateQuestion(idx, 'option_a', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Option B</label>
                      <input 
                        type="text" 
                        value={q.option_b}
                        onChange={e => updateQuestion(idx, 'option_b', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Option C</label>
                      <input 
                        type="text" 
                        value={q.option_c}
                        onChange={e => updateQuestion(idx, 'option_c', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Option D</label>
                      <input 
                        type="text" 
                        value={q.option_d}
                        onChange={e => updateQuestion(idx, 'option_d', e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr 2fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label>Correct</label>
                      <select 
                        value={q.correct_option}
                        onChange={e => updateQuestion(idx, 'correct_option', e.target.value)}
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Marks</label>
                      <input 
                        type="number" 
                        value={q.marks}
                        onChange={e => updateQuestion(idx, 'marks', parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="form-group">
                      <label>Difficulty</label>
                      <select 
                        value={q.difficulty}
                        onChange={e => updateQuestion(idx, 'difficulty', e.target.value)}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Subject</label>
                      <input 
                        type="text" 
                        value={q.subject || ''}
                        onChange={e => updateQuestion(idx, 'subject', e.target.value)}
                        placeholder={defaultSubject || 'Optional'}
                      />
                    </div>
                    <div className="form-group">
                      <label>Topic</label>
                      <input 
                        type="text" 
                        value={q.topic || ''}
                        onChange={e => updateQuestion(idx, 'topic', e.target.value)}
                        placeholder={defaultTopic || 'Optional'}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button className="btn-action" onClick={saveExtracted} disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Saving...' : `💾 Save All ${extractedQuestions.length} Questions to Question Bank`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload Results */}
      {result && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '1rem', 
            maxWidth: '400px', 
            marginBottom: '1rem' 
          }}>
            <div style={{ 
              border: '1px solid var(--border)', 
              padding: '1rem', 
              textAlign: 'center',
              background: 'var(--white)'
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--success)' }}>
                {result.created || result.imported || 0}
              </div>
              <div style={{ 
                fontSize: '0.72rem', 
                color: 'var(--text-muted)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.06em' 
              }}>
                Questions Added
              </div>
            </div>
            <div style={{ 
              border: '1px solid var(--border)', 
              padding: '1rem', 
              textAlign: 'center',
              background: 'var(--white)'
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--error)' }}>
                {result.skipped || result.failed || 0}
              </div>
              <div style={{ 
                fontSize: '0.72rem', 
                color: 'var(--text-muted)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.06em' 
              }}>
                Skipped/Failed
              </div>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                Errors:
              </div>
              <div style={{ 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border)', 
                padding: '0.75rem',
                fontSize: '0.82rem',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {result.errors.map((err, i) => (
                  <div key={i} style={{ color: 'var(--error)', marginBottom: '0.25rem' }}>
                    • {err}
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: '1rem' }}>
            <button className="btn-secondary" onClick={() => setResult(null)}>
              ✓ Done
            </button>
          </div>
        </div>
      )}
    </>
  )
}
