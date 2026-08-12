import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildInvoiceMessage, buildWhatsappUrl } from "@/lib/whatsapp";
import { sendOrderNotificationEmail } from "@/lib/email";
import { getCustomerSession } from "@/lib/customer-session";
import { isRateLimited, recordAttempt, getClientIp } from "@/lib/rate-limit";
import type { Currency } from "@/lib/types";

// Errores esperados/controlados por la app (stock, producto inactivo, etc.)
// — su mensaje es seguro para mostrarle al cliente. Cualquier otra
// excepcion (ej. un error crudo de Prisma) NO debe llegar al cliente tal
// cual, ver el catch mas abajo.
class OrderValidationError extends Error {}

const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(6).max(30),
  customerDocumentId: z.string().trim().min(5).max(20),
  customerEmail: z.string().trim().email().max(120),
  currency: z.enum(["USD", "VES"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().positive().max(999),
      })
    )
    .min(1),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimitKey = `orders:${ip}`;
  // A diferencia de login/register, aca contamos TODOS los intentos (no
  // solo los fallidos): cada pedido creado, exitoso o no, decrementa stock
  // real, asi que el volumen total de intentos es lo que nos importa
  // limitar, no solo los que fallan.
  const { limited, retryAfterSeconds } = isRateLimited(rateLimitKey, "orders");
  if (limited) {
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return NextResponse.json(
      { error: `Demasiados pedidos desde esta conexion. Intenta de nuevo en ${minutes} minuto${minutes === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }
  recordAttempt(rateLimitKey);

  const body = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de pedido invalidos." }, { status: 400 });
  }
  const { customerName, customerPhone, customerDocumentId, customerEmail, currency, items } = parsed.data;
  const customerSession = await getCustomerSession();

  const settings = await prisma.settings.findFirst();
  const exchangeRate = settings?.exchangeRate ?? 40;
  const whatsappNumber = settings?.whatsappNumber ?? "+573108264892";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: items.map((i) => i.productId) } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let totalUsd = 0;
      const orderItemsData: {
        productId: string;
        productName: string;
        qty: number;
        unitPriceUsd: number;
      }[] = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product || !product.active) {
          throw new OrderValidationError(`Producto no disponible: ${item.productId}`);
        }
        if (product.stock < item.qty) {
          throw new OrderValidationError(`Stock insuficiente para ${product.name}`);
        }
        totalUsd += product.priceUsd * item.qty;
        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          qty: item.qty,
          unitPriceUsd: product.priceUsd,
        });
      }

      const order = await tx.order.create({
        data: {
          customerName,
          customerPhone,
          customerDocumentId,
          customerEmail,
          currency,
          exchangeRateAtOrder: exchangeRate,
          totalUsd,
          status: "pending",
          customerId: customerSession?.customerId,
          items: { create: orderItemsData },
        },
        include: { items: true },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.qty } },
        });
      }

      return order;
    });

    const message = buildInvoiceMessage({
      orderId: result.id,
      customerName,
      customerPhone,
      customerDocumentId,
      customerEmail,
      items: result.items.map((i) => ({ name: i.productName, qty: i.qty, unitPriceUsd: i.unitPriceUsd })),
      totalUsd: result.totalUsd,
      currency: currency as Currency,
      exchangeRate,
      createdAt: result.createdAt,
    });

    // Disparado sin esperar: un problema con Gmail no debe tumbar una venta
    // real ni hacer esperar al cliente. Cualquier error queda solo en el log.
    sendOrderNotificationEmail({
      orderId: result.id,
      customerName,
      customerPhone,
      customerDocumentId,
      customerEmail,
      items: result.items.map((i) => ({ name: i.productName, qty: i.qty, unitPriceUsd: i.unitPriceUsd })),
      totalUsd: result.totalUsd,
      currency: currency as Currency,
      exchangeRate,
      createdAt: result.createdAt,
    }).catch((error) => {
      console.error("[orders] error enviando email de notificacion:", error);
    });

    return NextResponse.json({
      orderId: result.id,
      whatsappUrl: buildWhatsappUrl(whatsappNumber, message),
    });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // Cualquier otra excepcion (error crudo de Prisma, de conexion, etc.) no
    // se le muestra al cliente tal cual — solo un mensaje generico. El
    // detalle real queda en el log del servidor para poder diagnosticarlo.
    console.error("[orders] error inesperado creando pedido:", error);
    return NextResponse.json({ error: "No se pudo crear el pedido. Intenta de nuevo." }, { status: 500 });
  }
}
