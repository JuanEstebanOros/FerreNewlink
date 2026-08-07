import "dotenv/config";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

const EXCEL_PATH = process.argv[2] ?? "C:/Users/Usuario/Downloads/Publicaciones-2026_08_07-00_07.xlsx";

type MeliRow = {
  ITEM_ID: string;
  SKU: string;
  TITLE: string;
  QUANTITY: number | string;
  PRICE: number | string;
  CURRENCY_ID: string;
  STATUS: string;
  CATEGORY: string;
};

// Same keyword rules validated against the real 337-category list and approved
// in the category-mapping review before this script was written. Order matters:
// first matching rule wins.
const RULES: [string, RegExp][] = [
  [
    "electrico",
    /tomacorriente|cables? el[eé]ctrico|breaker|bombill|enchufe|interruptor(es)?( el[eé]ctric| autom[aá]tic| diferencial| de transferencia| electr[oó]nic| de luz)?|l[aá]mpara|iluminaci|reflector|\bled\b|transformador el[eé]ctrico|panel(es)? solar|regulador de voltaje|extensi[oó]n el[eé]ctrica|multitoma|timbre|generador el[eé]ctrico|insumos el[eé]ctricos|planta(s)? el[eé]ctrica|inversor(es)? de corriente|estabilizador|\bups\b|pinza(s)? amperom[eé]trica|portal[aá]mpara|regleta(s)? de tomas|c[aá]mara(s)? de vigilancia|bater[ií]a(s)? solar|cerradura(s)? el[eé]ctrica|extractor(es)? de aire|ventilador|hornilla|motor(es)? estacionario|fibra [oó]ptica|rastreador(es)? de cables|cinta(s)? adhesiva(s)? t[eé]rmica|electrodom[eé]sticos/i,
  ],
  [
    "plomeria",
    /tuber|grifer|llaves? de paso|manguera|sif[oó]n|desag|inodoro|regaderas? de ducha|regadera de ba[ñn]o|bomba(s)? de agua|bomba(s)? sumergible|bomba(s)? centr[ií]fuga|bomba(s)? perif[eé]rica|bomba(s)? hidroneum[aá]tica|tanque(s)? de agua|tanque(s)? hidroneum[aá]tico|v[aá]lvula|flotante|niple|codo pvc|uni[oó]n pvc|tap[oó]n pvc|lavamanos|lavaplatos|ca[ñn]os y tubos|tapa(s)? de poceta|poceta(s)?|tanque(s)? de poceta|purificador(es)?|filtro(s)?.*(purificador|[oó]smosis)|cupla(s)? y codo|man[oó]metro|aislante(s)? para tubo|art[ií]culos para ba[ñn]o|organizadores de ducha|urinario|chup[oó]n(es)? destapador(es)?|toallero|silla(s)? de ba[ñn]o|bombona(s)? de gas/i,
  ],
  [
    "pintura",
    /pintura|esmalte|barniz|thinner|diluyente|solvente para pintura|rodillo de pintura|brocha|masilla|sellador de pintura|pistola(s)? (el[eé]ctrica|neum[aá]tica)s? para pintar|aer[oó]grafo/i,
  ],
  [
    "impermeabilizacion",
    /manto(s)? asf[aá]ltico|impermeabilizante|membrana|sellador de techo|l[aá]mina(s)? asf[aá]ltica|teja(s)?\b|l[aá]minas para techo|rollo(s)? aislante(s)? para construcci/i,
  ],
  [
    "herreria",
    /soldador|\belectrodo(s)?\b|suelda\b|soplete(s)? para soldar|caret(a|as) para soldar|reja\b|port[oó]n(es)?\b|perfil met[aá]lico|[aá]ngulo de acero|platina met[aá]lica|tubo met[aá]lico estructural|malla cicl[oó]n|malla electrosoldada|candado|remache|remachadora|picaporte|manij[oó]n|bisagra|riel(es)? para mueble|malacate|polea(s)? industrial|brazo(s)? hidr[aá]ulico|dobladora(s)? de tubo|alambre(s)? (concertina|de metal)|gr[uú]a(s)? de piso|cerradura(s)? para puertas|rueda(s)? para (puertas|carritos|muebles)|tirador(es)? para muebles|bolilla(s)? de rodamiento|\bpuertas\b/i,
  ],
  [
    "materiales-construccion",
    /cemento|arena\b|bloque|cabilla|varilla|yeso|granz[oó]n|concreto|ladrillo|piedra picada|agregado|llana(s)? y fratacho|esp[aá]tula(s)? de construcci|adhesivo(s)? para construcci|vibrador(es)? de hormig[oó]n|rana(s)? compactadora|maquinaria de construcci|mezcla(s)? adhesiva(s)? para pisos|espuma(s)? expansiva|piso(s)? vin[ií]lico|soporte(s)? para vigas|cinta(s)? de demarcaci[oó]n|cuchara(s)? para alba[ñn]iler[ií]a|bomba(s)? para construcci[oó]n/i,
  ],
  [
    "herramientas",
    /taladr|sierra|martillo|destornillador|llaves? (inglesa|ajustable|de tuerca|de apriete)|alicate|amoladora|esmeril|pulidora|compresor|nivel(es)? de burbuja|nivel(es)? l[aá]ser|cinta(s)? m[eé]trica|caja(s)? de herramientas|disco(s)?( y piedra(s)?)? de (corte|desbaste)|broca(s)?|tornillo|tuerca\b|arandela|cepillo(s)? de alambre|herramientas|motosierra|desmalezadora|orilladora|kit(s)? de herramientas|formon(es)?|cincel(es)?|boquilla(s)? para herramientas|tijera(s)?(?! de podar)|cizalla(s)?|engrapadora(s)?|clavadora(s)?|fresadora(s)?|machete(s)?|multiherramienta(s)?|escalera(s)?|lijadora(s)?|porta dados|prensa(s)?( de banco)?|caliper(es)?|hacha(s)?|lima(s)? manual|hoja(s)? de serrucho|accesorios y repuestos para herramientas|barreta(s)?|kit(s)? para minitorno|mini herramientas rotativas|lija(s)?|bolso(s)? (porta)?herramientas|serrucho(s)?|equipamiento industrial y comercial|balanza(s)? industrial|selladora(s)?( de bolsas)? industrial|acople(s)? r[aá]pido|cintas? adhesiva(s)?(?! t[eé]rmica)|lona(s)? multiuso|hidrolavadora(s)?|pistola(s)? (y contenedores )?engrasador(es)?|aspiradora(s)?( y limpiadoras)?( a vapor)?|carretilla(s)?|cepillo(s)? (de |carpinter[oa]s? )?carpinter[oa]|bomba(s)? de aire manual|unidad(es)? de potencia hidr[aá]ulica|top[oó]metro(s)?|aceitera(s)? manual|soplador(as)?|pistola(s)? de calor|cortadora(s)? de cer[aá]mica|pistola(s)? (encoladora|de silicona)|cortadora(s)? de plasma/i,
  ],
  [
    "seguridad-industrial",
    /casco(s)? de seguridad|guante(s)? de seguridad|guante(s)? desechable|calzado de seguridad|lente(s)? de seguridad|chaleco(s)? reflectivo|chaleco(s)? t[aá]ctico|faja(s)? lumbar|m[aá]scara(s)? respiratoria|visor(es)? de protecci[oó]n|arn[eé]s(es)? de seguridad/i,
  ],
  [
    "jardin-agro",
    /jard[ií]n|maceta(s)?|pulverizador(es)?|rastrillo(s)?|hoyadora(s)?|carburador(es)? para m[aá]quinas de jard|cortadora(s)? de grama|podadora(s)? de grama|tractor(es)? podador|cuchilla(s)? para podadora|escardilla(s)?|planta(s)? artificial|grama artificial|bebedero(s)?|equipamiento agr[ií]cola|molino(s)? manual(es)? de grano|tijera(s)? de podar|motobomba(s)?|reverbero(s)? para discos de arado/i,
  ],
  [
    "automotriz",
    /para veh[ií]culos|para autos y camionetas|para motos|bujía(s)?|scanner(s)? para veh|accesorios para motos|traje(s)? impermeable(s)? para motorizados/i,
  ],
];

