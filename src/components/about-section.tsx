"use client";

import Image from "next/image";
import { useReveal, revealStyle } from "@/hooks/useReveal";
import { useCountUp } from "@/hooks/useCountUp";

const CHECK_ITEMS = [
  "Asesoría técnica en cada compra",
  "Entrega el mismo día en la ciudad",
  "Precios mayoristas para profesionales",
];

export function AboutSection() {
  const { ref, revealed } = useReveal<HTMLElement>();
  const counters = useCountUp(
    { productos: 1500, ventasMeli: 1000, seguidoresIg: 6000, marcas: 45 },
    revealed
  );

  const stats = [
    { label: "Productos", value: counters.productos, suffix: "+" },
    { label: "Ventas en Mercado Libre", value: counters.ventasMeli, suffix: "+" },
    { label: "Seguidores en Instagram", value: counters.seguidoresIg, suffix: "+" },
    { label: "Marcas aliadas", value: counters.marcas },
  ];

  return (
    <section id="nosotros" ref={ref} className="relative overflow-hidden px-4 py-24 sm:px-8">
      <Image
        src="/about-storefront.jpg"
        alt=""
        fill
        aria-hidden
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-dark via-brand-blue-dark/95 to-brand-blue-dark/80" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div style={revealStyle(revealed, 0, 24)}>
          <div className="mb-2.5 text-[13px] font-bold tracking-wide text-brand-orange">NOSOTROS</div>
          <h2 className="mb-4.5 font-heading text-[clamp(28px,3.2vw,38px)] font-bold tracking-[-0.02em] text-white">
            Sobre Ferre NewLink
          </h2>
          <div className="mb-6 max-w-md">
            <div className="mb-2 text-[13px] font-bold tracking-wide text-brand-orange">MISIÓN</div>
            <p className="text-sm leading-relaxed text-white/85 text-pretty">
              Brindar soluciones integrales y satisfacer las necesidades de nuestros clientes en el área de
              ferretería, herramientas y decoración, impulsados por el compromiso de nuestro equipo altamente
              capacitado, que transforma cada requerimiento en una experiencia de servicio excepcional y de
              confianza técnica.
            </p>
          </div>

          <div className="flex flex-col gap-3.5">
            {CHECK_ITEMS.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="h-5 w-5 shrink-0 rounded-full bg-brand-orange" />
                <span className="text-[15px] font-medium text-white">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={revealStyle(revealed, 0.15, 24)} className="grid grid-cols-2 gap-4.5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm"
            >
              <div className="font-heading text-4xl font-bold text-brand-orange">
                {stat.value.toLocaleString("es-CO")}
                {stat.suffix ?? ""}
              </div>
              <div className="mt-1.5 text-[13px] text-white/85">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
