// SQLite no tiene una forma nativa de comparar texto ignorando tildes (y
// Prisma's `mode: "insensitive"` tampoco esta soportado en el conector de
// SQLite, solo en Postgres/MySQL/Mongo). Normalizamos en JS de ambos lados
// -minusculas + tildes removidas- y comparamos substrings ya normalizados.
// Esto tambien es portable si el proyecto migra a Postgres mas adelante.
//
// Construido con codigos numericos (no escapes \u literales en el fuente)
// para evitar cualquier problema de encoding del bloque de marcas
// diacriticas combinantes (U+0300 - U+036F) en el archivo.
const COMBINING_DIACRITICS_START = 0x0300;
const COMBINING_DIACRITICS_END = 0x036f;
const COMBINING_DIACRITICS = new RegExp(
  "[" + String.fromCharCode(COMBINING_DIACRITICS_START) + "-" + String.fromCharCode(COMBINING_DIACRITICS_END) + "]",
  "g"
);

export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .trim();
}

export function searchWords(query: string): string[] {
  return normalizeSearchText(query).split(/\s+/).filter(Boolean);
}

// Coincidencia flexible: todas las palabras de la busqueda deben aparecer
// en algun lugar del texto (no necesariamente en orden ni adyacentes), ya
// normalizadas. Permite que "inalambrico taladro" o "taladro inalambrico"
// encuentren "Taladro Inalámbrico 20V" por igual.
export function matchesSearch(text: string, words: string[]): boolean {
  if (words.length === 0) return true;
  const normalized = normalizeSearchText(text);
  return words.every((w) => normalized.includes(w));
}
