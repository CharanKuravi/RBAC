'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export default function CertificatesSection() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const { data } = await api.get('/certificates/admin/all'); setCerts(data) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const issue = async (submissionId) => {
    try {
      await api.post(`/certificates/issue/${submissionId}`)
      load()
    } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const approve = async (certId) => {
    try {
      await api.post(`/certificates/${certId}/approve`)
      load()
    } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '--'

  if (loading) return <div className="loading">Loading certificates...</div>

  return (
    <>
      <div className="section-header">
        <h3>Certificates ({certs.length})</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <label className="btn-secondary" style={{ fontSize: '0.78rem', cursor: 'pointer', padding: '0.4rem 0.85rem' }}>
            Upload Certificate PDF
            <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={async (e) => {
              const file = e.target.files[0]
              if (!file) return
              const certId = prompt('Enter the Certificate ID (e.g. CERT-XXXXXXXXXX):')
              if (!certId) return
              alert(`Certificate PDF "${file.name}" noted for cert ${certId}. Note: Custom PDF upload requires server-side storage setup. The system auto-generates PDFs from the Download button.`)
              e.target.value = ''
            }} />
          </label>
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Cert ID</th>
            <th>Candidate</th>
            <th>CID</th>
            <th>Paper</th>
            <th>Score</th>
            <th>Rank</th>
            <th>Status</th>
            <th>Issued</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {certs.length === 0
            ? <tr><td colSpan={9} className="empty-state">No certificates issued yet.</td></tr>
            : certs.map(c => (
              <tr key={c.id}>
                <td><span className="roll-number" style={{ fontSize: '0.72rem' }}>{c.cert_id}</span></td>
                <td style={{ fontSize: '0.85rem' }}>{c.student_name}</td>
                <td><span className="roll-number">{c.student_cid}</span></td>
                <td style={{ fontSize: '0.82rem' }}>{c.paper_title}</td>
                <td>{c.score !== null ? `${c.score}/${c.total_marks}` : '--'}</td>
                <td>{c.rank ? `#${c.rank}` : '--'}</td>
                <td>
                  {c.is_approved
                    ? <span className="badge badge-active">Approved</span>
                    : <span className="badge badge-inactive">Pending</span>
                  }
                </td>
                <td style={{ fontSize: '0.78rem' }}>{fmtDate(c.issued_at)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {!c.is_approved && (
                      <button className="btn-action" style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                        onClick={() => approve(c.cert_id)}>Approve</button>
                    )}
                    {c.is_approved && (
                      <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                        onClick={async () => {
                          try {
                            const res = await api.get(`/certificates/download/${c.cert_id}`, { responseType: 'blob' })
                            const url = URL.createObjectURL(res.data)
                            const a = document.createElement('a'); a.href = url
                            a.download = `certificate_${c.cert_id}.pdf`; a.click()
                            URL.revokeObjectURL(url)
                          } catch (err) { alert('Failed to download.') }
                        }}>Download</button>
                    )}
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


