"use client";

import { useCurrency } from "@/context/currency-context";

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center rounded-full border border-brand-blue/20 bg-white p-0.5 text-sm font-medium">
      <button
        onClick={() => setCurrency("USD")}
        className={`rounded-full px-3 py-1 transition-colors ${
          currency === "USD" ? "bg-brand-blue text-white" : "text-brand-blue-dark hover:bg-brand-blue-light"
        }`}
      >
        USD
      </button>
      <button
        onClick={() => setCurrency("VES")}
        className={`rounded-full px-3 py-1 transition-colors ${
          currency === "VES" ? "bg-brand-blue text-white" : "text-brand-blue-dark hover:bg-brand-blue-light"
        }`}
      >
        Bs.
      </button>
    </div>
  );
}
