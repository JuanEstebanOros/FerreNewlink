import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const result = await prisma.product.deleteMany({});
  console.log(`Productos demo eliminados: ${result.count}`);

  const remaining = await prisma.product.count();
  console.log(`Productos restantes en la tabla: ${remaining}`);

  const orders = await prisma.order.count();
  const orphanedItems = await prisma.orderItem.count({ where: { productId: null } });
  console.log(`Orders intactas: ${orders}`);
  console.log(`OrderItems con productId ahora en null: ${orphanedItems}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
