import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";

// Reads the old dev.db directly via raw SQL — deliberately NOT going through
// the Prisma client, since schema.prisma now declares provider = "postgresql"
// and a Postgres-flavored generated client can't execute against the sqlite
// adapter. This script only ever touches the local SQLite file, never the
// live DATABASE_URL.
const SQLITE_PATH = process.argv[2] ?? path.join(__dirname, "..", "dev.db");
const OUTPUT_PATH = path.join(__dirname, "..", "prisma", "sqlite-export.json");

const BOOLEAN_COLUMNS: Record<string, string[]> = {
  Product: ["active", "featured", "onSale"],
  Customer: ["isAdmin"],
};

function coerceBooleans(table: string, rows: Record<string, unknown>[]) {
  const cols = BOOLEAN_COLUMNS[table];
  if (!cols) return rows;
  for (const row of rows) {
    for (const col of cols) {
      row[col] = Boolean(row[col]);
    }
  }
  return rows;
}

function main() {
  if (!fs.existsSync(SQLITE_PATH)) {
    console.error(`No se encontro el archivo SQLite: ${SQLITE_PATH}`);
    process.exit(1);
  }

  const db = new Database(SQLITE_PATH, { readonly: true });

  const tables = ["Category", "Customer", "Settings", "Product", "Order", "OrderItem"];
  const data: Record<string, Record<string, unknown>[]> = {};

  for (const table of tables) {
    const quoted = table === "Order" ? '"Order"' : table;
    const rows = db.prepare(`SELECT * FROM ${quoted}`).all() as Record<string, unknown>[];
    data[table] = coerceBooleans(table, rows);
    console.log(`${table}: ${rows.length} filas`);
  }

  db.close();

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), "utf-8");
  console.log(`\nExportado a ${OUTPUT_PATH}`);
}

main();
