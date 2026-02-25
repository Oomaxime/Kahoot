import { motion } from 'motion/react'
import { playClick } from '@shared-hooks/clickSound'

interface LeaderboardProps {
  rankings: { name: string; score: number }[]
  onEnd?: () => void
}

const MEDALS = ['🥇', '🥈', '🥉']

function Leaderboard({ rankings, onEnd }: LeaderboardProps) {
  return (
    <div className="phase-container">
      <motion.p
        className="leaderboard-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      >
        🏆 Leaderboard
      </motion.p>

      <div className="leaderboard">
        {rankings.map((r, i) => (
          <motion.div
            key={r.name}
            className="leaderboard-item"
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <span className="leaderboard-rank">{MEDALS[i] ?? `#${i + 1}`}</span>
            <span className="leaderboard-name">{r.name}</span>
            <span className="leaderboard-score">{r.score.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>

      {onEnd && (
        <motion.button
          className="btn btn-secondary"
          onClick={() => { playClick(); onEnd() }}
          style={{ marginTop: '2rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: Math.min(rankings.length * 0.07 + 0.2, 1.2) }}
          whileTap={{ scale: 0.97, x: 2, y: 2 }}
        >
          End Session
        </motion.button>
      )}
    </div>
  )
}

export default Leaderboard
