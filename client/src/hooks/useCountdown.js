import { useEffect, useState } from "react";

export default function useCountdown({ startedAt, durationMinutes, onExpire }) {
  const [endTime, setEndTime] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);

  // Recompute the end time whenever the real attempt data (startedAt/durationMinutes)
  // actually arrives or changes — this used to be a useRef initialized only on the
  // very first render, which locked in whatever fallback values were passed before
  // the attempt had loaded (e.g. a hardcoded 30 minutes), and never updated again.
  useEffect(() => {
    if (!startedAt || !durationMinutes) return;
    const end = new Date(startedAt).getTime() + durationMinutes * 60 * 1000;
    setEndTime(end);
    setSecondsLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
  }, [startedAt, durationMinutes]);

  useEffect(() => {
    if (!endTime) return;
    let expired = false;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0 && !expired) {
        expired = true;
        clearInterval(interval);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  const safeSeconds = secondsLeft ?? 0;
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const seconds = String(safeSeconds % 60).padStart(2, "0");

  return {
    secondsLeft: safeSeconds,
    display: secondsLeft === null ? "--:--" : `${minutes}:${seconds}`,
  };
}
