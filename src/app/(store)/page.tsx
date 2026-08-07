import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Hero } from "@/components/hero";
import { CategoriesSection } from "@/components/categories-section";
import { ProductsSection } from "@/components/products-section";
import { AboutSection } from "@/components/about-section";
import { LocationSection } from "@/components/location-section";
import { ContactSection } from "@/components/contact-section";

export default async function HomePage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });

  const categoryCards = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    productCount: c._count.products,
  }));

  const [featuredProducts, onSaleProducts] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, featured: true },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { active: true, onSale: true },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div>
      <Hero />
      <CategoriesSection categories={categoryCards} />
      {(featuredProducts.length > 0 || onSaleProducts.length > 0) && (
        <div className="relative overflow-hidden">
          <Image src="/productos-bg.jpg" alt="" fill aria-hidden className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-brand-blue-dark/45" />
          <div className="relative">
            <ProductsSection
              id="destacados"
              eyebrow="DESTACADOS"
              title="Productos destacados"
              products={featuredProducts}
            />
            <ProductsSection id="ofertas" eyebrow="OFERTAS" title="En oferta" products={onSaleProducts} />
          </div>
        </div>
      )}
      <AboutSection />
      <LocationSection />
      <ContactSection />
    </div>
  );
}
