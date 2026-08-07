import { DollarSign, ClipboardList, AlertTriangle, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";

const LOW_STOCK_THRESHOLD = 5;

export default async function AdminDashboardPage() {
  const [totalSalesAgg, pendingOrders, lowStockProducts, totalProducts] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalUsd: true }, where: { status: { not: "cancelled" } } }),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.product.count({ where: { stock: { lt: LOW_STOCK_THRESHOLD }, active: true } }),
    prisma.product.count({ where: { active: true } }),
  ]);

  const cards = [
    {
      label: "Ventas totales",
      value: `$${(totalSalesAgg._sum.totalUsd ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: "bg-brand-orange",
    },
    {
      label: "Pedidos pendientes",
      value: pendingOrders,
      icon: ClipboardList,
      color: "bg-brand-blue",
    },
    {
      label: "Productos con bajo stock",
      value: lowStockProducts,
      icon: AlertTriangle,
      color: "bg-red-500",
    },
    {
      label: "Productos activos",
      value: totalProducts,
      icon: Package,
      color: "bg-emerald-500",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-blue-dark">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-gray-500">{card.label}</p>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
