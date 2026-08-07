"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useReveal, revealStyle } from "@/hooks/useReveal";
import { useSiteSettings } from "@/context/site-settings-context";
import { buildWhatsappUrl, DEFAULT_WHATSAPP_MESSAGE } from "@/lib/whatsapp";
import { SocialIcon, type SocialPlatform } from "@/components/social-icons";

const CATEGORY_OPTIONS = ["Herramientas", "Construcción", "Pintura", "Plomería", "Otro"];

export function ContactSection() {
  const { ref, revealed } = useReveal<HTMLElement>();
  const settings = useSiteSettings();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [categoria, setCategoria] = useState(CATEGORY_OPTIONS[0]);
  const [mensaje, setMensaje] = useState("");
  const [sent, setSent] = useState(false);

  const socials = [
    {
      label: "WhatsApp",
      platform: "whatsapp" as SocialPlatform,
      href: buildWhatsappUrl(settings.whatsappNumber, DEFAULT_WHATSAPP_MESSAGE),
      bg: "bg-brand-blue",
    },
    { label: "Instagram", platform: "instagram" as SocialPlatform, href: settings.instagramUrl, bg: "bg-brand-orange" },
    { label: "Facebook", platform: "facebook" as SocialPlatform, href: settings.facebookUrl, bg: "bg-brand-blue" },
    { label: "TikTok", platform: "tiktok" as SocialPlatform, href: settings.tiktokUrl, bg: "bg-brand-orange" },
    { label: "LinkedIn", platform: "linkedin" as SocialPlatform, href: settings.linkedinUrl, bg: "bg-brand-blue" },
    {
      label: "MercadoLibre",
      platform: "mercadolibre" as SocialPlatform,
      href: settings.mercadolibreUrl,
      // The MeLi mark already carries its own yellow/navy colors, so it skips the
      // solid-color circle treatment the other (currentColor) icons use.
      bg: "bg-white",
    },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = [
      "*Solicitud de cotización - Ferre NewLink*",
      `Nombre: ${nombre}`,
      `Teléfono: ${telefono}`,
      `Categoría de interés: ${categoria}`,
      mensaje ? `Mensaje: ${mensaje}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(buildWhatsappUrl(settings.whatsappNumber, message), "_blank");
    setSent(true);
  }

  return (
    <section id="contacto" ref={ref} className="bg-brand-bg2 px-4 py-24 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div style={revealStyle(revealed, 0, 24)}>
          <div className="mb-2.5 text-[13px] font-bold tracking-wide text-brand-orange">COTIZACIÓN</div>
          <h2 className="mb-4 font-heading text-[clamp(26px,3vw,36px)] font-bold tracking-[-0.02em] text-brand-ink">
            Solicita tu cotización
          </h2>
          <p className="mb-7 max-w-md text-base leading-relaxed text-brand-ink-soft">
            Cuéntanos qué necesitas y te respondemos por WhatsApp el mismo día hábil. Ideal para pedidos por
            volumen o proyectos de obra.
          </p>

          {socials.length > 0 && (
            <>
              <div className="mb-3.5 text-[13px] font-bold tracking-wide text-brand-ink-soft">SÍGUENOS</div>
              <div className="flex flex-wrap gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className={`flex h-11.5 w-11.5 items-center justify-center rounded-full text-white transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] hover:-translate-y-1 hover:scale-[1.06] hover:shadow-[0_10px_20px_rgba(30,58,138,0.18)] ${s.bg}`}
                  >
                    <SocialIcon platform={s.platform} className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </>
          )}
        </div>

        <div
          style={revealStyle(revealed, 0.12, 24)}
          className="rounded-2xl border border-brand-line bg-white p-6 sm:p-10"
        >
          {sent ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange text-white">
                <Check className="h-5 w-5" />
              </div>
              <div className="mb-2 font-heading text-lg font-semibold text-brand-ink">
                ¡Listo! Te llevamos a WhatsApp
              </div>
              <div className="text-sm text-brand-ink-soft">
                Si no se abrió automáticamente, escríbenos directo por WhatsApp.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-brand-ink-soft">Nombre</label>
                <input
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full rounded-lg border border-brand-line px-3.5 py-3 text-[15px] focus:border-brand-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-brand-ink-soft">Teléfono</label>
                <input
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Número de contacto"
                  className="w-full rounded-lg border border-brand-line px-3.5 py-3 text-[15px] focus:border-brand-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-brand-ink-soft">
                  Categoría de interés
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full rounded-lg border border-brand-line bg-white px-3.5 py-3 text-[15px] focus:border-brand-blue focus:outline-none"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-brand-ink-soft">Mensaje</label>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Cuéntanos qué necesitas"
                  rows={4}
                  className="w-full resize-y rounded-lg border border-brand-line px-3.5 py-3 text-[15px] focus:border-brand-blue focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="mt-1.5 rounded-lg bg-brand-orange py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-orange-dark"
              >
                Enviar por WhatsApp
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
