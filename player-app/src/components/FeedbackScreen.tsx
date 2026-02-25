import { motion } from 'motion/react'

interface FeedbackScreenProps {
  feedbackType: 'correct' | 'partial' | 'wrong'
  scoreGained: number
  totalScore: number
}

const CONFIG = {
  correct:  { emoji: '✓', text: 'Correct!',  bg: 'var(--c-green)' },
  partial:  { emoji: '~', text: 'Partial!',  bg: 'var(--c-amber)' },
  wrong:    { emoji: '✗', text: 'Wrong!',    bg: 'var(--c-red)'   },
}

function FeedbackScreen({ feedbackType, scoreGained, totalScore }: FeedbackScreenProps) {
  const { emoji, text, bg } = CONFIG[feedbackType]

  return (
    <motion.div
      className="phase-container"
      style={{ maxWidth: 420 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
    >
      <motion.div
        style={{
          background: bg,
          border: '2.5px solid #111',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '6px 6px 0 #111',
          padding: '2.5rem 2rem',
          textAlign: 'center',
        }}
        initial={{ rotate: -3 }}
        animate={{ rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.05 }}
      >
        <motion.span
          style={{ fontSize: '5rem', display: 'block', lineHeight: 1, marginBottom: '0.75rem' }}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 16, delay: 0.1 }}
        >
          {emoji}
        </motion.span>

        <motion.p
          style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#fff',
            marginBottom: '0.5rem',
          }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>

        {scoreGained > 0 && (
          <motion.p
            style={{
              fontSize: '3rem',
              fontWeight: 900,
              color: '#fff',
              textShadow: '2px 2px 0 rgba(0,0,0,0.18)',
              margin: '0.25rem 0',
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.3 }}
          >
            +{scoreGained.toLocaleString()}
          </motion.p>
        )}

        <motion.p
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.8)',
            marginTop: '0.25rem',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Total: {totalScore.toLocaleString()} pts
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

export default FeedbackScreen
