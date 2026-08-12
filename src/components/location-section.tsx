"use client";

import { useReveal, revealStyle } from "@/hooks/useReveal";
import { useSiteSettings } from "@/context/site-settings-context";

const HOURS = [
  { day: "Lunes a viernes", time: "8:00am – 12:00pm y 1:00pm – 5:00pm" },
  { day: "Sábado", time: "8:00am – 2:00pm" },
  { day: "Domingo", time: "Cerrado" },
];

export function LocationSection() {
  const { ref, revealed } = useReveal<HTMLElement>();
  const { storeAddress, storePhone } = useSiteSettings();
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(storeAddress)}&output=embed`;
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeAddress)}`;

  return (
    <section id="ubicacion" ref={ref} className="bg-brand-bg2 px-4 py-24 sm:px-8">
      <div className="mx-auto max-w-6xl">
      <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <div
          style={revealStyle(revealed, 0, 24)}
          className="aspect-[5/4] overflow-hidden rounded-2xl border border-brand-line"
        >
          <iframe
            src={mapSrc}
            title="Ubicación de Ferre NewLink"
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div style={revealStyle(revealed, 0.12, 24)}>
          <div className="mb-2.5 text-[13px] font-bold tracking-wide text-brand-orange">VISÍTANOS</div>
          <h2 className="mb-5 font-heading text-[clamp(26px,3vw,34px)] font-bold tracking-[-0.02em] text-brand-ink">
            Una sola sucursal, siempre lista
          </h2>
          <div className="mb-1 text-base font-semibold text-brand-ink">{storeAddress}</div>

          <div className="mb-6 mt-4 flex flex-col gap-1.5 border-t border-brand-line pt-4">
            {HOURS.map((h) => (
              <div key={h.day} className="flex justify-between text-sm">
                <span className="text-brand-ink-soft">{h.day}</span>
                <span className={`font-semibold ${h.day === "Domingo" ? "text-red-600" : "text-brand-ink"}`}>
                  {h.time}
                </span>
              </div>
            ))}
          </div>

          <div className="mb-5 text-[15px] font-semibold text-brand-ink">{storePhone}</div>

          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-brand-blue px-6.5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-blue-dark"
          >
            Cómo llegar
          </a>
        </div>
      </div>
      </div>
    </section>
  );
}
