import { useEffect, useState } from 'react'
import '../styles/timer.css'

export default function Timer({ durationMinutes, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60)

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp()
      return
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [timeLeft, onTimeUp])

  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const s = (timeLeft % 60).toString().padStart(2, '0')

  const cls = timeLeft <= 300 ? 'critical' : timeLeft <= 600 ? 'warning' : ''

  return (
    <div className={`timer-box ${cls}`}>
      <div className="timer-label">Time Left</div>
      <div className="timer-value">{m}:{s}</div>
    </div>
  )
}