const OFF_BRAND_HINTS =
  /cocina|arrocera|sart[eé]n|olla(s)?|bowl|cuchara(s)? de cocina|vaso(s)?|copa(s)?|taza(s)?|jarra(s)?|cuchillo(s)? de cocina|embudo|juego(s)? de cubierto|termo(s)?|nevera(s)?|cafetera(s)?|parrilla(s)? el[eé]ctrica|tobo(s)?|poncher|cesta(s)? para ropa|gancho(s)? para ropa|tendedero(s)?|caja(s)? decorativa|decoraci[oó]n para el hogar|canasta(s)? decorativa|alfombra(s)? decorativa|jarr[oó]n(es)?|panel(es)? decorativo|espejo(s)?|marco(s)? para espejo|escritorio(s)?|estante(s)?|perchero(s)? de ba[ñn]o|cepillo(s)? de limpieza|art[ií]culos de limpieza|esponja(s)? de limpieza|pa[ñn]o(s)? de limpieza|franela(s)?|dispensador(es)?( manual(es)?)? de jab[oó]n|papel(es)? higi[eé]nico|dispensador(es)? de papel|cuaderno(s)?|papel(es)? art[ií]stico|carpeta(s)? y archivador|organizador(es)? de documentos|bol[ií]grafo(s)?|tiza(s)?|pizarra(s)?|envase(s)? de embalaje|rollo(s)? para embalaje|cinta(s)? de merceria|cinta(s)? de merc[eé]r[ií]a|papelera(s)?|collar(es)? para mascota|corneta(s)?|soporte(s)?.*televisor|docking station|caja(s)? fuerte(s)?|tambor(es)? de almacenamiento|bandeja(s)? magn[eé]tica|correa(s)? de amarre|camping|pesca\b|l[ií]nea(s)? de pesca|red(es)? de caza|chaleco(s)? salvavida|cabo(s)? n[aá]utico|boya(s)?|h[eé]lice(s)? n[aá]utica|piscina(s)?|sombrilla(s)?|patin(es)? de carga|cortina(s)?|persiana(s)?|l[ií]nea liviana|cable(s)? y adaptador(es)? de audio|cargador(es)? de dispositivos|cuerda(s)? de raqueta|art[ií]culos para el hogar|tabla(s)? de picar|plato(s)? de sitio|rollo(s)? y plancha(s)? de vinilo/i;

