import { prisma } from "@/lib/prisma";
import { SalesByDayChart, TopProductsChart, StatusPieChart } from "@/components/admin-reports-charts";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  completed: "Completado",
  cancelled: "Cancelado",
};

export default async function AdminReportesPage() {
  const since = new Date();
  since.setDate(since.getDate() - 13);

  const [recentOrders, orderItems, statusGroups] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { not: "cancelled" } },
      select: { createdAt: true, totalUsd: true },
    }),
    prisma.orderItem.findMany({
      select: { productName: true, qty: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const salesByDayMap = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    salesByDayMap.set(d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" }), 0);
  }
  for (const order of recentOrders) {
    const key = order.createdAt.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" });
    salesByDayMap.set(key, (salesByDayMap.get(key) ?? 0) + order.totalUsd);
  }
  const salesByDay = Array.from(salesByDayMap.entries()).map(([day, totalUsd]) => ({ day, totalUsd }));

  const topProductsMap = new Map<string, number>();
  for (const item of orderItems) {
    topProductsMap.set(item.productName, (topProductsMap.get(item.productName) ?? 0) + item.qty);
  }
  const topProducts = Array.from(topProductsMap.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const statusData = statusGroups.map((g) => ({
    status: statusLabels[g.status] ?? g.status,
    count: g._count._all,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-blue-dark">Reportes</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Ventas ultimos 14 dias (USD)</h2>
          {salesByDay.some((d) => d.totalUsd > 0) ? (
            <SalesByDayChart data={salesByDay} />
          ) : (
            <p className="py-16 text-center text-sm text-gray-400">Aun no hay ventas en este periodo.</p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Productos mas vendidos</h2>
          {topProducts.length > 0 ? (
            <TopProductsChart data={topProducts} />
          ) : (
            <p className="py-16 text-center text-sm text-gray-400">Aun no hay ventas registradas.</p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Pedidos por estado</h2>
          {statusData.length > 0 ? (
            <StatusPieChart data={statusData} />
          ) : (
            <p className="py-16 text-center text-sm text-gray-400">Aun no hay pedidos.</p>
          )}
        </div>
      </div>
    </div>
  );
}
