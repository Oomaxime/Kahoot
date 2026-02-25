import { motion } from 'motion/react'

interface LobbyProps {
  quizCode: string
  players: string[]
  onStart: () => void
}

const chipVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  show:   { opacity: 1, scale: 1 },
}

function Lobby({ quizCode, players, onStart }: LobbyProps) {
  return (
    <div className="phase-container">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <p className="quiz-code-label">Room Code</p>
        <motion.div
          className="quiz-code"
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.08 }}
        >
          {quizCode}
        </motion.div>

        <p className="player-count">
          {players.length} player{players.length !== 1 ? 's' : ''} joined
        </p>

        <motion.div
          className="player-list"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.055 } } }}
        >
          {players.map(p => (
            <motion.span
              key={p}
              className="player-chip"
              variants={chipVariants}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            >
              {p}
            </motion.span>
          ))}
        </motion.div>

        <motion.button
          className="btn btn-start"
          onClick={onStart}
          disabled={players.length === 0}
          whileTap={players.length > 0 ? { scale: 0.97, x: 3, y: 3 } : {}}
        >
          Start Quiz →
        </motion.button>
      </motion.div>
    </div>
  )
}

export default Lobby
