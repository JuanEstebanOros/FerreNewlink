"use client";

import { useEffect, useRef, useState } from "react";

export const REVEAL_EASE = "cubic-bezier(.22,.61,.36,1)";

export function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, revealed };
}

export function revealStyle(revealed: boolean, delay = 0, distance = 22) {
  return {
    opacity: revealed ? 1 : 0,
    transform: revealed ? "translateY(0)" : `translateY(${distance}px)`,
    transition: `opacity .7s ${REVEAL_EASE} ${delay}s, transform .7s ${REVEAL_EASE} ${delay}s`,
  } as const;
}
