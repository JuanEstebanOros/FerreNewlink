import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    description: z.string().trim().min(1).max(2000),
    priceUsd: z.number().positive(),
    originalPriceUsd: z.number().positive().nullable(),
    stock: z.number().int().min(0),
    categoryId: z.string().min(1),
    imageUrl: z.string().nullable(),
    active: z.boolean(),
    featured: z.boolean(),
    onSale: z.boolean(),
  })
  .partial();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de producto invalidos." }, { status: 400 });
  }

  if (parsed.data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Categoria no encontrada." }, { status: 400 });
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: parsed.data,
    include: { category: true },
  });
  return NextResponse.json(product);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
  if (orderItemCount > 0) {
    await prisma.product.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
