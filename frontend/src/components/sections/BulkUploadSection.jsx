import { useState, useEffect } from 'react'
import api from '../../api/client'

export default function BulkUploadSection() {
  const [colleges, setColleges] = useState([])
  const [file, setFile] = useState(null)
  const [collegeId, setCollegeId] = useState('')
  const [defaultPassword, setDefaultPassword] = useState('Candidate@123')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/colleges').then(r => setColleges(r.data)).catch(() => {})
  }, [])

  const upload = async () => {
    if (!file) { setError('Select an Excel file first.'); return }
    setError(''); setResult(null); setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      if (collegeId) form.append('college_id', parseInt(collegeId))
      form.append('default_password', defaultPassword)
      // Let axios set Content-Type automatically for multipart
      const { data } = await api.post('/register/bulk-upload', form)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.')
    }
    setLoading(false)
  }

  return (
    <>
      <div className="section-header"><h3>Bulk Upload Candidates</h3></div>

      <div style={{ maxWidth: '600px' }}>
        <div style={{ padding: '1rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', marginBottom: '1.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong>Excel Format:</strong> The file must have these columns (row 1 = headers):<br />
          <code style={{ fontFamily: 'Courier New', fontSize: '0.8rem' }}>full_name, email, phone, aadhaar, course_code, batch_name</code><br />
          Only <strong>full_name</strong> and <strong>email</strong> are required. Others are optional.
          <div style={{ marginTop: '0.75rem' }}>
            <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
              onClick={() => {
                const csv = 'full_name,email,phone,aadhaar,course_code,batch_name\nJohn Doe,john@college.edu,9876543210,123456789012,BTCS,Nov 2025 Batch'
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = 'bulk_upload_template.csv'; a.click()
                URL.revokeObjectURL(url)
              }}>
              Download Template
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Excel File (.xlsx)</label>
          <input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files[0])}
            style={{ padding: '0.5rem', border: '1px solid var(--border)', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
        </div>

        <div className="form-group">
          <label>Assign to College (optional)</label>
          <select value={collegeId} onChange={e => setCollegeId(e.target.value)}>
            <option value="">-- None --</option>
            {colleges.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Default Password for all candidates</label>
          <input type="text" value={defaultPassword} onChange={e => setDefaultPassword(e.target.value)} />
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <button className="btn-action" onClick={upload} disabled={loading}>
          {loading ? 'Uploading...' : 'Upload and Create Candidates'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '400px', marginBottom: '1rem' }}>
            <div style={{ border: '1px solid var(--border)', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--success)' }}>{result.created}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Created</div>
            </div>
            <div style={{ border: '1px solid var(--border)', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--error)' }}>{result.skipped}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skipped</div>
            </div>
          </div>

          {result.skipped_details?.length > 0 && (
            <>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.5rem' }}>Skipped rows:</div>
              <table className="data-table">
                <thead><tr><th>Email</th><th>Reason</th></tr></thead>
                <tbody>
                  {result.skipped_details.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '0.82rem' }}>{s.row}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--error)' }}>{s.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </>
  )
}
