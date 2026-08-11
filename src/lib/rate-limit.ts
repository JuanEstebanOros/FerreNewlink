// Limitador en memoria, sin dependencias externas. Suficiente porque la app
// corre en una sola instancia (mismo supuesto que ya vale para la DB SQLite
// local) — si en el futuro se despliega en multiples instancias, este estado
// dejaria de compartirse entre ellas y habria que migrar a Redis/Upstash.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

// `context` es solo para que el log identifique que endpoint disparo el
// bloqueo (login/register/orders) — no cambia la logica del limite.
export function isRateLimited(key: string, context: string): { limited: boolean; retryAfterSeconds: number } {
  const entry = store.get(key);
  const now = Date.now();
  if (!entry || now > entry.resetAt) return { limited: false, retryAfterSeconds: 0 };
  if (entry.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((entry.resetAt - now) / 60000);
    console.warn(
      `[rate-limit] BLOQUEADO context=${context} key=${key} intentos=${entry.count} restablece_en=${minutesLeft}min`
    );
    return { limited: true, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { limited: false, retryAfterSeconds: 0 };
}

// Usado por login/register: solo cuenta intentos fallidos, se limpia en exito.
export function recordFailedAttempt(key: string): void {
  recordAttempt(key);
}

// Usado por orders: cuenta cada intento (exitoso o no), porque ahi el abuso
// que nos importa es el volumen de pedidos creados, no solo los fallidos.
export function recordAttempt(key: string): void {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearAttempts(key: string): void {
  store.delete(key);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
