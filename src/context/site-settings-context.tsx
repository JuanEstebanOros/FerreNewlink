"use client";

import { createContext, useContext, type ReactNode } from "react";

export type SiteSettings = {
  whatsappNumber: string;
  storeAddress: string;
  storePhone: string;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  mercadolibreUrl: string | null;
  tiktokUrl: string | null;
  facebookUrl: string | null;
  contactEmail: string | null;
};

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({
  children,
  settings,
}: {
  children: ReactNode;
  settings: SiteSettings;
}) {
  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  return ctx;
}
