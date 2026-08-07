import { cookies } from "next/headers";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerSession, type CustomerSession } from "@/lib/auth";

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyCustomerSession(token);
}
