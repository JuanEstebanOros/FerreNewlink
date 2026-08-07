"use client";

import { Check } from "lucide-react";
import { useCart } from "@/context/cart-context";

export function CartToast() {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4">
      <div
        key={toastMessage}
        className="flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full bg-brand-blue-dark px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
        style={{ animation: "toast-in 0.25s cubic-bezier(.34,1.56,.64,1)" }}
      >
        <Check className="h-4 w-4 shrink-0 text-brand-orange" />
        <span className="truncate">{toastMessage}</span>
      </div>
    </div>
  );
}
