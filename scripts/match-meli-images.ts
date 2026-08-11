import "dotenv/config";
import { readFileSync, existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

// "Guardar pagina como > Pagina web completa" en el Editor Masivo de MeLi
// (con la sesion ya logueada) descarga un .html + una carpeta "..._files"
// con las imagenes reales. El nombre de archivo de cada imagen
// ({picture_id}-{ID_LARGO}_{fecha}-{variante}.jpg) NO sirve para
// identificar el producto -el ID que trae es un id interno de MeLi de
// 13-14 digitos, distinto de nuestro ITEM_ID de 9-10 digitos (verificado).
//
// La forma correcta de asociar imagen -> producto es leer el propio HTML:
// cada fila de la grilla trae
//   <img alt="image-MLV798055406" aria-label="image-MLV798055406" src="./Editor masivo_files/910594-....jpg">
// El atributo alt SI trae el ITEM_ID real (el mismo que guardamos en
// Product.meliItemId). Por eso este script parsea el .html, no los
// nombres de archivo.
const IMG_PATTERN = /<img alt="image-(ML[A-Z]\d+)" aria-label="image-\1" src="\.\/([^"]+)"/g;

const htmlArg = process.argv[2];
if (!htmlArg) {
  console.error('Uso: npx tsx scripts/match-meli-images.ts "<ruta al .html guardado>" [--copy]');
  console.error('El .html y su carpeta "..._files" deben estar juntos, como los deja el navegador.');
  process.exit(1);
}
const shouldCopy = process.argv.includes("--copy");
// Por defecto NUNCA se pisa un producto que ya tiene imagen -util porque
// los lotes se solapan seguido (paginacion repetida, filtros del Editor
// Masivo, etc.). Si alguna vez hace falta reemplazar una imagen ya
// asignada a proposito, usar --force.
const shouldForce = process.argv.includes("--force");
const htmlPath = path.resolve(htmlArg);
const baseDir = path.dirname(htmlPath);

// El navegador a veces guarda la carpeta "..._files" con un nombre que ya
// no coincide exacto con el que el propio HTML espera en sus src="./..."
// (visto en la practica: espacios/numeros movidos de lugar al re-guardar
// o renombrar). En vez de depender de ese nombre, indexamos por nombre de
// ARCHIVO (que si es estable) en cualquier carpeta hermana del .html.
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

function buildFilenameIndex(dir: string): Map<string, string> {
  const index = new Map<string, string>();
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkAndIndex(full, index);
    }
  }
  return index;
}

function resolveImagePath(relPath: string, filenameIndex: Map<string, string>): string | null {
  const direct = path.join(baseDir, relPath);
  if (existsSync(direct)) return direct;
  const byName = filenameIndex.get(path.basename(relPath));
  return byName ?? null;
}

async function main() {
  if (!existsSync(htmlPath)) {
    console.error(`No existe: ${htmlPath}`);
    process.exit(1);
  }
  const html = readFileSync(htmlPath, "utf8");

  const found: { itemId: string; relPath: string }[] = [];
  for (const match of html.matchAll(IMG_PATTERN)) {
    found.push({ itemId: match[1].toUpperCase(), relPath: match[2] });
  }

  console.log(`Filas de imagen encontradas en el HTML: ${found.length}`);
  if (found.length === 0) {
    console.log('No encontre el patron esperado. Puede que MeLi haya cambiado el markup del Editor Masivo.');
    return;
  }

  const filenameIndex = buildFilenameIndex(baseDir);
  const resolved = found.map((f) => ({ ...f, resolvedPath: resolveImagePath(f.relPath, filenameIndex) }));

  const missingFile = resolved.filter((f) => !f.resolvedPath);
  if (missingFile.length > 0) {
    console.log(`\nADVERTENCIA: ${missingFile.length} imagenes referenciadas en el HTML no se encontraron ni por ruta ni por nombre de archivo:`);
    console.log(missingFile.slice(0, 5).map((f) => f.relPath));
  }
  const foundByFallback = resolved.filter((f) => f.resolvedPath && !existsSync(path.join(baseDir, f.relPath)));
  if (foundByFallback.length > 0) {
    console.log(`(${foundByFallback.length} se encontraron por nombre de archivo, no por la ruta exacta del HTML — carpeta renombrada, ok.)`);
  }
  const usable = resolved.filter((f): f is typeof f & { resolvedPath: string } => f.resolvedPath !== null);

  const itemIds = [...new Set(usable.map((f) => f.itemId))];
  const products = await prisma.product.findMany({
    where: { meliItemId: { in: itemIds } },
    select: { id: true, meliItemId: true, name: true, imageUrl: true },
  });
  const productByItemId = new Map(products.map((p) => [p.meliItemId as string, p]));

  const matched = usable.filter((f) => productByItemId.has(f.itemId));
  const unmatched = usable.filter((f) => !productByItemId.has(f.itemId));
  const alreadyHadImage = matched.filter((f) => productByItemId.get(f.itemId)!.imageUrl);
  const toApply = shouldForce ? matched : matched.filter((f) => !productByItemId.get(f.itemId)!.imageUrl);
  const skipped = shouldForce ? [] : alreadyHadImage;

  console.log(`\nCoinciden con un producto (meliItemId) en la BD: ${matched.length} / ${usable.length}`);
  console.log(
    `De esos, ya tenian imagen: ${alreadyHadImage.length}` +
      (shouldForce ? " (se van a reemplazar, --force activo)" : " (se van a OMITIR, no se pisan)")
  );
  console.log(`Sin match (no esta entre los 1570): ${unmatched.length}`);
  if (unmatched.length > 0) {
    console.log("Ejemplos sin match:", unmatched.slice(0, 5).map((f) => f.itemId));
  }

  if (!shouldCopy) {
    console.log("\n(Modo solo-diagnostico. Agrega --copy al final para copiar los archivos y guardar imageUrl.)");
    return;
  }

  const destDir = path.join(process.cwd(), "public", "uploads", "products");
  mkdirSync(destDir, { recursive: true });
  let copied = 0;
  for (const f of toApply) {
    const product = productByItemId.get(f.itemId)!;
    const ext = path.extname(f.relPath) || ".jpg";
    const destFilename = `${product.id}${ext}`;
    copyFileSync(f.resolvedPath, path.join(destDir, destFilename));
    await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl: `/uploads/products/${destFilename}` },
    });
    copied++;
  }
  console.log(`\nListo. ${copied} productos nuevos actualizados con imagen real.`);
  if (skipped.length > 0) {
    console.log(`${skipped.length} omitidos por ya tener imagen (usa --force si alguna vez queres reemplazarlas).`);
  }
}

main().then(() => prisma.$disconnect());
