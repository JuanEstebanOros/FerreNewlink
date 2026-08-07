import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { ProductFilters } from "@/components/product-filters";
import { Pagination } from "@/components/pagination";

const PAGE_SIZE = 24;

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string; pagina?: string }>;
}) {
  const { categoria, q, pagina } = await searchParams;
  const page = Math.max(1, Number(pagina) || 1);

  const where = {
    active: true,
    ...(categoria ? { category: { slug: categoria } } : {}),
    ...(q ? { name: { contains: q } } : {}),
  };

  const [categories, products, total] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (categoria) params.set("categoria", categoria);
    if (q) params.set("q", q);
    if (targetPage > 1) params.set("pagina", String(targetPage));
    const qs = params.toString();
    return `/productos${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-28">
      <h1 className="mb-6 text-3xl font-bold text-brand-blue-dark">Productos</h1>
      <ProductFilters categories={categories} />

      <div className="mt-8">
        {products.length === 0 ? (
          <p className="py-16 text-center text-gray-500">No encontramos productos con esos filtros.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">{total} productos</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
          </>
        )}
      </div>
    </div>
  );
}
