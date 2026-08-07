"use client";

import type { ReactNode } from "react";
import { CurrencyProvider } from "@/context/currency-context";
import { CartProvider } from "@/context/cart-context";
import { SiteSettingsProvider, type SiteSettings } from "@/context/site-settings-context";
import { CustomerProvider, type CustomerInfo } from "@/context/customer-context";

export function Providers({
  children,
  initialExchangeRate,
  siteSettings,
  initialCustomer,
}: {
  children: ReactNode;
  initialExchangeRate: number;
  siteSettings: SiteSettings;
  initialCustomer: CustomerInfo;
}) {
  return (
    <SiteSettingsProvider settings={siteSettings}>
      <CustomerProvider initialCustomer={initialCustomer}>
        <CurrencyProvider initialExchangeRate={initialExchangeRate}>
          <CartProvider>{children}</CartProvider>
        </CurrencyProvider>
      </CustomerProvider>
    </SiteSettingsProvider>
  );
}
