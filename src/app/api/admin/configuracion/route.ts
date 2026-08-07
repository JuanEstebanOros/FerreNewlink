import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.settings.findFirst();
  return NextResponse.json(settings);
}

const optionalUrl = z
  .union([z.literal(""), z.string().trim().url()])
  .optional()
  .transform((v) => (v ? v : null));

const optionalEmail = z
  .union([z.literal(""), z.string().trim().email()])
  .optional()
  .transform((v) => (v ? v : null));

const updateSchema = z.object({
  exchangeRate: z.number().positive(),
  whatsappNumber: z.string().trim().min(6).max(30),
  storeAddress: z.string().trim().min(1).max(200),
  storePhone: z.string().trim().min(1).max(30),
  instagramUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  mercadolibreUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  facebookUrl: optionalUrl,
  contactEmail: optionalEmail,
});

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de configuracion invalidos." }, { status: 400 });
  }

  const existing = await prisma.settings.findFirst();
  const settings = existing
    ? await prisma.settings.update({ where: { id: existing.id }, data: parsed.data })
    : await prisma.settings.create({ data: parsed.data });

  return NextResponse.json(settings);
}
