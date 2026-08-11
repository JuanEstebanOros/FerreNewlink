"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useReveal, revealStyle } from "@/hooks/useReveal";
import { useCart } from "@/context/cart-context";
import { useCurrency } from "@/context/currency-context";
import { ProductImage } from "@/components/product-image";

export type CuratedProduct = {
  id: string;
  name: string;
  priceUsd: number;
  originalPriceUsd: number | null;
  onSale: boolean;
  imageUrl: string | null;
  stock: number;
  category: { name: string; slug: string };
};

export function ProductsSection({
  id,
  eyebrow,
  title,
  products,
}: {
  id: string;
  eyebrow: string;
  title: string;
  products: CuratedProduct[];
}) {
  const { ref, revealed } = useReveal<HTMLElement>();
  const { addItem } = useCart();
  const { format } = useCurrency();
  const [addedId, setAddedId] = useState<string | null>(null);

  if (products.length === 0) return null;

  function handleAdd(product: CuratedProduct) {
    addItem({
      productId: product.id,
      name: product.name,
      priceUsd: product.priceUsd,
      qty: 1,
      imageUrl: product.imageUrl,
      stock: product.stock,
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 450);
  }

  return (
    <section id={id} ref={ref} className="mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-8">
      <div className="mb-8">
        <div className="mb-2.5 text-[13px] font-bold tracking-wide text-brand-orange drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
          {eyebrow}
        </div>
        <h2 className="font-heading text-[clamp(28px,3.2vw,40px)] font-bold tracking-[-0.02em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {products.map((product, i) => (
          <div
            key={product.id}
            style={revealStyle(revealed, (i % 4) * 0.07, 24)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-brand-line bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_32px_rgba(34,26,10,0.08)]"
          >
            <Link href={`/producto/${product.id}`} className="relative">
              {product.onSale && product.originalPriceUsd && (
                <span className="absolute left-2 top-2 z-10 rounded-full bg-brand-orange px-2 py-0.5 text-[10px] font-bold text-white sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
                  OFERTA
                </span>
              )}
              <ProductImage
                imageUrl={product.imageUrl}
                name={product.name}
                className="aspect-square w-full border-b border-brand-line transition-transform duration-500 group-hover:scale-[1.06]"
              />
            </Link>
            <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-5">
              <span className="text-[10px] font-bold tracking-wide text-brand-blue sm:text-[11px]">
                {product.category.name}
              </span>
              <Link
                href={`/producto/${product.id}`}
                className="font-heading text-[13px] font-semibold leading-snug text-brand-ink sm:text-base"
              >
                {product.name}
              </Link>
              <div className="mt-0.5 flex items-baseline gap-1.5 sm:mt-1 sm:gap-2">
                {product.onSale && product.originalPriceUsd && (
                  <span className="text-xs font-medium text-brand-ink-soft/60 line-through sm:text-sm">
                    {format(product.originalPriceUsd)}
                  </span>
                )}
                <span className="text-base font-bold text-brand-ink sm:text-xl">{format(product.priceUsd)}</span>
              </div>
              <button
                onClick={() => handleAdd(product)}
                disabled={product.stock === 0}
                style={{ transform: addedId === product.id ? "scale(1.05)" : "scale(1)" }}
                className="mt-1.5 flex items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-brand-orange px-2 py-2 text-[11px] font-bold text-brand-orange transition-all duration-200 hover:bg-brand-orange hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:mt-2.5 sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-[13px]"
              >
                <ShoppingCart className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                <span className="truncate">{product.stock === 0 ? "Agotado" : "Agregar al carrito"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
