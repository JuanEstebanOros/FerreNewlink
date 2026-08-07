"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useCurrency } from "@/context/currency-context";

export function AddToCart({
  productId,
  name,
  priceUsd,
  originalPriceUsd,
  imageUrl,
  stock,
}: {
  productId: string;
  name: string;
  priceUsd: number;
  originalPriceUsd?: number | null;
  imageUrl: string | null;
  stock: number;
}) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const { format } = useCurrency();

  const outOfStock = stock === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        {originalPriceUsd && (
          <span className="text-xl font-medium text-gray-400 line-through">{format(originalPriceUsd)}</span>
        )}
        <span className="text-3xl font-extrabold text-brand-orange-dark">{format(priceUsd)}</span>
      </div>

      {outOfStock ? (
        <span className="w-fit rounded-full bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-500">
          Agotado
        </span>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-gray-200">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center hover:bg-gray-50"
                aria-label="Reducir cantidad"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(stock, q + 1))}
                className="flex h-10 w-10 items-center justify-center hover:bg-gray-50"
                aria-label="Aumentar cantidad"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-gray-500">{stock} disponibles</span>
          </div>

          <button
            onClick={() => addItem({ productId, name, priceUsd, qty, imageUrl, stock })}
            className="flex items-center justify-center gap-2 rounded-full bg-brand-orange py-3 font-semibold text-white transition-colors hover:bg-brand-orange-dark"
          >
            <ShoppingCart className="h-4 w-4" />
            Agregar al carrito
          </button>
        </>
      )}
    </div>
  );
}
