"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(targets: Record<string, number>, active: boolean, durationMs = 1400) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(Object.keys(targets).map((key) => [key, 0]))
  );
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    let rafId: number;

    function step(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = ease(progress);
      setValues(
        Object.fromEntries(Object.entries(targets).map(([key, target]) => [key, Math.round(target * eased)]))
      );
      if (progress < 1) rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return values;
}
