"use client";

import Image from "next/image";
import Link from "next/link";
import { useSiteSettings } from "@/context/site-settings-context";

export function Footer({ categories }: { categories: { name: string; slug: string }[] }) {
  const { storePhone, storeAddress, contactEmail } = useSiteSettings();

  return (
    <footer className="bg-brand-ink px-4 py-14 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-8 border-b border-white/15 pb-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image
              src="/ferre-logo.png"
              alt="Ferre NewLink"
              width={465}
              height={168}
              className="mb-3 h-10 w-auto brightness-0 invert"
            />
            <p className="max-w-56 text-sm leading-relaxed text-white/60">
              Ferretería de confianza y trayectoria comprobada.
            </p>
          </div>

          <div>
            <div className="mb-3.5 text-[13px] font-bold text-white">CATEGORÍAS</div>
            <div className="flex flex-col gap-2.5">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/productos?categoria=${cat.slug}`}
                  className="text-sm text-white/60 transition-colors hover:text-brand-orange"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3.5 text-[13px] font-bold text-white">EMPRESA</div>
            <div className="flex flex-col gap-2.5">
              <Link href="/#nosotros" className="text-sm text-white/60 transition-colors hover:text-brand-orange">
                Nosotros
              </Link>
              <Link href="/#ubicacion" className="text-sm text-white/60 transition-colors hover:text-brand-orange">
                Ubicación
              </Link>
              <Link href="/#contacto" className="text-sm text-white/60 transition-colors hover:text-brand-orange">
                Contacto
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-3.5 text-[13px] font-bold text-white">CONTACTO</div>
            <div className="flex flex-col gap-2.5 text-sm text-white/60">
              <div>{storePhone}</div>
              {contactEmail && <div>{contactEmail}</div>}
              <div>{storeAddress}</div>
            </div>
          </div>
        </div>
        <div className="pt-6 text-[13px] text-white/45">
          © {new Date().getFullYear()} Ferre NewLink. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
