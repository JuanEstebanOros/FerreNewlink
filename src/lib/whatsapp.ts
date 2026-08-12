import { formatPrice } from "@/lib/currency";
import type { Currency } from "@/lib/types";

export type InvoiceItem = {
  name: string;
  qty: number;
  unitPriceUsd: number;
};

export function buildInvoiceMessage(params: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerDocumentId: string;
  customerEmail: string;
  items: InvoiceItem[];
  totalUsd: number;
  currency: Currency;
  exchangeRate: number;
  createdAt: Date;
}): string {
  const {
    orderId,
    customerName,
    customerPhone,
    customerDocumentId,
    customerEmail,
    items,
    totalUsd,
    currency,
    exchangeRate,
    createdAt,
  } = params;

  const lines = [
    "*Nuevo pedido - Ferre NewLink*",
    `Pedido: #${orderId.slice(-8).toUpperCase()}`,
    `Fecha: ${createdAt.toLocaleString("es-VE")}`,
    `Cliente: ${customerName}`,
    `Cedula/Documento: ${customerDocumentId}`,
    `Telefono: ${customerPhone}`,
    `Email: ${customerEmail}`,
    "",
    "*Productos:*",
    ...items.map(
      (item) =>
        `- ${item.qty} x ${item.name} (${formatPrice(item.unitPriceUsd, "USD", exchangeRate)}) = ${formatPrice(
          item.unitPriceUsd * item.qty,
          "USD",
          exchangeRate
        )}`
    ),
    "",
    `*Total: ${formatPrice(totalUsd, "USD", exchangeRate)} (${formatPrice(totalUsd, "VES", exchangeRate)})*`,
    `Moneda seleccionada por el cliente: ${currency}`,
    "",
    "Por favor confirmar disponibilidad y forma de entrega.",
  ];

  return lines.join("\n");
}

export const DEFAULT_WHATSAPP_MESSAGE =
  "¡Hola! 👋 Vengo desde la página web de Ferre NewLink y quisiera hacer una consulta sobre sus productos.";

export function buildWhatsappUrl(phoneNumber: string, message: string): string {
  const digitsOnly = phoneNumber.replace(/[^\d]/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
