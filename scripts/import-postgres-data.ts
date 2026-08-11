import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { prisma } from "@/lib/prisma";

// Reads prisma/sqlite-export.json (produced by scripts/export-sqlite-data.ts)
// and inserts it into whatever DATABASE_URL currently points at (the new
// Postgres/Neon database). Original cuid ids are preserved so FK relations
// stay intact. Uses createMany + skipDuplicates so it's safe to re-run.
//
// Dry-run by default — pass --import to actually write.
const INPUT_PATH = path.join(__dirname, "..", "prisma", "sqlite-export.json");
const DATE_COLUMNS: Record<string, string[]> = {
  Category: ["createdAt"],
  Customer: ["createdAt"],
  Product: ["createdAt", "updatedAt"],
  Order: ["createdAt"],
};

function reviveDates(table: string, rows: Record<string, unknown>[]) {
  const cols = DATE_COLUMNS[table];
  if (!cols) return rows;
  for (const row of rows) {
    for (const col of cols) {
      if (typeof row[col] === "string") row[col] = new Date(row[col] as string);
    }
  }
  return rows;
}

async function main() {
  const shouldImport = process.argv.includes("--import");

  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`No se encontro ${INPUT_PATH}. Corre primero scripts/export-sqlite-data.ts`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));

  // Insertion order matters: parents before children (FK constraints).
  const ORDER = ["Category", "Customer", "Settings", "Product", "Order", "OrderItem"] as const;

  console.log(shouldImport ? "Importando a Postgres...\n" : "Diagnostico (dry-run, usa --import para aplicar):\n");

  for (const table of ORDER) {
    const rows: Record<string, unknown>[] = raw[table] ?? [];
    reviveDates(table, rows);
    console.log(`${table}: ${rows.length} filas`);

    if (!shouldImport || rows.length === 0) continue;

    // @ts-expect-error - dynamic model access, keyed by the same table names as the schema
    const model = prisma[table.charAt(0).toLowerCase() + table.slice(1)];
    const result = await model.createMany({ data: rows, skipDuplicates: true });
    console.log(`  -> ${result.count} insertadas (duplicados por id omitidos)`);
  }

  if (!shouldImport) {
    console.log("\nNada escrito. Corre de nuevo con --import para aplicar.");
  } else {
    console.log("\nImportacion completa.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
