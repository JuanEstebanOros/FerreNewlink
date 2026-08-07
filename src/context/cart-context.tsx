"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "ferre_cart";
const TOAST_DURATION_MS = 2500;

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clear: () => void;
  totalUsd: number;
  totalCount: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toastMessage: string | null;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        // Deliberately deferred to an effect: localStorage isn't available
        // during SSR, so reading it during render would break hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(stored));
      } catch {
        // ignore malformed cart data
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  function addItem(newItem: CartItem) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === newItem.productId);
      if (existing) {
        const nextQty = Math.min(existing.qty + newItem.qty, existing.stock);
        return prev.map((i) => (i.productId === newItem.productId ? { ...i, qty: nextQty } : i));
      }
      return [...prev, newItem];
    });
    // "Agregar al carrito" nunca navega ni abre el drawer a pantalla completa:
    // el usuario se queda donde estaba viendo productos, solo se confirma con
    // un toast y el contador del header. El carrito se abre solo cuando el
    // usuario toca el botón "Carrito" explícitamente (ver open()).
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(`${newItem.name} agregado al carrito`);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function updateQty(productId: string, qty: number) {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i))
    );
  }

  function clear() {
    setItems([]);
  }

  const totalUsd = items.reduce((sum, i) => sum + i.priceUsd * i.qty, 0);
  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clear,
        totalUsd,
        totalCount,
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toastMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
