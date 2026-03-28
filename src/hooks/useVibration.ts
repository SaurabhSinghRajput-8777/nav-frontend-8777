"use client";

import { useCallback } from "react";
import { VibrationPattern, VIBRATION_PATTERNS } from "@/lib/types";

export function useVibration() {
  const vibrate = useCallback((pattern: VibrationPattern) => {
    if (!("vibrate" in navigator)) return;
    navigator.vibrate(VIBRATION_PATTERNS[pattern]);
  }, []);

  const stop = useCallback(() => {
    if (!("vibrate" in navigator)) return;
    navigator.vibrate(0);
  }, []);

  return { vibrate, stop };
}
