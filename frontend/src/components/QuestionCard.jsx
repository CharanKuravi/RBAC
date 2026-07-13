export default function QuestionCard({ question, index, selected, onSelect }) {
  const options = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
  ]

  return (
    <div className="question-card">
      <div className="q-header">
        <span className="q-number">Question {index + 1}</span>
        <span className="q-marks">{question.marks} Mark{question.marks > 1 ? 's' : ''}</span>
      </div>
      <p className="q-text">{question.question_text}</p>
      <ul className="options-list">
        {options.map((opt) => (
          <li
            key={opt.key}
            className={`option-item${selected === opt.key ? ' selected' : ''}`}
            onClick={() => onSelect(question.id, opt.key)}
          >
            <input
              type="radio"
              name={`q_${question.id}`}
              value={opt.key}
              checked={selected === opt.key}
              onChange={() => onSelect(question.id, opt.key)}
            />
            <span className="option-label">{opt.key}</span>
            <span className="option-text">{opt.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
