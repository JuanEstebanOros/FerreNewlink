"use client";

import { useEffect } from "react";

export const NAV_HISTORY_BASELINE_KEY = "ferre_history_baseline";

export function NavHistoryBaseline() {
  useEffect(() => {
    if (!sessionStorage.getItem(NAV_HISTORY_BASELINE_KEY)) {
      sessionStorage.setItem(NAV_HISTORY_BASELINE_KEY, String(window.history.length));
    }
  }, []);

  return null;
}
