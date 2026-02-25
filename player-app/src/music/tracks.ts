/**
 * Player app background music map.
 * Values are filenames (without extension) from player-app/public/music/
 */
export const PLAYER_TRACKS: Record<string, string | null> = {
  join:        'lobby',   // lobby.mp3 — starts on first user gesture (Howler auto-unlock)
  lobby:       'lobby',   // lobby.mp3 — waiting for host to start
  question:    'game',    // game.mp3  — answering
  feedback:    'game',    // game.mp3  — keep it going through feedback
  results:     'game',    // game.mp3  — (sync phase)
  leaderboard: 'game',    // game.mp3  — mid-game leaderboard
  ended:       null,      // silence at the end
}

export const MUSIC_VOLUME = 0.4
