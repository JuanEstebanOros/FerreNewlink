"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Tags,
  Package,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Wrench,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/admin/configuracion", label: "Configuracion", icon: Settings },
];

export function AdminSidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/customer/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue text-white">
          <Wrench className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-brand-blue-dark">Ferre NewLink</p>
          <p className="text-xs text-gray-400">Panel admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-brand-blue text-white" : "text-gray-600 hover:bg-brand-blue-light"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 px-5 py-4">
        <p className="mb-0.5 truncate text-xs font-medium text-gray-500">{name}</p>
        <p className="mb-2 truncate text-xs text-gray-400">{email}</p>
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-blue"
        >
          <ExternalLink className="h-4 w-4" />
          Ver sitio
        </Link>
        <button
          onClick={() => {
            setOpen(false);
            handleLogout();
          }}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-500"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-bold text-brand-blue-dark">Panel admin</span>
        <span className="w-9" />
      </div>

      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-gray-100 bg-white md:flex">
        {sidebarContent}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="relative flex h-full w-64 max-w-[80vw] flex-col bg-white shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="absolute right-3 top-3 rounded-full p-1 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
