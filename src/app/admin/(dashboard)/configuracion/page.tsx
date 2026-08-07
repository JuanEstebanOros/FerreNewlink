"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

type FormState = {
  exchangeRate: string;
  whatsappNumber: string;
  storeAddress: string;
  storePhone: string;
  instagramUrl: string;
  linkedinUrl: string;
  mercadolibreUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
  contactEmail: string;
};

const EMPTY_FORM: FormState = {
  exchangeRate: "",
  whatsappNumber: "",
  storeAddress: "",
  storePhone: "",
  instagramUrl: "",
  linkedinUrl: "",
  mercadolibreUrl: "",
  tiktokUrl: "",
  facebookUrl: "",
  contactEmail: "",
};

export default function AdminConfiguracionPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/configuracion")
      .then((res) => res.json())
      .then((data) => {
        setForm({
          exchangeRate: String(data.exchangeRate),
          whatsappNumber: data.whatsappNumber ?? "",
          storeAddress: data.storeAddress ?? "",
          storePhone: data.storePhone ?? "",
          instagramUrl: data.instagramUrl ?? "",
          linkedinUrl: data.linkedinUrl ?? "",
          mercadolibreUrl: data.mercadolibreUrl ?? "",
          tiktokUrl: data.tiktokUrl ?? "",
          facebookUrl: data.facebookUrl ?? "",
          contactEmail: data.contactEmail ?? "",
        });
        setLoading(false);
      });
  }, []);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    const res = await fetch("/api/admin/configuracion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        exchangeRate: Number(form.exchangeRate),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setMessage("Configuracion guardada.");
  }

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-brand-blue-dark">Configuracion</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tasa de cambio (Bs. por 1 USD)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={form.exchangeRate}
            onChange={(e) => update("exchangeRate", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">Se usa para mostrar los precios en Bolivares en toda la tienda.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Numero de WhatsApp</label>
          <input
            required
            value={form.whatsappNumber}
            onChange={(e) => update("whatsappNumber", e.target.value)}
            placeholder="+58 412 1234567"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">A este numero llegaran los pedidos y cotizaciones.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Direccion de la tienda</label>
          <input
            required
            value={form.storeAddress}
            onChange={(e) => update("storeAddress", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Telefono de la tienda</label>
          <input
            required
            value={form.storePhone}
            onChange={(e) => update("storePhone", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Correo de contacto (opcional)</label>
          <input
            type="email"
            value={form.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            placeholder="ventasonline@ferrenewlink.com"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
          />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Redes sociales (opcional)
          </p>
          <div className="flex flex-col gap-3">
            <input
              value={form.instagramUrl}
              onChange={(e) => update("instagramUrl", e.target.value)}
              placeholder="https://www.instagram.com/tu-tienda"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
            />
            <input
              value={form.facebookUrl}
              onChange={(e) => update("facebookUrl", e.target.value)}
              placeholder="https://www.facebook.com/tu-tienda"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
            />
            <input
              value={form.tiktokUrl}
              onChange={(e) => update("tiktokUrl", e.target.value)}
              placeholder="https://www.tiktok.com/@tu-tienda"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
            />
            <input
              value={form.linkedinUrl}
              onChange={(e) => update("linkedinUrl", e.target.value)}
              placeholder="https://www.linkedin.com/company/tu-tienda"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
            />
            <input
              value={form.mercadolibreUrl}
              onChange={(e) => update("mercadolibreUrl", e.target.value)}
              placeholder="https://listado.mercadolibre.com.co/tu-tienda"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">Solo se muestran los iconos de las redes que completes.</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 flex w-fit items-center gap-2 rounded-full bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-orange-dark disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}
