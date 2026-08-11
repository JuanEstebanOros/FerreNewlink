import "dotenv/config";
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, copyFileSync, writeFileSync } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

// Version "recorre una carpeta entera" de match-meli-images.ts. Misma tecnica
// exacta (ver ese script y CLAUDE.md §5 item 17 / §7 para el porque), pero en
// vez de recibir un solo .html, recibe una carpeta raiz que contiene varios
// lotes -cada lote es un .html + su carpeta "..._files" hermana, ya sea cada
// uno en su propia subcarpeta o todos sueltos juntos en la misma carpeta. El
// script encuentra todos los .html recursivamente y los procesa uno por uno,
// en el mismo orden en que los encuentra, consultando la BD de nuevo antes de
// cada lote -asi un producto resuelto por el lote 1 aparece correctamente
// como "ya tenia imagen" si el lote 2 lo vuelve a traer (los filtros del
// Editor Masivo se solapan seguido, ver CLAUDE.md).
const IMG_PATTERN = /<img alt="image-(ML[A-Z]\d+)" aria-label="image-\1" src="\.\/([^"]+)"/g;

const rootArg = process.argv[2];
if (!rootArg) {
  console.error('Uso: npx tsx scripts/batch-match-meli-images.ts "<carpeta con los lotes>" [--copy] [--force]');
  console.error('La carpeta debe contener, para cada lote, el .html guardado junto a su carpeta "..._files".');
  process.exit(1);
}
const shouldCopy = process.argv.includes("--copy");
const shouldForce = process.argv.includes("--force");
const rootDir = path.resolve(rootArg);

function findHtmlFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      findHtmlFiles(full, out);
    } else if (entry.toLowerCase().endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

// Misma logica que el script original: el nombre de la carpeta "..._files"
// puede no coincidir con lo que el HTML espera (renombrada al re-guardar), asi
// que se indexa por nombre de archivo dentro de cualquier subcarpeta hermana
// del .html.
function walkAndIndex(dir: string, index: Map<string, string>) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkAndIndex(full, index);
    } else if (!index.has(entry)) {
      index.set(entry, full);
    }
  }
}

function buildFilenameIndex(baseDir: string): Map<string, string> {
  const index = new Map<string, string>();
  for (const entry of readdirSync(baseDir)) {
    const full = path.join(baseDir, entry);
    if (statSync(full).isDirectory()) {
      walkAndIndex(full, index);
    }
  }
  return index;
}

function resolveImagePath(baseDir: string, relPath: string, filenameIndex: Map<string, string>): string | null {
  const direct = path.join(baseDir, relPath);
  if (existsSync(direct)) return direct;
  return filenameIndex.get(path.basename(relPath)) ?? null;
}

interface BatchResult {
  htmlPath: string;
  rowsFound: number;
  matched: number;
  copied: number;
  alreadySkipped: number;
  unmatchedItemIds: string[];
  missingFileRelPaths: string[];
}

async function processBatch(htmlPath: string): Promise<BatchResult> {
  const baseDir = path.dirname(htmlPath);
  const html = readFileSync(htmlPath, "utf8");

  // Dedupe por itemId dentro del mismo lote -si el mismo producto aparece dos
  // veces en el HTML (visto en la practica), no lo contamos ni lo copiamos dos
  // veces.
  const foundByItemId = new Map<string, { itemId: string; relPath: string }>();
  for (const match of html.matchAll(IMG_PATTERN)) {
    const itemId = match[1].toUpperCase();
    if (!foundByItemId.has(itemId)) {
      foundByItemId.set(itemId, { itemId, relPath: match[2] });
    }
  }
  const found = [...foundByItemId.values()];

  const result: BatchResult = {
    htmlPath,
    rowsFound: found.length,
    matched: 0,
    copied: 0,
    alreadySkipped: 0,
    unmatchedItemIds: [],
    missingFileRelPaths: [],
  };
  if (found.length === 0) return result;

  const filenameIndex = buildFilenameIndex(baseDir);
  const resolved = found.map((f) => ({ ...f, resolvedPath: resolveImagePath(baseDir, f.relPath, filenameIndex) }));

  result.missingFileRelPaths = resolved.filter((f) => !f.resolvedPath).map((f) => f.relPath);
  const usable = resolved.filter((f): f is typeof f & { resolvedPath: string } => f.resolvedPath !== null);

  const itemIds = [...new Set(usable.map((f) => f.itemId))];
  const products = await prisma.product.findMany({
    where: { meliItemId: { in: itemIds } },
    select: { id: true, meliItemId: true, imageUrl: true },
  });
  const productByItemId = new Map(products.map((p) => [p.meliItemId as string, p]));

  const matched = usable.filter((f) => productByItemId.has(f.itemId));
  const unmatched = usable.filter((f) => !productByItemId.has(f.itemId));
  const alreadyHadImage = matched.filter((f) => productByItemId.get(f.itemId)!.imageUrl);
  const toApply = shouldForce ? matched : matched.filter((f) => !productByItemId.get(f.itemId)!.imageUrl);

  result.matched = matched.length;
  result.alreadySkipped = shouldForce ? 0 : alreadyHadImage.length;
  result.unmatchedItemIds = unmatched.map((f) => f.itemId);

  if (!shouldCopy) return result;

  const destDir = path.join(process.cwd(), "public", "uploads", "products");
  mkdirSync(destDir, { recursive: true });
  for (const f of toApply) {
    const product = productByItemId.get(f.itemId)!;
    const ext = path.extname(f.relPath) || ".jpg";
    const destFilename = `${product.id}${ext}`;
    copyFileSync(f.resolvedPath, path.join(destDir, destFilename));
    await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl: `/uploads/products/${destFilename}` },
    });
    result.copied++;
  }
  return result;
}

