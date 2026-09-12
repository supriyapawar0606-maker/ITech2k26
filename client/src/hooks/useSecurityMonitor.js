import { useEffect, useRef } from "react";

/**
 * Monitors the quiz session for security violations and fires a single
 * onViolation(reason) callback the first time any is detected.
 * reasons: TAB_SWITCH | FULLSCREEN_EXIT | WINDOW_BLUR | TIME_EXPIRED
 *
 * `active` should be true only while the quiz is actually in progress,
 * so the monitor doesn't fire on instructions/result pages.
 */
export default function useSecurityMonitor({ active, onViolation }) {
  const violationFiredRef = useRef(false);

  const triggerOnce = (reason) => {
    if (violationFiredRef.current) return;
    violationFiredRef.current = true;
    onViolation(reason);
  };

  useEffect(() => {
    if (!active) return;
    violationFiredRef.current = false;

    const handleVisibilityChange = () => {
      if (document.hidden) triggerOnce("TAB_SWITCH");
    };

    const handleBlur = () => {
      // Some browsers fire blur on fullscreen prompts too, so this is a soft
      // secondary signal — visibilitychange/fullscreenchange are primary.
      triggerOnce("WINDOW_BLUR");
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) triggerOnce("FULLSCREEN_EXIT");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [active, onViolation]);

  const enterFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
    } catch {
      // Fullscreen can be denied by the browser (e.g. not a user gesture) —
      // the quiz still proceeds, other monitors remain active.
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  };

  return { enterFullscreen, exitFullscreen, triggerOnce };
}
