import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signCustomerSession, CUSTOMER_SESSION_COOKIE } from "@/lib/auth";
import { isRateLimited, recordFailedAttempt, getClientIp } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(6).max(100),
});

export async function POST(request: Request) {
  const rateLimitKey = `register:${getClientIp(request)}`;
  const { limited, retryAfterSeconds } = isRateLimited(rateLimitKey, "register");
  if (limited) {
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return NextResponse.json(
      { error: `Demasiados intentos. Intenta de nuevo en ${minutes} minuto${minutes === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    recordFailedAttempt(rateLimitKey);
    return NextResponse.json({ error: "Datos invalidos. La contrasena debe tener al menos 6 caracteres." }, { status: 400 });
  }

  const existing = await prisma.customer.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    recordFailedAttempt(rateLimitKey);
    return NextResponse.json({ error: "Ya existe una cuenta con ese correo." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const customer = await prisma.customer.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash,
    },
  });

  const token = await signCustomerSession({
    customerId: customer.id,
    name: customer.name,
    email: customer.email,
    isAdmin: false,
  });

  const response = NextResponse.json({ ok: true, name: customer.name, email: customer.email, isAdmin: false });
  response.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
