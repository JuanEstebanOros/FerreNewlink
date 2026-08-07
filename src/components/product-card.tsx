"use client";

import Link from "next/link";
import { useCurrency } from "@/context/currency-context";
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
  const showDiscount = product.onSale && product.originalPriceUsd;

  return (
    <Link
      href={`/producto/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow hover:shadow-lg"
    >
      {showDiscount && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-brand-orange px-2.5 py-1 text-[11px] font-bold text-white">
          OFERTA
        </span>
      )}
      <ProductImage imageUrl={product.imageUrl} name={product.name} className="aspect-square w-full" />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-blue/70">
          {product.category.name}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-blue-dark">{product.name}</h3>
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
      </div>
    </Link>
  );
}
