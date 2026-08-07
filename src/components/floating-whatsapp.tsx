"use client";

import { MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/context/site-settings-context";
import { buildWhatsappUrl, DEFAULT_WHATSAPP_MESSAGE } from "@/lib/whatsapp";

export function FloatingWhatsapp() {
  const { whatsappNumber } = useSiteSettings();
  const href = buildWhatsappUrl(whatsappNumber, DEFAULT_WHATSAPP_MESSAGE);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] hover:scale-110"
      style={{
        background: "oklch(58% 0.19 145)",
        animation: "wa-pulse 2.6s ease-out infinite",
      }}
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
