"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Animate a position along a path for demo/showcase purposes.
 * Simulates a "blue dot" moving along indoor waypoints.
 */
export function useSimulatedPosition(
  pathCoords: [number, number][], // [lng, lat] pairs
  speedMs: number = 2000,
  active: boolean = false
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [position, setPosition] = useState<[number, number]>(pathCoords[0] ?? [0, 0]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active || pathCoords.length === 0) return;

    setCurrentIndex(0);
    setPosition(pathCoords[0]);

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = Math.min(prev + 1, pathCoords.length - 1);
        setPosition(pathCoords[next]);
        if (next >= pathCoords.length - 1 && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return next;
      });
    }, speedMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, pathCoords, speedMs]);

  return {
    position,
    progress: pathCoords.length > 0 ? currentIndex / (pathCoords.length - 1) : 0,
    arrived: currentIndex >= pathCoords.length - 1,
  };
}
