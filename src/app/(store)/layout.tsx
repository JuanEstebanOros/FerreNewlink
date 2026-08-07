import { Space_Grotesk, Public_Sans } from "next/font/google";
import { prisma } from "@/lib/prisma";
import { Providers } from "@/app/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FloatingWhatsapp } from "@/components/floating-whatsapp";
import { CartDrawer } from "@/components/cart-drawer";
import { CartToast } from "@/components/cart-toast";
import { NavHistoryBaseline } from "@/components/nav-history-baseline";
import { getCustomerSession } from "@/lib/customer-session";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

async function getSettings() {
  const settings = await prisma.settings.findFirst();
  return {
    exchangeRate: settings?.exchangeRate ?? 40,
    whatsappNumber: settings?.whatsappNumber ?? "+573108264892",
    storeAddress: settings?.storeAddress ?? "Cra. 45 #12-30, Barrio Industrial, Bogota, Colombia",
    storePhone: settings?.storePhone ?? "+57 601 555 0192",
    instagramUrl: settings?.instagramUrl ?? null,
    linkedinUrl: settings?.linkedinUrl ?? null,
    mercadolibreUrl: settings?.mercadolibreUrl ?? null,
    tiktokUrl: settings?.tiktokUrl ?? null,
    facebookUrl: settings?.facebookUrl ?? null,
    contactEmail: settings?.contactEmail ?? null,
  };
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, customerSession] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { name: true, slug: true } }),
    getCustomerSession(),
  ]);

  return (
    <div className={`${spaceGrotesk.variable} ${publicSans.variable} flex min-h-full flex-1 flex-col`}>
      <NavHistoryBaseline />
      <Providers
        initialExchangeRate={settings.exchangeRate}
        initialCustomer={
          customerSession
            ? { name: customerSession.name, email: customerSession.email, isAdmin: customerSession.isAdmin }
            : null
        }
        siteSettings={{
          whatsappNumber: settings.whatsappNumber,
          storeAddress: settings.storeAddress,
          storePhone: settings.storePhone,
          instagramUrl: settings.instagramUrl,
          linkedinUrl: settings.linkedinUrl,
          mercadolibreUrl: settings.mercadolibreUrl,
          tiktokUrl: settings.tiktokUrl,
          facebookUrl: settings.facebookUrl,
          contactEmail: settings.contactEmail,
        }}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer categories={categories} />
        <FloatingWhatsapp />
        <CartDrawer />
        <CartToast />
      </Providers>
    </div>
  );
}
