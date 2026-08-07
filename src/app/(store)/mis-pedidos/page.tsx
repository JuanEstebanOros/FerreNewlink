import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-session";
import { prisma } from "@/lib/prisma";
import { PackageSearch } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  completed: "Completado",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  completed: "bg-emerald-50 text-emerald-600",
  cancelled: "bg-red-50 text-red-500",
};

export default async function MisPedidosPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/ingresar");

  const orders = await prisma.order.findMany({
    where: { customerId: session.customerId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-28">
      <h1 className="mb-1 font-heading text-2xl font-bold text-brand-ink">Mis pedidos</h1>
      <p className="mb-8 text-sm text-brand-ink-soft">Hola, {session.name}. Aqui esta el historial de tus compras.</p>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-line bg-white py-16 text-center">
          <PackageSearch className="h-10 w-10 text-brand-ink-soft/50" />
          <p className="text-brand-ink-soft">Aun no tienes pedidos.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <details key={order.id} className="rounded-2xl border border-brand-line bg-white p-5">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-heading font-semibold text-brand-ink">
                    Pedido #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-brand-ink-soft">
                    {new Date(order.createdAt).toLocaleString("es-CO")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                  <span className="font-bold text-brand-ink">${order.totalUsd.toFixed(2)}</span>
                </div>
              </summary>
              <ul className="mt-4 space-y-1.5 border-t border-brand-line pt-4 text-sm text-brand-ink-soft">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.qty} x {item.productName} — ${item.unitPriceUsd.toFixed(2)} c/u
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
