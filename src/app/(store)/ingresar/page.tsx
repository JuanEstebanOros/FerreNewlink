"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useCustomerAuth } from "@/context/customer-context";

export default function IngresarPage() {
  const router = useRouter();
  const { setCustomer } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesion.");
        return;
      }
      setCustomer({ name: data.name, email: data.email, isAdmin: data.isAdmin });
      router.push(data.isAdmin ? "/admin" : "/mis-pedidos");
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
          <LogIn className="h-6 w-6" />
        </span>
        <h1 className="font-heading text-xl font-bold text-brand-ink">Ingresa a tu cuenta</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-brand-line bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-ink-soft">Correo electronico</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-brand-line px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-ink-soft">Contrasena</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-brand-line px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-brand-orange py-3 text-sm font-bold text-white transition-colors hover:bg-brand-orange-dark disabled:opacity-60"
        >
          {submitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-brand-ink-soft">
        ¿Aun no tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-brand-blue hover:underline">
          Registrate aqui
        </Link>
      </p>
    </div>
  );
}