async function main() {
  if (!existsSync(rootDir) || !statSync(rootDir).isDirectory()) {
    console.error(`No existe (o no es una carpeta): ${rootDir}`);
    process.exit(1);
  }
  const htmlFiles = findHtmlFiles(rootDir);
  if (htmlFiles.length === 0) {
    console.log(`No encontre ningun .html dentro de ${rootDir}.`);
    return;
  }
  console.log(`Encontrados ${htmlFiles.length} archivo(s) .html. Procesando en orden...\n`);

  const results: BatchResult[] = [];
  for (const htmlPath of htmlFiles) {
    const rel = path.relative(rootDir, htmlPath);
    const r = await processBatch(htmlPath);
    results.push(r);
    if (r.rowsFound === 0) {
      console.log(`- ${rel}: sin filas de imagen reconocidas (markup distinto o pagina vacia).`);
      continue;
    }
    console.log(
      `- ${rel}: ${r.rowsFound} filas, ${r.matched} coinciden con un producto, ` +
        `${shouldCopy ? r.copied + " copiadas" : "(diagnostico)"}, ${r.alreadySkipped} ya tenian imagen, ` +
        `${r.unmatchedItemIds.length} sin match, ${r.missingFileRelPaths.length} sin archivo de imagen.`
    );
  }

  const totalRows = results.reduce((s, r) => s + r.rowsFound, 0);
  const totalMatched = results.reduce((s, r) => s + r.matched, 0);
  const totalCopied = results.reduce((s, r) => s + r.copied, 0);
  const totalAlreadySkipped = results.reduce((s, r) => s + r.alreadySkipped, 0);
  const totalMissingFile = results.reduce((s, r) => s + r.missingFileRelPaths.length, 0);
  const emptyBatches = results.filter((r) => r.rowsFound === 0);

  const unmatchedCount = new Map<string, number>();
  for (const r of results) {
    for (const id of r.unmatchedItemIds) {
      unmatchedCount.set(id, (unmatchedCount.get(id) ?? 0) + 1);
    }
  }
  const uniqueUnmatched = [...unmatchedCount.keys()];

  console.log("\n===== RESUMEN FINAL =====");
  console.log(`Lotes procesados: ${htmlFiles.length} (${emptyBatches.length} sin filas reconocidas)`);
  console.log(`Filas de imagen totales (tras dedupe por lote): ${totalRows}`);
  console.log(`Coincidencias con un producto de la BD: ${totalMatched}`);
  if (shouldCopy) {
    console.log(`Productos NUEVOS actualizados con imagen real: ${totalCopied}`);
  } else {
    console.log("Modo solo-diagnostico -no se copio ni escribio nada. Agrega --copy para aplicar.");
  }
  console.log(`Omitidos por ya tener imagen: ${totalAlreadySkipped}${shouldForce ? " (--force estaba activo, no deberia haber omitidos)" : ""}`);
  console.log(`Sin archivo de imagen en disco (HTML lo referencia pero no aparece ni por ruta ni por nombre): ${totalMissingFile}`);
  console.log(`itemId sin match en la BD (no estan entre los 1570 importados): ${uniqueUnmatched.length} distintos`);
  console.log("  -> Motivo tipico: producto publicado en MeLi despues del export del 7 de agosto (ver CLAUDE.md §7). No asumir bug del script primero, cruzar contra el Excel.");

  const reportLines: string[] = [];
  reportLines.push(`Resumen batch-match-meli-images.ts — ${new Date().toISOString()}`);
  reportLines.push(`Carpeta procesada: ${rootDir}`);
  reportLines.push(`Modo: ${shouldCopy ? "COPY" : "diagnostico"}${shouldForce ? " + FORCE" : ""}`);
  reportLines.push("");
  reportLines.push("Por lote:");
  for (const r of results) {
    reportLines.push(
      `  ${path.relative(rootDir, r.htmlPath)}: filas=${r.rowsFound} matched=${r.matched} copiadas=${r.copied} ` +
        `ya_tenian=${r.alreadySkipped} sin_match=${r.unmatchedItemIds.length} sin_archivo=${r.missingFileRelPaths.length}`
    );
  }
  reportLines.push("");
  reportLines.push(`TOTAL filas=${totalRows} matched=${totalMatched} copiadas=${totalCopied} ya_tenian=${totalAlreadySkipped} sin_match=${uniqueUnmatched.length} sin_archivo=${totalMissingFile}`);
  reportLines.push("");
  reportLines.push(`itemId sin match en la BD (${uniqueUnmatched.length}):`);
  reportLines.push(uniqueUnmatched.join(", ") || "(ninguno)");
  if (totalMissingFile > 0) {
    reportLines.push("");
    reportLines.push("Rutas de imagen referenciadas en el HTML pero no encontradas en disco:");
    for (const r of results) {
      for (const rel of r.missingFileRelPaths) reportLines.push(`  [${path.basename(r.htmlPath)}] ${rel}`);
    }
  }

  const reportPath = path.join(rootDir, `resumen-${Date.now()}.txt`);
  writeFileSync(reportPath, reportLines.join("\n"), "utf8");
  console.log(`\nReporte detallado guardado en: ${reportPath}`);
}

main().then(() => prisma.$disconnect());
