"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useCurrency } from "@/context/currency-context";
import { useCustomerAuth } from "@/context/customer-context";
import { ProductImage } from "@/components/product-image";

export default function CheckoutPage() {
  const { items, totalUsd, clear } = useCart();
  const { currency, format } = useCurrency();
  const { customer } = useCustomerAuth();

  const [customerName, setCustomerName] = useState(() => customer?.name ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          currency,
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el pedido.");
        return;
      }
      clear();
      setWhatsappUrl(data.whatsappUrl);
      window.open(data.whatsappUrl, "_blank");
    } catch {
      setError("Ocurrio un error de conexion. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (whatsappUrl) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-20 pt-32 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <MessageCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-brand-blue-dark">Tu pedido fue registrado</h1>
        <p className="mt-2 text-gray-600">
          Se abrio WhatsApp en una nueva pestana con el detalle de tu pedido. Si no se abrio automaticamente,
          usa el boton de abajo.
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-600"
        >
          <MessageCircle className="h-4 w-4" />
          Abrir WhatsApp
        </a>
        <div className="mt-4">
          <Link href="/productos" className="text-sm font-medium text-brand-blue hover:underline">
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-20 pt-32 text-center">
        <h1 className="text-2xl font-bold text-brand-blue-dark">Tu carrito esta vacio</h1>
        <Link href="/productos" className="mt-4 inline-block text-sm font-medium text-brand-blue hover:underline">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-28">
      <h1 className="mb-8 text-3xl font-bold text-brand-blue-dark">Finalizar pedido</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Resumen</h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <ProductImage imageUrl={item.imageUrl} name={item.name} className="h-14 w-14 rounded-lg" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-gray-500">
                    {item.qty} x {format(item.priceUsd)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-brand-orange-dark">
                  {format(item.priceUsd * item.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-lg font-bold text-brand-blue-dark">
            <span>Total</span>
            <span>{format(totalUsd)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Tus datos</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre completo</label>
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-brand-blue focus:outline-none"
              placeholder="Ej: Juan Perez"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Telefono</label>
            <input
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-brand-blue focus:outline-none"
              placeholder="Ej: +58 412 1234567"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand-orange py-3 font-semibold text-white transition-colors hover:bg-brand-orange-dark disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4" />
            {submitting ? "Enviando..." : "Confirmar y enviar por WhatsApp"}
          </button>
        </form>
      </div>
    </div>
  );
}