function classify(categoryName: string): string {
  if (!categoryName || categoryName === "Productos no clasificados") return "otros-varios";
  for (const [slug, re] of RULES) {
    if (re.test(categoryName)) return slug;
  }
  if (OFF_BRAND_HINTS.test(categoryName)) return "otros-varios";
  return "otros-varios";
}

const NEW_CATEGORIES: { name: string; slug: string; description: string }[] = [
  { name: "Herrería", slug: "herreria", description: "Soldadura, candados, cerraduras y herrajes para puertas y ventanas." },
  { name: "Impermeabilización", slug: "impermeabilizacion", description: "Mantos asfálticos, selladores y láminas para techos." },
  { name: "Jardín y Agro", slug: "jardin-agro", description: "Herramientas de jardinería, riego y equipos agrícolas." },
  { name: "Automotriz", slug: "automotriz", description: "Accesorios, repuestos y herramientas para vehículos." },
  { name: "Seguridad Industrial", slug: "seguridad-industrial", description: "Cascos, guantes, calzado y equipos de protección personal." },
  { name: "Otros / Varios", slug: "otros-varios", description: "Productos del catálogo que no encajan en un rubro de ferretería, o pendientes de reclasificar." },
];

async function main() {
  console.log(`Leyendo: ${EXCEL_PATH}`);
  const wb = XLSX.readFile(EXCEL_PATH);
  const sheet = wb.Sheets["Publicaciones"];
  if (!sheet) throw new Error('No se encontro la hoja "Publicaciones" en el Excel.');

  const rows = XLSX.utils.sheet_to_json<MeliRow>(sheet, { defval: "" });
  const real = rows.filter((r) => /^MLV\d+/.test(String(r.ITEM_ID)));
  console.log(`Filas reales detectadas: ${real.length}`);

  // 1. Create the 6 new categories (idempotent: skip if a slug already exists).
  for (const cat of NEW_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  const categories = await prisma.category.findMany();
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  console.log(`Categorias en el sitio tras el paso: ${categories.length}`);

  // 2. Build all product rows, resolving category + skipping any with a
  // duplicate meliItemId within the file itself (none expected, checked
  // beforehand, but defend against it anyway).
  const seenItemIds = new Set<string>();
  const toCreate: Array<{
    meliItemId: string;
    name: string;
    description: string;
    priceUsd: number;
    stock: number;
    imageUrl: null;
    active: boolean;
    featured: boolean;
    onSale: boolean;
    categoryId: string;
  }> = [];
  const skipped: { itemId: string; reason: string }[] = [];
  const categoryTally = new Map<string, number>();

  for (const row of real) {
    const itemId = String(row.ITEM_ID);
    if (seenItemIds.has(itemId)) {
      skipped.push({ itemId, reason: "ITEM_ID duplicado en el archivo" });
      continue;
    }
    seenItemIds.add(itemId);

    const price = Number(row.PRICE);
    if (!row.TITLE || !Number.isFinite(price)) {
      skipped.push({ itemId, reason: "Falta TITLE o PRICE invalido" });
      continue;
    }

    const slug = classify(row.CATEGORY);
    const categoryId = categoryIdBySlug.get(slug);
    if (!categoryId) {
      skipped.push({ itemId, reason: `Categoria "${slug}" no encontrada en la base` });
      continue;
    }

    categoryTally.set(slug, (categoryTally.get(slug) ?? 0) + 1);
    toCreate.push({
      meliItemId: itemId,
      name: String(row.TITLE).trim(),
      description: String(row.TITLE).trim(),
      priceUsd: price,
      stock: Math.max(0, Math.round(Number(row.QUANTITY) || 0)),
      imageUrl: null,
      active: true,
      featured: false,
      onSale: false,
      categoryId,
    });
  }

  // 3. Bulk insert.
  const result = await prisma.product.createMany({ data: toCreate });

  console.log("\n=== RESUMEN DE IMPORTACION ===");
  console.log(`Productos importados: ${result.count}`);
  console.log(`Filas omitidas: ${skipped.length}`);
  if (skipped.length > 0) {
    console.log("Detalle de omitidos:");
    skipped.forEach((s) => console.log(`  - ${s.itemId}: ${s.reason}`));
  }
  console.log("\nProductos por categoria:");
  const slugToLabel = new Map(categories.map((c) => [c.slug, c.name]));
  [...categoryTally.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([slug, count]) => console.log(`  ${(slugToLabel.get(slug) ?? slug).padEnd(24)} ${count}`));

  const totalProducts = await prisma.product.count();
  const totalCategories = await prisma.category.count();
  console.log(`\nTotal productos en la tabla: ${totalProducts}`);
  console.log(`Total categorias en la tabla: ${totalCategories}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
