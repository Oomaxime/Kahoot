/**
 * Host app background music map.
 * Values are filenames (without extension) from host-app/public/music/
 */
export const HOST_TRACKS: Record<string, string | null> = {
  create: "lobby", // lobby.mp3 — login page + create quiz (starts on first user gesture)
  lobby: "lobby", // lobby.mp3 — waiting for players
  question: "game", // game.mp3  — question in progress
  results: "game", // game.mp3  — keep tension between questions
  leaderboard: "game", // game.mp3  — mid-game leaderboard
  ended: null, // silence at the end
};

export const MUSIC_VOLUME = 0.4;
