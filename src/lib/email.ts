import { Resend } from "resend";
import { formatPrice } from "@/lib/currency";
import type { Currency } from "@/lib/types";
import type { InvoiceItem } from "@/lib/whatsapp";

const ORDER_NOTIFICATION_EMAIL = "imporferrenewlink@gmail.com";
// Dominio de pruebas de Resend, no requiere verificar un dominio propio.
// Cambiar a un correo de ferrenewlink.com una vez se verifique el dominio.
const FROM_EMAIL = "onboarding@resend.dev";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendOrderNotificationEmail(params: {
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
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY no configurada, se omite el correo de notificacion.");
    return;
  }

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

  const itemLines = items
    .map(
      (item) =>
        `- ${item.qty} x ${item.name} (${formatPrice(item.unitPriceUsd, "USD", exchangeRate)}) = ${formatPrice(
          item.unitPriceUsd * item.qty,
          "USD",
          exchangeRate
        )}`
    )
    .join("\n");

  const text = [
    `Pedido: #${orderId.slice(-8).toUpperCase()}`,
    `Fecha: ${createdAt.toLocaleString("es-VE")}`,
    `Cliente: ${customerName}`,
    `Cedula/Documento: ${customerDocumentId}`,
    `Telefono: ${customerPhone}`,
    `Email: ${customerEmail}`,
    "",
    "Productos:",
    itemLines,
    "",
    `Total: ${formatPrice(totalUsd, "USD", exchangeRate)} (${formatPrice(totalUsd, "VES", exchangeRate)})`,
    `Moneda seleccionada por el cliente: ${currency}`,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: ORDER_NOTIFICATION_EMAIL,
    subject: `Nuevo pedido #${orderId.slice(-8).toUpperCase()} - Ferre NewLink`,
    text,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
