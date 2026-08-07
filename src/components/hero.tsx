"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { revealStyle } from "@/hooks/useReveal";

export function Hero() {
  const [heroIn, setHeroIn] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setHeroIn(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-orange-light via-brand-bg to-brand-blue-light">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-orange/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-blue/20 blur-3xl"
      />

      <div className="relative flex min-h-[92vh] items-center px-4 pb-16 pt-[calc(90px+4vh)] sm:px-8">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <div
              style={revealStyle(heroIn, 0)}
              className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-white/70 px-2.5 py-1.5 text-[10px] font-semibold tracking-normal text-brand-ink-soft backdrop-blur-sm sm:gap-2 sm:px-3.5 sm:py-2 sm:text-xs sm:tracking-wide"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange" />
              FERRETERÍA DE CONFIANZA · CALIDAD GARANTIZADA
            </div>

            <h1
              style={revealStyle(heroIn, 0.1)}
              className="mb-5 font-heading text-[clamp(38px,5.2vw,64px)] font-bold leading-[1.02] tracking-[-0.02em] text-brand-ink text-balance"
            >
              Tu construcción, <span className="text-brand-blue">en nuestras manos.</span>
            </h1>

            <div style={revealStyle(heroIn, 0.2)} className="mb-8 max-w-xl">
              <div className="mb-2 text-[13px] font-bold tracking-wide text-brand-orange">VISIÓN</div>
              <p className="text-[clamp(16px,1.6vw,19px)] leading-[1.55] text-brand-ink-soft text-pretty">
                Consolidarnos como la empresa líder en el mundo ferretero a nivel nacional, siendo reconocidos
                por nuestra innovación constante, la excelencia en el servicio al cliente y nuestra capacidad
                de adaptación a las nuevas tecnologías del sector. Aspiramos a construir relaciones de
                confianza duraderas con nuestros aliados comerciales y ser el motor que impulse el crecimiento
                en la región.
              </p>
            </div>

            <div style={revealStyle(heroIn, 0.3)} className="mb-10 flex flex-wrap gap-4">
              <Link
                href="/productos"
                className="rounded-lg bg-brand-orange px-7 py-4 text-sm font-bold text-white transition-colors hover:bg-brand-orange-dark"
              >
                Ver catálogo
              </Link>
              <Link
                href="/#ubicacion"
                className="rounded-lg border-[1.5px] border-brand-blue px-7 py-4 text-sm font-bold text-brand-blue transition-colors hover:bg-brand-blue hover:text-white"
              >
                Cómo llegar
              </Link>
            </div>

            <div style={revealStyle(heroIn, 0.4)} className="flex flex-wrap gap-8 sm:gap-10">
              <div>
                <div className="font-heading text-xl font-bold text-brand-ink">Trayectoria</div>
                <div className="text-xs font-semibold text-brand-ink-soft">sólida en la región</div>
              </div>
              <div>
                <div className="font-heading text-xl font-bold text-brand-ink">1500+</div>
                <div className="text-xs font-semibold text-brand-ink-soft">productos</div>
              </div>
              <div>
                <div className="font-heading text-xl font-bold text-brand-ink">Mismo día</div>
                <div className="text-xs font-semibold text-brand-ink-soft">entrega en la ciudad</div>
              </div>
            </div>
          </div>

          <div
            style={{
              opacity: heroIn ? 1 : 0,
              transform: heroIn ? "scale(1)" : "scale(0.96)",
              transition: "opacity .8s ease .15s, transform .8s cubic-bezier(.22,.61,.36,1) .15s",
            }}
            className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_30px_60px_rgba(30,58,138,0.2)]"
          >
            <Image
              src="/hero-storefront.jpg"
              alt="Fachada de Ferre NewLink"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
