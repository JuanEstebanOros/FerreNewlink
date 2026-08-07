"use client";

import Image from "next/image";
import Link from "next/link";
import { useReveal, revealStyle } from "@/hooks/useReveal";

export type CategoryCardData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
};

export function CategoriesSection({ categories }: { categories: CategoryCardData[] }) {
  const { ref, revealed } = useReveal<HTMLElement>();

  return (
    <section id="categorias" ref={ref} className="relative overflow-hidden px-4 py-24 sm:px-8">
      <Image src="/categorias-bg.jpg" alt="" fill aria-hidden className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-brand-blue-dark/45" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 max-w-xl">
          <div className="mb-2.5 text-[13px] font-bold tracking-wide text-brand-orange drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
            CATEGORÍAS
          </div>
          <h2 className="mb-2.5 font-heading text-[clamp(28px,3.2vw,40px)] font-bold tracking-[-0.02em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
            Encuentra lo que buscas
          </h2>
          <p className="text-base text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]">
            Nuestras líneas de producto, siempre en stock.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/productos?categoria=${cat.slug}`}
              style={revealStyle(revealed, i * 0.08, 20)}
              className="rounded-2xl border border-brand-line bg-white p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_32px_rgba(34,26,10,0.08)]"
            >
              <div
                className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl font-heading text-xl font-bold text-white ${
                  i % 2 === 0 ? "bg-brand-blue" : "bg-brand-orange"
                }`}
              >
                {cat.name.charAt(0).toUpperCase()}
              </div>
              <div className="mb-2 font-heading text-lg font-semibold text-brand-ink">{cat.name}</div>
              <p className="mb-4 text-sm leading-relaxed text-brand-ink-soft">{cat.description}</p>
              <div className="text-xs font-bold tracking-wide text-brand-blue">
                {cat.productCount} {cat.productCount === 1 ? "producto" : "productos"}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
