import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signCustomerSession, CUSTOMER_SESSION_COOKIE } from "@/lib/auth";
import { isRateLimited, recordFailedAttempt, clearAttempts, getClientIp } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimitKey = `login:${ip}`;
  const { limited, retryAfterSeconds } = isRateLimited(rateLimitKey, "login");
  if (limited) {
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return NextResponse.json(
      { error: `Demasiados intentos fallidos. Intenta de nuevo en ${minutes} minuto${minutes === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Correo y contrasena requeridos." }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { email: parsed.data.email } });
  if (!customer) {
    recordFailedAttempt(rateLimitKey);
    console.warn(`[auth] login fallido (cuenta inexistente) email=${parsed.data.email} ip=${ip}`);
    return NextResponse.json({ error: "Credenciales invalidas." }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.password, customer.passwordHash);
  if (!valid) {
    recordFailedAttempt(rateLimitKey);
    console.warn(`[auth] login fallido (contrasena incorrecta) email=${parsed.data.email} ip=${ip}`);
    return NextResponse.json({ error: "Credenciales invalidas." }, { status: 401 });
  }

  clearAttempts(rateLimitKey);

  const token = await signCustomerSession({
    customerId: customer.id,
    name: customer.name,
    email: customer.email,
    isAdmin: customer.isAdmin,
  });

  const response = NextResponse.json({
    ok: true,
    name: customer.name,
    email: customer.email,
    isAdmin: customer.isAdmin,
  });
  response.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
