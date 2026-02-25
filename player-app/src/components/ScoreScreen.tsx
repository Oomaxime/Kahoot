import { motion } from 'motion/react'
import clsx from 'clsx'

interface ScoreScreenProps {
  rankings: { name: string; score: number }[]
  playerName: string
}

const MEDALS = ['🥇', '🥈', '🥉']

function ScoreScreen({ rankings, playerName }: ScoreScreenProps) {
  return (
    <div className="phase-container score-screen">
      <motion.p
        className="leaderboard-title"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      >
        🏆 Leaderboard
      </motion.p>

      <div className="leaderboard">
        {rankings.map((r, i) => (
          <motion.div
            key={r.name}
            className={clsx('leaderboard-item', r.name === playerName && 'is-me')}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <span className="leaderboard-rank">{MEDALS[i] ?? `#${i + 1}`}</span>
            <span className="leaderboard-name">{r.name}</span>
            <span className="leaderboard-score">{r.score.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ScoreScreen
