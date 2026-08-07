"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export type CustomerInfo = {
  name: string;
  email: string;
  isAdmin: boolean;
} | null;

type CustomerContextValue = {
  customer: CustomerInfo;
  setCustomer: (customer: CustomerInfo) => void;
  logout: () => Promise<void>;
};

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({
  children,
  initialCustomer,
}: {
  children: ReactNode;
  initialCustomer: CustomerInfo;
}) {
  const [customer, setCustomer] = useState<CustomerInfo>(initialCustomer);
  const router = useRouter();

  async function logout() {
    await fetch("/api/customer/logout", { method: "POST" });
    setCustomer(null);
    router.push("/");
    router.refresh();
  }

  return (
    <CustomerContext.Provider value={{ customer, setCustomer, logout }}>{children}</CustomerContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerProvider");
  return ctx;
}
