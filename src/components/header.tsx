"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, LogOut, Menu, Package, ShoppingCart, User, X } from "lucide-react";
import { CurrencyToggle } from "@/components/currency-toggle";
import { useCart } from "@/context/cart-context";
import { useCustomerAuth } from "@/context/customer-context";

const NAV_LINKS = [
  { href: "/#categorias", label: "Categorías" },
  { href: "/productos", label: "Productos" },
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#ubicacion", label: "Ubicación" },
  { href: "/#contacto", label: "Contacto" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalCount, open } = useCart();
  const { customer, logout } = useCustomerAuth();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-2 px-4 py-4 transition-all duration-300 sm:gap-4 sm:px-8 ${
        scrolled ? "bg-brand-bg/90 shadow-[0_1px_0_rgba(0,0,0,0.08)] backdrop-blur-md py-3" : "bg-transparent"
      }`}
    >
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-brand-ink transition-colors hover:bg-black/5 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="flex items-center">
          <Image src="/ferre-logo.png" alt="Ferre NewLink" width={465} height={168} className="h-12 w-auto sm:h-14" priority />
        </Link>
      </div>

      <div className="flex flex-nowrap items-center gap-2 sm:gap-3 lg:gap-6">
        <nav className="hidden shrink-0 items-center gap-4 md:flex lg:gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative shrink-0 whitespace-nowrap pb-1 text-sm font-semibold text-brand-ink-soft transition-colors hover:text-brand-ink"
            >
              {link.label}
              <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-brand-orange transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="shrink-0">
          <CurrencyToggle />
        </div>

        {customer ? (
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            {customer.isAdmin ? (
              <Link
                href="/admin"
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-brand-ink-soft transition-colors hover:text-brand-ink"
              >
                <LayoutDashboard className="h-4 w-4" />
                Panel admin
              </Link>
            ) : (
              <Link
                href="/mis-pedidos"
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-brand-ink-soft transition-colors hover:text-brand-ink"
              >
                <Package className="h-4 w-4" />
                Mis pedidos
              </Link>
            )}
            <button
              onClick={logout}
              aria-label="Cerrar sesion"
              className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-ink-soft transition-colors hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/ingresar"
            className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border-[1.5px] border-brand-blue px-4 py-2 text-sm font-bold text-brand-blue transition-colors hover:bg-brand-blue hover:text-white sm:flex"
          >
            <User className="h-4 w-4" />
            Ingresar
          </Link>
        )}

        <button
          onClick={open}
          aria-label={`Carrito${totalCount > 0 ? `, ${totalCount} productos` : ""}`}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-orange text-white transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] hover:-translate-y-0.5 hover:bg-brand-orange-dark sm:hidden"
        >
          <ShoppingCart className="h-4 w-4" />
          {totalCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-blue-dark px-1 text-[10px] font-bold text-white">
              {totalCount}
            </span>
          )}
        </button>
        <button
          onClick={open}
          className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-brand-orange px-4 py-2.5 text-sm font-bold text-white transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] hover:-translate-y-0.5 hover:bg-brand-orange-dark sm:flex"
        >
          <ShoppingCart className="h-4 w-4" />
          Carrito{totalCount > 0 ? ` (${totalCount})` : ""}
        </button>
      </div>
    </header>

    {/* Rendered as a sibling of <header>, not a child: <header> gets
        backdrop-blur-md when scrolled, which creates a CSS containing block
        for position:fixed descendants and would confine this panel to the
        header's own box instead of the full viewport (see CLAUDE.md §5.8). */}
    {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative flex h-full w-full max-w-xs flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <Image src="/ferre-logo.png" alt="Ferre NewLink" width={465} height={168} className="h-9 w-auto" />
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar"
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 px-3 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-semibold text-brand-ink transition-colors hover:bg-brand-blue-light"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-gray-100 px-3 py-4">
              {customer ? (
                <div className="flex flex-col gap-1">
                  {customer.isAdmin ? (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-semibold text-brand-ink transition-colors hover:bg-brand-blue-light"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Panel admin
                    </Link>
                  ) : (
                    <Link
                      href="/mis-pedidos"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-semibold text-brand-ink transition-colors hover:bg-brand-blue-light"
                    >
                      <Package className="h-4 w-4" />
                      Mis pedidos
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-base font-semibold text-brand-ink-soft transition-colors hover:bg-gray-50 hover:text-red-500"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <Link
                  href="/ingresar"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-brand-blue px-4 py-3 text-base font-bold text-brand-blue transition-colors hover:bg-brand-blue hover:text-white"
                >
                  <User className="h-4 w-4" />
                  Ingresar
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
