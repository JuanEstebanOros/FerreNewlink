"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { formatPrice, convert } from "@/lib/currency";
import type { Currency } from "@/lib/types";

const STORAGE_KEY = "ferre_currency";

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number;
  format: (amountUsd: number) => string;
  convert: (amountUsd: number) => number;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  children,
  initialExchangeRate,
}: {
  children: ReactNode;
  initialExchangeRate: number;
}) {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [exchangeRate] = useState(initialExchangeRate);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "USD" || stored === "VES") {
      // Deliberately deferred to an effect: reading localStorage during render
      // would mismatch the server-rendered "USD" default and break hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrencyState(stored);
    }
  }, []);

  function setCurrency(next: Currency) {
    setCurrencyState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        exchangeRate,
        format: (amountUsd: number) => formatPrice(amountUsd, currency, exchangeRate),
        convert: (amountUsd: number) => convert(amountUsd, currency, exchangeRate),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
