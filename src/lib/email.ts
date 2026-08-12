import nodemailer from "nodemailer";
import { formatPrice } from "@/lib/currency";
import type { Currency } from "@/lib/types";
import type { InvoiceItem } from "@/lib/whatsapp";

const ORDER_NOTIFICATION_EMAIL = "importferrenewlink@gmail.com";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
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
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[email] GMAIL_USER/GMAIL_APP_PASSWORD no configurados, se omite el correo de notificacion.");
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

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: ORDER_NOTIFICATION_EMAIL,
    subject: `Nuevo pedido #${orderId.slice(-8).toUpperCase()} - Ferre NewLink`,
    text,
  });
}
