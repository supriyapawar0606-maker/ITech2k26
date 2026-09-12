// Shared formatter so "time taken" reads the same way everywhere it's shown
// (Quiz Result, My Results, Leaderboard, Admin Leaderboard, Admin Results).
export function formatTimeTaken(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined) return "-";
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s} sec`;
  if (s === 0) return `${m} min`;
  return `${m} min ${s} sec`;
}
