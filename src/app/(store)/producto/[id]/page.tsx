import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductImage } from "@/components/product-image";
import { AddToCart } from "@/components/add-to-cart";
import { BackToProducts } from "@/components/back-to-products";

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product || !product.active) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-28">
      <BackToProducts />
      <div className="grid gap-10 md:grid-cols-2">
        <ProductImage imageUrl={product.imageUrl} name={product.name} className="aspect-square w-full rounded-2xl" />

        <div className="flex flex-col gap-4">
          <span className="w-fit rounded-full bg-brand-blue-light px-3 py-1 text-xs font-semibold text-brand-blue-dark">
            {product.category.name}
          </span>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-600">{product.description}</p>

          <AddToCart
            productId={product.id}
            name={product.name}
            priceUsd={product.priceUsd}
            originalPriceUsd={product.onSale ? product.originalPriceUsd : null}
            imageUrl={product.imageUrl}
            stock={product.stock}
          />
        </div>
      </div>
    </div>
  );
}
