import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const categories = [
  {
    name: "Herramientas",
    slug: "herramientas",
    description: "Manuales y electricas, para el profesional y el aficionado.",
  },
  {
    name: "Pintura",
    slug: "pintura",
    description: "Interiores, exteriores, esmaltes y accesorios.",
  },
  {
    name: "Plomeria",
    slug: "plomeria",
    description: "Tuberias, llaves, conexiones y griferia.",
  },
  {
    name: "Electrico",
    slug: "electrico",
    description: "Cableado, iluminacion e instalaciones residenciales.",
  },
  {
    name: "Materiales de Construccion",
    slug: "materiales-construccion",
    description: "Cemento, bloque, arena y todo lo estructural.",
  },
];

const productsByCategory: Record<
  string,
  { name: string; description: string; priceUsd: number; stock: number }[]
> = {
  herramientas: [
    { name: "Martillo de una libra", description: "Martillo de carpintero con mango de fibra de vidrio.", priceUsd: 8.5, stock: 40 },
    { name: "Juego de destornilladores (6 pzs)", description: "Set de destornilladores planos y de estrella.", priceUsd: 12, stock: 30 },
    { name: "Taladro inalambrico 20V", description: "Taladro/atornillador con bateria de litio y cargador.", priceUsd: 65, stock: 15 },
    { name: "Cinta metrica 5m", description: "Cinta metrica retractil con cuerpo de goma.", priceUsd: 6, stock: 50 },
  ],
  pintura: [
    { name: "Pintura latex blanca 1 galon", description: "Pintura latex interior/exterior, acabado mate.", priceUsd: 22, stock: 25 },
    { name: "Rodillo de pintura 9 pulgadas", description: "Rodillo con mango antideslizante, incluye bandeja.", priceUsd: 5.5, stock: 60 },
    { name: "Brocha 2 pulgadas", description: "Brocha de cerdas sinteticas para acabados.", priceUsd: 3, stock: 80 },
    { name: "Pintura esmalte azul 1/4 galon", description: "Esmalte sintetico brillante para metal y madera.", priceUsd: 9, stock: 20 },
  ],
  plomeria: [
    { name: "Tubo PVC 1/2 pulgada (3m)", description: "Tubo de PVC para instalaciones de agua fria.", priceUsd: 4.5, stock: 100 },
    { name: "Llave de paso 1/2 pulgada", description: "Valvula de bola de bronce para corte de agua.", priceUsd: 7, stock: 45 },
    { name: "Cinta teflon", description: "Cinta selladora de roscas para plomeria.", priceUsd: 1.2, stock: 150 },
    { name: "Set de llaves para tuberia", description: "Juego de llaves stillson de 8 y 10 pulgadas.", priceUsd: 18, stock: 12 },
  ],
  electrico: [
    { name: "Cable electrico #12 (metro)", description: "Cable THHN calibre 12 para instalaciones residenciales.", priceUsd: 0.9, stock: 300 },
    { name: "Bombillo LED 9W", description: "Bombillo LED luz blanca, rosca E27.", priceUsd: 2.5, stock: 120 },
    { name: "Tomacorriente doble", description: "Tomacorriente doble polarizado con placa.", priceUsd: 3.8, stock: 70 },
    { name: "Breaker 20A", description: "Interruptor termomagnetico de un polo.", priceUsd: 6.5, stock: 35 },
  ],
  "materiales-construccion": [
    { name: "Cemento gris (saco 42.5kg)", description: "Cemento Portland tipo I para construccion general.", priceUsd: 9.5, stock: 60 },
    { name: "Bloque de concreto 15cm", description: "Bloque hueco de concreto para muros.", priceUsd: 0.85, stock: 500 },
    { name: "Arena lavada (saco)", description: "Arena lavada de rio para mezcla.", priceUsd: 4, stock: 80 },
    { name: "Varilla de acero 3/8 (6m)", description: "Varilla corrugada para refuerzo estructural.", priceUsd: 7.8, stock: 90 },
  ],
};

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.customer.deleteMany();

  const passwordHash = await bcrypt.hash("Ferre2026", 10);
  await prisma.customer.create({
    data: {
      name: "Administrador",
      email: "admin@ferrenewlink.com",
      passwordHash,
      isAdmin: true,
    },
  });

  await prisma.settings.create({
    data: {
      exchangeRate: 40,
      whatsappNumber: "+573108264892",
    },
  });

  for (const category of categories) {
    const created = await prisma.category.create({ data: category });
    const products = productsByCategory[category.slug] ?? [];
    for (const product of products) {
      await prisma.product.create({
        data: { ...product, categoryId: created.id },
      });
    }
  }

  console.log("Seed completado: admin@ferrenewlink.com/Ferre2026, 5 categorias, productos demo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
