"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useCurrency } from "@/context/currency-context";
import { ProductImage } from "@/components/product-image";

export function CartDrawer() {
  const { items, isOpen, close, removeItem, updateQty, totalUsd } = useCart();
  const { format } = useCurrency();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Cerrar carrito"
        onClick={close}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-brand-blue-dark">Tu carrito</h2>
          <button onClick={close} aria-label="Cerrar" className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="mt-8 text-center text-sm text-gray-500">Tu carrito esta vacio.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <ProductImage imageUrl={item.imageUrl} name={item.name} className="h-16 w-16 shrink-0 rounded-lg" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-brand-orange-dark font-semibold">{format(item.priceUsd)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.productId, item.qty - 1)}
                        className="rounded-full border border-gray-200 p-1 hover:bg-gray-50"
                        aria-label="Reducir cantidad"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.qty + 1)}
                        className="rounded-full border border-gray-200 p-1 hover:bg-gray-50"
                        aria-label="Aumentar cantidad"
                        disabled={item.qty >= item.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="ml-auto text-xs text-gray-400 hover:text-red-500"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-base font-bold text-brand-blue-dark">
              <span>Total</span>
              <span>{format(totalUsd)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={close}
              className="block w-full rounded-full bg-brand-orange py-3 text-center font-semibold text-white transition-colors hover:bg-brand-orange-dark"
            >
              Finalizar pedido
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
