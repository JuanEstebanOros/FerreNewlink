"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type OrderItem = {
  id: string;
  productName: string;
  qty: number;
  unitPriceUsd: number;
};

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  currency: string;
  exchangeRateAtOrder: number;
  totalUsd: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  items: OrderItem[];
};

const statusLabels: Record<Order["status"], string> = {
  pending: "Pendiente",
  completed: "Completado",
  cancelled: "Cancelado",
};

const statusColors: Record<Order["status"], string> = {
  pending: "bg-amber-50 text-amber-600",
  completed: "bg-emerald-50 text-emerald-600",
  cancelled: "bg-red-50 text-red-500",
};

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/pedidos");
    setOrders(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    // Initial data fetch on mount; load() manages its own loading/error state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function updateStatus(id: string, status: Order["status"]) {
    const res = await fetch(`/api/admin/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-blue-dark">Pedidos</h1>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Cambiar estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Cargando...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Aun no hay pedidos.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <Fragment key={order.id}>
                  <tr>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                        className="text-gray-400 hover:text-brand-blue"
                      >
                        {expandedId === order.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleString("es-VE")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-orange-dark">
                      ${order.totalUsd.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value as Order["status"])}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-brand-blue focus:outline-none"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="completed">Completado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr>
                      <td colSpan={6} className="bg-gray-50 px-4 py-3">
                        <ul className="space-y-1 text-sm text-gray-600">
                          {order.items.map((item) => (
                            <li key={item.id}>
                              {item.qty} x {item.productName} — ${item.unitPriceUsd.toFixed(2)} c/u = $
                              {(item.qty * item.unitPriceUsd).toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
