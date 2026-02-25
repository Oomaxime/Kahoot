import { motion } from 'motion/react'

interface WaitingLobbyProps {
  players: string[]
}

const chipVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  show:   { opacity: 1, scale: 1 },
}

function WaitingLobby({ players }: WaitingLobbyProps) {
  return (
    <motion.div
      className="phase-container waiting-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        style={{ fontSize: '3rem', marginBottom: '1rem' }}
        animate={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        ⏳
      </motion.div>

      <p className="waiting-message">Waiting for host…</p>
      <p className="player-count">
        {players.length} player{players.length !== 1 ? 's' : ''} connected
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
    </motion.div>
  )
}

export default WaitingLobby
