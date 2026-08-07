import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 24;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const q = searchParams.get("q") ?? "";
  const categoria = searchParams.get("categoria") ?? "";

  const where = {
    ...(categoria ? { category: { slug: categoria } } : {}),
    ...(q ? { name: { contains: q } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().min(1).max(2000),
  priceUsd: z.number().positive(),
  originalPriceUsd: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0),
  categoryId: z.string().min(1),
  imageUrl: z.string().nullable().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  onSale: z.boolean().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de producto invalidos." }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) {
    return NextResponse.json({ error: "Categoria no encontrada." }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      active: parsed.data.active ?? true,
    },
    include: { category: true },
  });
  return NextResponse.json(product, { status: 201 });
}
