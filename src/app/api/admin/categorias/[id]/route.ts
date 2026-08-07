import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nombre invalido." }, { status: 400 });
  }

  const slug = slugify(parsed.data.name);
  const conflict = await prisma.category.findFirst({ where: { slug, NOT: { id } } });
  if (conflict) {
    return NextResponse.json({ error: "Ya existe una categoria con ese nombre." }, { status: 409 });
  }

  const category = await prisma.category.update({
    where: { id },
    data: { name: parsed.data.name, slug, description: parsed.data.description ?? "" },
  });
  return NextResponse.json(category);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: hay ${productCount} producto(s) en esta categoria.` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
