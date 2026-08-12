import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-session";
import { AdminSidebar } from "@/components/admin-sidebar";
import { IdleLogout } from "@/components/idle-logout";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCustomerSession();
  if (!session || !session.isAdmin) redirect("/ingresar");

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <IdleLogout />
      <AdminSidebar name={session.name} email={session.email} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
  );
}
