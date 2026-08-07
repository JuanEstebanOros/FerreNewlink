import type { Currency } from "@/lib/types";

export function formatPrice(amountUsd: number, currency: Currency, exchangeRate: number): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amountUsd);
  }

  const amountVes = amountUsd * exchangeRate;
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
    maximumFractionDigits: 2,
  }).format(amountVes);
}

export function convert(amountUsd: number, currency: Currency, exchangeRate: number): number {
  return currency === "USD" ? amountUsd : amountUsd * exchangeRate;
}
