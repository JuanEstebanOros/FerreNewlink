"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export type CategoryOption = { slug: string; name: string };

export function ProductFilters({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("categoria") ?? "";
  const activeQuery = searchParams.get("q") ?? "";

  function updateParams(next: { categoria?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("pagina");
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/productos?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          defaultValue={activeQuery}
          placeholder="Buscar productos..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParams({ q: (e.target as HTMLInputElement).value });
            }
          }}
          className="w-full rounded-full border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-brand-blue focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateParams({ categoria: "" })}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeCategory === "" ? "bg-brand-blue text-white" : "bg-brand-blue-light text-brand-blue-dark"
          }`}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category.slug}
            onClick={() => updateParams({ categoria: category.slug })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === category.slug
                ? "bg-brand-blue text-white"
                : "bg-brand-blue-light text-brand-blue-dark"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
