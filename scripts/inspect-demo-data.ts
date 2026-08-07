import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const products = await prisma.product.findMany({ include: { category: true } });
  const categories = await prisma.category.findMany();
  const orders = await prisma.order.findMany({ include: { items: true } });

  console.log("=== PRODUCTS ===");
  console.log("Total products:", products.length);
  console.log(
    "Featured:",
    products.filter((p) => p.featured).map((p) => p.name)
  );
  console.log(
    "OnSale:",
    products.filter((p) => p.onSale).map((p) => p.name)
  );

  console.log("\n=== CATEGORIES ===");
  console.log("Total categories:", categories.length);
  categories.forEach((c) => console.log(`- ${c.name} (${c.slug})`));

  console.log("\n=== ORDERS ===");
  console.log("Total orders:", orders.length);
  for (const o of orders) {
    console.log(`Order ${o.id.slice(-8)} | status=${o.status} | customer=${o.customerName} | items=${o.items.length}`);
    for (const item of o.items) {
      console.log(`   - productId=${item.productId ?? "(null, already orphaned)"} productName="${item.productName}" qty=${item.qty}`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
