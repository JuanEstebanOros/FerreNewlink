"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useCustomerAuth } from "@/context/customer-context";

export default function RegistroPage() {
  const router = useRouter();
  const { setCustomer } = useCustomerAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear la cuenta.");
        return;
      }
      setCustomer({ name: data.name, email: data.email, isAdmin: false });
      router.push("/mis-pedidos");
      router.refresh();
    } catch {
      setError("Ocurrio un error de conexion.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 pb-16 pt-28">
      <div className="mb-6 flex flex-col items-center gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue text-white">
          <UserPlus className="h-6 w-6" />
        </span>
        <h1 className="font-heading text-xl font-bold text-brand-ink">Crea tu cuenta</h1>
        <p className="text-center text-sm text-brand-ink-soft">
          Guarda tus datos y consulta el historial de tus compras.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-brand-line bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-ink-soft">Nombre completo</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-brand-line px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-ink-soft">Correo electronico</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-brand-line px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-ink-soft">Telefono (opcional)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-brand-line px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-ink-soft">Contrasena</label>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-brand-line px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
          />
          <p className="mt-1 text-xs text-brand-ink-soft">Minimo 6 caracteres.</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-brand-orange py-3 text-sm font-bold text-white transition-colors hover:bg-brand-orange-dark disabled:opacity-60"
        >
          {submitting ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-brand-ink-soft">
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" className="font-semibold text-brand-blue hover:underline">
          Ingresa aqui
        </Link>
      </p>
    </div>
  );
}
