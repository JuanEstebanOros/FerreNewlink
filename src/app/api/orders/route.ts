import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildInvoiceMessage, buildWhatsappUrl } from "@/lib/whatsapp";
import { getCustomerSession } from "@/lib/customer-session";
import type { Currency } from "@/lib/types";

const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(6).max(30),
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
  const body = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de pedido invalidos." }, { status: 400 });
  }
  const { customerName, customerPhone, currency, items } = parsed.data;
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
          throw new Error(`Producto no disponible: ${item.productId}`);
        }
        if (product.stock < item.qty) {
          throw new Error(`Stock insuficiente para ${product.name}`);
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
      items: result.items.map((i) => ({ name: i.productName, qty: i.qty, unitPriceUsd: i.unitPriceUsd })),
      totalUsd: result.totalUsd,
      currency: currency as Currency,
      exchangeRate,
      createdAt: result.createdAt,
    });

    return NextResponse.json({
      orderId: result.id,
      whatsappUrl: buildWhatsappUrl(whatsappNumber, message),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el pedido.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
