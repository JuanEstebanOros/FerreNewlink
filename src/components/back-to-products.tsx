"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NAV_HISTORY_BASELINE_KEY } from "@/components/nav-history-baseline";

export function BackToProducts() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Si hubo al menos una navegación dentro de la app desde que se abrió
    // esta pestaña (history.length creció respecto a la línea base), hay una
    // página propia a la que volver -con su filtro/categoría/página intactos-
    // via router.back(). Si el usuario entró directo a esta URL (link
    // compartido, refresh), no hay a dónde volver y usamos /productos.
    const baseline = Number(sessionStorage.getItem(NAV_HISTORY_BASELINE_KEY) ?? window.history.length);
    setCanGoBack(window.history.length > baseline);
  }, []);

  return (
    <button
      onClick={() => (canGoBack ? router.back() : router.push("/productos"))}
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink-soft transition-colors hover:text-brand-blue-dark"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver a productos
    </button>
  );
}
