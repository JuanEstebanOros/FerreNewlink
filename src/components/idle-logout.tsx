"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const RESET_THROTTLE_MS = 1000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;

export function IdleLogout({ redirectTo = "/ingresar" }: { redirectTo?: string }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let lastReset = 0;

    async function logoutNow() {
      await fetch("/api/customer/logout", { method: "POST" });
      router.push(redirectTo);
      router.refresh();
    }

    function resetTimer() {
      const now = Date.now();
      if (now - lastReset < RESET_THROTTLE_MS) return;
      lastReset = now;
      clearTimeout(timer);
      timer = setTimeout(logoutNow, IDLE_TIMEOUT_MS);
    }

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [router, redirectTo]);

  return null;
}
