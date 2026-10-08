'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function StudentHackathonSection() {
  const router = useRouter()
  const [hackathons, setHackathons] = useState([])
  const [myHackathons, setMyHackathons] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('available') // available | registered

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [available, registered] = await Promise.all([
        api.get('/hackathons/available'),
        api.get('/hackathons/my-hackathons'),
      ])
      setHackathons(available.data)
      setMyHackathons(registered.data)
    } catch {}
    setLoading(false)
  }

  const register = async (hackathonId) => {
    if (!confirm('Register for this hackathon?')) return
    try {
      await api.post(`/hackathons/${hackathonId}/register`)
      alert('✅ Successfully registered!')
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Registration failed')
    }
  }

  const startHackathon = (hackathonId) => {
    const width = window.screen.width
    const height = window.screen.height
    
    const features = [
      `width=${width}`,
      `height=${height}`,
      'top=0',
      'left=0',
      'toolbar=no',
      'menubar=no',
      'location=no',
      'status=no',
      'scrollbars=yes',
      'resizable=no',
      'fullscreen=yes'
    ].join(',')
    
    const examWindow = window.open(
      `/exam?hackathonId=${hackathonId}&popup=true`,
      'HackathonWindow',
      features
    )
    
    if (!examWindow) {
      alert('Please allow popups to start the hackathon')
      return
    }
    
    examWindow.focus()
    
    const checkClosed = setInterval(() => {
      if (examWindow.closed) {
        clearInterval(checkClosed)
        load() // Refresh to update status
      }
    }, 1000)
  }

  const STATUS_COLORS = { 
    upcoming: '#b8860b', 
    active: 'var(--success)', 
    completed: 'var(--text-muted)' 
  }

  const getStatusBadge = (status) => {
    const colors = {
      upcoming: { bg: '#fff3cd', text: '#856404', label: 'UPCOMING' },
      active: { bg: '#d4edda', text: '#155724', label: 'LIVE NOW' },
      completed: { bg: '#f8d7da', text: '#721c24', label: 'ENDED' },
    }
    const color = colors[status] || colors.completed
    
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        fontSize: '0.7rem',
        fontWeight: 700,
        background: color.bg,
        color: color.text,
        borderRadius: '4px',
        letterSpacing: '0.05em'
      }}>
        {color.label}
      </span>
    )
  }

  if (loading) return <div className="loading">Loading hackathons...</div>

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        borderBottom: '2px solid var(--border)',
        paddingBottom: '1rem'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          🏆 Hackathons
        </h2>
        <button className="btn-secondary" onClick={() => router.push('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        borderBottom: '2px solid var(--border)'
      }}>
        <button 
          onClick={() => setTab('available')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: tab === 'available' ? 700 : 400,
            background: 'transparent',
            color: tab === 'available' ? 'var(--accent)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: tab === 'available' ? '3px solid var(--accent)' : 'none',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          Available ({hackathons.length})
        </button>
        <button 
          onClick={() => setTab('registered')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: tab === 'registered' ? 700 : 400,
            background: 'transparent',
            color: tab === 'registered' ? 'var(--accent)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: tab === 'registered' ? '3px solid var(--accent)' : 'none',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          My Hackathons ({myHackathons.length})
        </button>
      </div>

      {/* Available Hackathons */}
      {tab === 'available' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {hackathons.length === 0 ? (
            <div className="empty-state">No hackathons available at the moment</div>
          ) : (
            hackathons.map(h => (
              <div key={h.id} style={{
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1.5rem',
                background: 'var(--white)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                      {h.name}
                    </h3>
                    {h.description && (
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {h.description}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(h.status)}
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--off-white)',
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Duration
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {h.duration_minutes} minutes
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Start Time
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {new Date(h.start_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Participants
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {h.participant_count || 0}
                      {h.max_participants ? ` / ${h.max_participants}` : ''}
                    </div>
                  </div>
                </div>

                <button 
                  className="btn-action" 
                  onClick={() => register(h.id)}
                  disabled={h.status === 'completed' || (h.max_participants && h.participant_count >= h.max_participants)}
                >
                  {h.status === 'completed' ? '❌ Ended' : 
                   (h.max_participants && h.participant_count >= h.max_participants) ? '🚫 Full' :
                   '✅ Register Now'}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* My Hackathons */}
      {tab === 'registered' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {myHackathons.length === 0 ? (
            <div className="empty-state">You haven't registered for any hackathons yet</div>
          ) : (
            myHackathons.map(h => (
              <div key={h.id} style={{
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1.5rem',
                background: h.submitted ? 'var(--off-white)' : 'var(--white)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                      {h.name}
                    </h3>
                    {h.description && (
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {h.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {getStatusBadge(h.status)}
                    {h.submitted && (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: '#d4edda',
                        color: '#155724',
                        borderRadius: '4px'
                      }}>
                        ✓ SUBMITTED
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--off-white)',
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Duration
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {h.duration_minutes} minutes
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Start Time
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {new Date(h.start_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                  {h.submitted && h.score !== null && (
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Your Score
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
                        {h.score} / {h.total_marks}
                      </div>
                    </div>
                  )}
                  {h.submitted && h.rank && (
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Your Rank
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                        {h.rank <= 3 ? ['🥇', '🥈', '🥉'][h.rank - 1] : `#${h.rank}`}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {!h.submitted && h.status === 'active' && (
                    <button 
                      className="btn-action" 
                      onClick={() => startHackathon(h.id)}
                      style={{ flex: 1 }}
                    >
                      🚀 Start Hackathon
                    </button>
                  )}
                  {h.submitted && h.submission_id && (
                    <button 
                      className="btn-secondary" 
                      onClick={() => router.push(`/review/${h.submission_id}`)}
                      style={{ flex: 1 }}
                    >
                      📝 Review Answers
                    </button>
                  )}
                  {h.show_leaderboard && (
                    <button 
                      className="btn-secondary" 
                      onClick={() => router.push(`/hackathon/${h.id}/leaderboard`)}
                    >
                      🏆 Leaderboard
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
