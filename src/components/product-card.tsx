"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCurrency } from "@/context/currency-context";
import { useCart } from "@/context/cart-context";
import { ProductImage } from "@/components/product-image";

export type ProductCardData = {
  id: string;
  name: string;
  priceUsd: number;
  originalPriceUsd: number | null;
  onSale: boolean;
  imageUrl: string | null;
  stock: number;
  category: { name: string; slug: string };
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { format } = useCurrency();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const showDiscount = product.onSale && product.originalPriceUsd;

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      priceUsd: product.priceUsd,
      qty: 1,
      imageUrl: product.imageUrl,
      stock: product.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 450);
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow hover:shadow-lg">
      <Link href={`/producto/${product.id}`} className="relative">
        {showDiscount && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-brand-orange px-2.5 py-1 text-[11px] font-bold text-white">
            OFERTA
          </span>
        )}
        <ProductImage
          imageUrl={product.imageUrl}
          name={product.name}
          className="aspect-square w-full border-b border-gray-100"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-blue/70">
          {product.category.name}
        </span>
        <Link href={`/producto/${product.id}`}>
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-blue-dark">{product.name}</h3>
        </Link>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-1.5">
            {showDiscount && (
              <span className="text-xs font-medium text-gray-400 line-through">
                {format(product.originalPriceUsd!)}
              </span>
            )}
            <span className="text-lg font-bold text-brand-orange-dark">{format(product.priceUsd)}</span>
          </div>
          {product.stock === 0 && <span className="text-xs font-medium text-red-500">Agotado</span>}
        </div>
        <button
          onClick={handleAdd}
          disabled={product.stock === 0}
          style={{ transform: added ? "scale(1.05)" : "scale(1)" }}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-brand-orange px-3 py-2 text-[11px] font-bold text-brand-orange transition-all duration-200 hover:bg-brand-orange hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-[13px]"
        >
          <ShoppingCart className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">{product.stock === 0 ? "Agotado" : "Agregar al carrito"}</span>
        </button>
      </div>
    </div>
  );
}
