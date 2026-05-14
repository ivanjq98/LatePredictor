const countdown = () => {
    return (
// ── Format seconds into mm:ss countdown string ────────────────────────────────
function formatCountdown(totalSeconds: number): string {
    if (totalSeconds <= 0) return "00:00";
    const h   = Math.floor(totalSeconds / 3600);
    const m   = Math.floor((totalSeconds % 3600) / 60);
    const s   = totalSeconds % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
    )
}

export default countdown