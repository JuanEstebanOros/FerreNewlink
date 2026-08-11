import { SignJWT, jwtVerify } from "jose";

const CUSTOMER_SESSION_COOKIE = "ferre_customer_session";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET no esta configurado. Define esta variable de entorno (ver .env.example) antes de iniciar la app — no hay un valor por defecto por seguridad."
  );
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export type CustomerSession = {
  customerId: string;
  name: string;
  email: string;
  isAdmin: boolean;
};

export async function signCustomerSession(payload: CustomerSession): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyCustomerSession(token: string): Promise<CustomerSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (
      typeof payload.customerId !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.isAdmin !== "boolean"
    ) {
      return null;
    }
    return { customerId: payload.customerId, name: payload.name, email: payload.email, isAdmin: payload.isAdmin };
  } catch {
    return null;
  }
}

export { CUSTOMER_SESSION_COOKIE };
