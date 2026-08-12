"use client";

import { MapPin } from "lucide-react";
import { useSiteSettings } from "@/context/site-settings-context";

export function FloatingDirectionsButton() {
  const { storeAddress } = useSiteSettings();
  const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeAddress)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Cómo llegar"
      className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] hover:scale-110"
    >
      <MapPin className="h-6 w-6" />
    </a>
  );
}
