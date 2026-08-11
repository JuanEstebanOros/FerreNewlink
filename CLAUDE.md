@AGENTS.md

# Ferre NewLink — Project State

> **Read this file first in any new session.** It is the authoritative source of truth for
> where this project stands. It was written to survive a full context reset — nothing here
> should require re-deriving from conversation history.

## 1. What this is

A real e-commerce + admin-panel web app for **Ferre NewLink**, an actual hardware store
(ferretería) in **Local Nro. 178, Avenida Los Cedros, Maracay 2103, Aragua, Venezuela**.
This is not a demo/portfolio project — the owner (the user) is actively using it and has
provided real branding assets, real contact info, and real feedback across many sessions.

The store sells herramientas, materiales de construcción, pintura, plomería, eléctrico,
herrería, impermeabilización, jardín/agro, automotriz, seguridad industrial y varios otros
rubros. Customers browse the catalog, add to cart, and check out by being redirected to
WhatsApp with a prefilled order summary (no real payment processing — this is intentional,
see §5 Design Decisions).

Prices are stored in USD and displayed to the customer in **USD or Venezuelan Bolívares
(VES)** via an admin-editable exchange rate.

**The catalog is now real, not a demo.** The store's actual MercadoLibre catalog (seller
"amaking", site MLV) has been imported: **1570 real products** across **11 categories**.
This replaced the original 20 hand-written demo products entirely (see §5 for the full
import story). **The real-image backfill is now complete — all 1570/1570 products have a
real photo** (finished 2026-08-11, see §5 item 17 for how and §7 item 1 history for the
process — that section is now closed out, kept for reference if a similar bulk-image
problem comes up again).

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.2.11**, App Router, Turbopack | Newer than typical training data — see §3 |
| Language | TypeScript, React 19.2.4 | |
| Styling | **Tailwind CSS v4** (`@theme inline` tokens in `globals.css`) | No `tailwind.config.js` — v4 uses CSS-based config |
| Fonts | `next/font/google`: **Space Grotesk** (headings, `font-heading`), **Public Sans** (body) | Loaded in `src/app/(store)/layout.tsx`, scoped to the store route group |
| Database | **Postgres** (Railway-managed, production) | Migrated from local SQLite (`dev.db`) — see §7 item 5. `src/lib/prisma.ts` uses `@prisma/adapter-pg`. Old SQLite migrations archived in `prisma/migrations-sqlite-archive/` |
| ORM | **Prisma 7.9.0** | Requires a driver adapter even for SQLite — see §3 |
| Auth | Custom JWT (`jose`) in an httpOnly cookie + `bcryptjs` password hashing | Single unified system, see §5. **`JWT_SECRET` has no fallback — the app throws on startup if it's unset**, see §5 security section |
| Validation | `zod` on every API route body | |
| Rate limiting | Custom in-memory limiter, `src/lib/rate-limit.ts` — **no new dependency added on purpose** | Login/register/orders, see §5 security section |
| Spreadsheet import | `xlsx` (SheetJS), devDependency | Used only by one-off scripts in `scripts/`, not the running app |
| Icons | `lucide-react` v1.26 (brand icons like Instagram/LinkedIn were **removed** in this version — see `social-icons.tsx`) | |
| Charts | `recharts` (admin Reportes page) | |
| Package manager | npm | |

Run it: `npm run dev` inside `ferre-newlink/` (or via the root `.claude/launch.json` config
named `ferre-newlink-dev`, port 3000, **`autoPort: true`** — if another session already has
port 3000, this one gets assigned a free one automatically instead of failing). Seed: `npx
prisma db seed` (only relevant for the old demo-data shape, not really needed anymore now
that the real catalog is imported). Migrate: see the Prisma gotchas in §3, plain `prisma
migrate dev` does **not** work non-interactively in this project.

**This directory IS now a git repository** (initialized this session, one `git init` +
initial commit covering everything up to that point — see §7 for what's uncommitted since).
No remote configured, nothing pushed anywhere. `.gitignore` already correctly excludes
`.env*`, `dev.db`, `node_modules`, `.next`, `src/generated/prisma`, and `public/uploads/*`
(except `.gitkeep`) — verified nothing sensitive got committed.

## 3. Version-specific gotchas (do not assume older API shapes)

This project runs on Next.js 16 and Prisma 7, both newer than typical model training data.
The scaffolded `AGENTS.md` (imported at the top of this file) already warns about this
generally; these are the **specific breaking changes we already hit and worked around**:

- **No `middleware.ts`.** Next 16 renamed it to **`proxy.ts`** with an exported `proxy()`
  function (not `middleware()`). Ours is at `src/proxy.ts` and guards `/admin/:path*` and
  `/api/admin/:path*` via `config.matcher`.
- **`params` and `searchParams` are `Promise`s**, in both page components and route
  handlers. Always `await params` / `await searchParams`. Same for `cookies()` and
  `headers()` from `next/headers` — both are now `async` and must be awaited.
- **Prisma 7 requires a driver adapter, even for SQLite.** `new PrismaClient()` with no
  adapter throws `PrismaClientInitializationError`. We use
  `@prisma/adapter-better-sqlite3`'s `PrismaBetterSqlite3` class — see `src/lib/prisma.ts`
  and `prisma/seed.ts` for the pattern (`new PrismaBetterSqlite3({ url })` passed as
  `{ adapter }` to `new PrismaClient()`).
- **Prisma 7 needs a `prisma.config.ts`** at the project root (separate from
  `schema.prisma`) that defines the schema path, migrations path, seed command, and
  datasource URL. Ours reads `DATABASE_URL` from `.env` via `dotenv/config`.
- **The generated Prisma client is not `@prisma/client`.** The schema's `generator client`
  block sets `provider = "prisma-client"` and `output = "../src/generated/prisma"`, so
  imports are `from "@/generated/prisma/client"` (see `src/lib/prisma.ts`). This generated
  folder is gitignored and must be regenerated with `npx prisma generate` after ever
  touching `schema.prisma` — **we hit stale-client TypeScript errors multiple times in
  this project specifically because `prisma migrate dev` didn't always trigger
  regeneration reliably; always run `npx prisma generate` explicitly after a migration.**
- **`prisma migrate dev` refuses to run non-interactively**, and this is broader than we
  first thought. It's not just destructive changes — **any** migration that produces a
  warning (e.g. adding a `@unique` nullable column, which warns "if there are existing
  duplicate values this will fail") also triggers the "environment is non-interactive"
  refusal, even though the actual change is harmless. `--create-only` does **not** avoid
  this either. The reliable workaround used repeatedly in this project:
  1. `npx prisma migrate diff --from-migrations ./prisma/migrations --to-schema
     ./prisma/schema.prisma --script` to generate the raw SQL.
  2. Manually create `prisma/migrations/<timestamp>_<name>/migration.sql` with that SQL
     (timestamp format matches existing folders, e.g. `20260807044618_add_meli_item_id`).
  3. `npx prisma migrate deploy` to apply it (this command **does** work non-interactively).
  4. `npx prisma generate` explicitly afterward.
  - If the change really is destructive against non-empty data: empty the table first
    (`DELETE FROM X`) so Prisma sees no data-loss risk, then the normal flow can work — but
    the manual-SQL-file approach above works regardless and is now the default habit here.
- **Turbopack/HMR can get into a corrupted state** after many rapid edits, throwing
  "module factory is not available" errors, or after `.next` is deleted while a dev server
  is still running against it — **this actually happened in this project**: running `next
  build` (production build test) while a dev server was live against the same directory
  corrupted the shared `.next` folder and crashed the other server with Turbopack backend
  panics ("Failed to restore task data (corrupted database or bug)"). Fix either way: stop
  the affected dev server(s), `rm -rf .next`, restart. **Be careful running `next build` /
  `next start` in the same project directory as a live `next dev` session** — they don't
  coexist safely on the same `.next` folder.

## 4. Architecture

### Route groups
- **`src/app/(store)/`** — the public-facing site. Shares one layout
  (`(store)/layout.tsx`) that loads the two Google Fonts, fetches `Settings` +
  categories + the customer session server-side, and wraps everything in `<Providers>`.
  Also mounts `<NavHistoryBaseline />` (see below) at the top, before `<Providers>`.
  Pages: `page.tsx` (home — Hero, Categorías, **Destacados** + **Ofertas** curated
  sections only, Nosotros, Ubicación, Contacto), `productos/` (full paginated catalog,
  24/page, filter by `?categoria=`/`?q=`/`?pagina=`, accent/case-insensitive search — see
  below), `producto/[id]/` (has a `<BackToProducts />` link that uses `router.back()` when
  there's in-app navigation history, falling back to `/productos` otherwise), `checkout/`,
  `registro/`, `ingresar/`, `mis-pedidos/`. The homepage does **not** list the full
  catalog — that was deliberately moved to `/productos` once the catalog grew past a
  couple dozen demo items (see §5). `src/components/pagination.tsx` is the reusable
  pager, used by `/productos` (server-rendered, `?pagina=`) and independently
  reimplemented client-side in `/admin/productos` (same 24/page size). With 1570 real
  products, `/productos` now has **66 pages**.
- **`src/app/admin/(dashboard)/`** — the admin panel. `layout.tsx` calls
  `getCustomerSession()` and redirects to `/ingresar` unless `session.isAdmin` is true.
  Pages: dashboard (`page.tsx`), `categorias/`, `productos/` (table has `overflow-x-auto`
  now — see §5 — and its image upload input has `capture="environment"` for mobile
  camera), `pedidos/`, `reportes/`, `configuracion/`. `admin-sidebar.tsx` is responsive:
  a persistent sidebar on desktop (`md:flex`), a slide-in drawer + compact topbar with a
  hamburger button on mobile.
- **`src/app/api/`** — route handlers. `api/orders` (public checkout, **now rate-limited**
  — see §5), `api/customer/*` (register/login/logout/orders — public, **login and
  register are now rate-limited**), `api/admin/*` (categorias/productos/pedidos/
  configuracion/upload — gated by `proxy.ts`; none of these routes check auth themselves,
  they rely entirely on the proxy — see the security review notes in §5/§7 for why this
  is flagged as a medium-severity single-point-of-failure, not yet fixed).

### Auth model — IMPORTANT, this was refactored once already
There is **one login system, not two**. Originally there was a separate `Admin` Prisma
model with its own username/password login at `/admin/login`. **This was deliberately
removed** (see §5) because the user found having two separate login entry points
confusing. Now:
- A single `Customer` model (`prisma/schema.prisma`) has an `isAdmin Boolean` column.
- The single login page is **`/ingresar`** (`src/app/(store)/ingresar/page.tsx`), posting
  to `POST /api/customer/login`.
- On successful login, the client checks `data.isAdmin`: if true, redirect to `/admin`;
  otherwise `/mis-pedidos`.
- Session is a JWT (`jose`, `HS256`, 30-day expiry) in an httpOnly cookie named
  `ferre_customer_session` (constant `CUSTOMER_SESSION_COOKIE` in `src/lib/auth.ts`). The
  JWT payload is `{ customerId, name, email, isAdmin }`.
  - **`src/lib/auth.ts` now throws at module load if `process.env.JWT_SECRET` is unset —
    there is no hardcoded fallback anymore** (there used to be one,
    `"ferre-newlink-dev-secret-change-in-production"`, found and removed during a security
    review — it was a real risk since it was visible in source and would have let anyone
    forge an `isAdmin: true` session if deployed without setting the real env var). See §5
    security section and §7 for the Railway env var this requires.
- `src/proxy.ts` reads that same cookie to gate `/admin/*` and `/api/admin/*` — it checks
  `session.isAdmin`, not just "is logged in".
- `src/lib/customer-session.ts` (`getCustomerSession()`) is the server-side helper (Server
  Components / Route Handlers) that reads and verifies the cookie.
- `src/context/customer-context.tsx` (`useCustomerAuth()`) is the client-side equivalent,
  seeded server-side via `initialCustomer` prop so there's no loading flicker.
- There is **no `Admin` model, no `/admin/login` route, no `/api/auth/*` routes** — all of
  that was deleted. If you see references to them anywhere, it's stale.
- New registrations (`/registro` → `POST /api/customer/register`) **always** get
  `isAdmin: false` (hardcoded server-side, never trusts client input for this). There is
  still no UI to promote a customer to admin — must be done directly in the SQLite DB, or
  via `scripts/set-admin-password.ts` for the one specific case of resetting the existing
  admin's password (see §5 security section — this script is how the placeholder
  `Ferre2026` password got rotated; the new password is intentionally unknown to any
  Claude session, the script runs entirely in the user's own terminal with hidden input).

### Data model (Prisma) — see `prisma/schema.prisma` for the literal source of truth
- `Category` (name, slug, description) → has many `Product`. **11 categories now**, not 5:
  the original `herramientas`, `pintura`, `plomeria`, `electrico`,
  `materiales-construccion`, plus 6 added during the MeLi import — `herreria`,
  `impermeabilizacion`, `jardin-agro`, `automotriz`, `seguridad-industrial`, and a catch-all
  `otros-varios` (see §5 for why/how these were decided).
- `Product` (**`meliItemId String? @unique`** — new field, added specifically to make the
  MeLi import idempotent/re-runnable and to let the ongoing image-backfill process
  cross-reference products; not every product will necessarily keep this forever but for
  now every one of the 1570 imported products has it set to its real MercadoLibre
  ITEM_ID, e.g. `"MLV798055406"` — name, description, priceUsd, originalPriceUsd?, stock,
  imageUrl?, active, featured, onSale, categoryId) → has many `OrderItem`. `featured`/
  `onSale` are manually curated booleans (checkboxes in `/admin/productos`, no
  sales-tracking algorithm yet — see §7). `originalPriceUsd` is only meaningful when
  `onSale` is true. **`imageUrl` is now set for all 1570 products** — see §7 item 1 for
  the (now-finished) backfill process, kept there for reference.
- `Order` (customerName, customerPhone snapshot fields, currency, exchangeRateAtOrder,
  totalUsd, status: pending|completed|cancelled, optional `customerId` FK) → has many
  `OrderItem`
- `OrderItem` (productId? nullable + productName snapshot, qty, unitPriceUsd) — snapshots
  product name/price at order time so historical orders don't change if the product is
  edited/deleted later. This `onDelete: SetNull` relation is what made the demo→real
  catalog swap safe: deleting the 20 demo products didn't fail or lose the 3 test orders,
  it just nulled their `productId` while keeping the snapshot fields intact.
- `Settings` — **single row**, always fetched with `findFirst()`. Holds exchangeRate,
  whatsappNumber, storeAddress, storePhone, contactEmail, and four optional social URLs
  (instagramUrl, facebookUrl, tiktokUrl, linkedinUrl, mercadolibreUrl). Icons for each
  social link only render if the URL is set (see `contact-section.tsx`) — never show a
  dead/fake link.
- `Customer` — see auth model above. `passwordHash` is never serialized in any API
  response (login/register build their JSON responses field-by-field, never spread the
  raw Prisma row) — verified during the security review, no leak.

### Currency system
All prices are stored/entered in USD. `src/context/currency-context.tsx` holds the
selected display currency (`USD` | `VES`, persisted to `localStorage`) and the exchange
rate (fetched server-side once, from `Settings.exchangeRate`, passed down as
`initialExchangeRate`). `src/lib/currency.ts` has the `formatPrice()`/`convert()` helpers.
The rate is admin-editable at `/admin/configuracion` — there is **no external FX API**,
by deliberate choice (see §5).

### Search
`src/lib/search.ts` — `normalizeSearchText()`, `searchWords()`, `matchesSearch()`. SQLite's
`contains` filter (and Prisma's `mode: "insensitive"`, which **doesn't exist for the SQLite
connector at all**, only Postgres/MySQL/Mongo) don't handle accented characters correctly —
searching "electrico" wouldn't find "Eléctrico". Fixed by normalizing both the query and
candidate product names in JS (`.normalize("NFD")` + strip combining diacritics + lowercase)
and matching word-by-word (all words must appear, any order — "circuitos tablero" matches
"Tablero Eléctrico 8 Circuitos"). Used by both `/productos` (public) and
`/api/admin/productos` (admin search box) — same pattern in both: fetch `{id, name}`
candidates already filtered by category, filter in JS, then do the real paginated query with
`id: { in: matchingIds }`. Deliberately **not** a denormalized `searchText` DB column —
with only 1570 products, computing at query time is simpler and can't drift out of sync.

### Checkout / WhatsApp flow
No payment gateway. `POST /api/orders` is **rate-limited** (see §5 security section — 5
requests per IP per 15 minutes, counting every attempt not just failures, because each
successful order decrements real stock). It validates the cart server-side (re-checks
product price/stock — never trusts client-submitted prices), creates the `Order` +
`OrderItem`s inside a transaction, decrements stock, then builds a WhatsApp deep link
(`src/lib/whatsapp.ts` → `buildInvoiceMessage()` + `buildWhatsappUrl()`) with the order
details and returns it to the client, which opens it in a new tab. If the customer is
logged in, `customerId` is attached automatically (read from the session cookie
server-side) so it shows up in `/mis-pedidos`. **Error handling**: a custom
`OrderValidationError` class marks the app's own controlled errors ("Stock insuficiente
para X", "Producto no disponible"); only those get their message shown to the client.
Anything else (e.g. a raw Prisma error) returns a generic message and logs the real detail
via `console.error` server-side — this used to leak `error.message` directly to the
client, found and fixed during the security review.

`src/lib/whatsapp.ts` also exports `DEFAULT_WHATSAPP_MESSAGE` — the prefilled text for the
floating WhatsApp button and the contact-section link (both were using a duplicated
hardcoded string before, now share this one constant): *"¡Hola! 👋 Vengo desde la página
web de Ferre NewLink y quisiera hacer una consulta sobre sus productos."*

The contact/quote form (`contact-section.tsx`, "Solicita tu cotización") follows the exact
same WhatsApp-redirect pattern client-side, without creating an `Order` record (it's a
lead, not a sale). It has no backend endpoint at all — confirmed during the security
review, so it's not a rate-limiting concern (nothing to flood on the server side).

### Cart UX
`src/context/cart-context.tsx` — `addItem()` **no longer auto-opens the cart drawer**. It
used to open a full-screen drawer on every add (jarring on mobile, felt like a forced
redirect). Now it only updates state and shows a toast (`src/components/cart-toast.tsx`,
bottom-center, auto-dismisses after 2.5s, "{producto} agregado al carrito"). The drawer only
opens when the user explicitly taps the cart icon/button. This applies uniformly (mobile and
desktop), not just mobile — an earlier iteration tried mobile-only via `matchMedia`, the
final version simplified to always-toast-never-auto-open.

## 5. Design decisions & why (chronological, so the reasoning is legible)

1. **WhatsApp checkout instead of a payment gateway.** The user's actual business process
   is WhatsApp-based order confirmation, not online payment. Building a fake "buy now"
   button that doesn't charge anyone would be misleading; building a real payment
   integration was never asked for.
2. **Admin-editable exchange rate instead of a live FX API.** Explicit user choice —
   fewer moving parts, no external dependency/cost, and VES parallel-market rates are
   often what small Venezuelan businesses actually track manually anyway.
3. ~~Demo products/categories at first, meant to be replaced.~~ **Superseded — see item 14,
   the real catalog is imported now.**
4. **Design import from claude.ai/design.** A full visual redesign (colors, fonts, all
   homepage sections, nav/footer) was imported from a Claude Design project
   (`Ferre NewLink.dc.html`) and re-implemented as real Next.js components with real data
   wired in instead of the design's mock data. Notable adaptations made **on purpose**,
   diverging from the source design:
   - The design's fake customer login/signup modal (which didn't actually do anything)
     was replaced with a real, working auth flow.
   - The design's "cotización" product-card button became a real "Agregar al carrito"
     wired to the real cart, since we already have a real cart system.
   - Generic lucide-react icons were swapped for hand-drawn brand-style SVG paths
     (`src/components/social-icons.tsx`) matching the design's original WhatsApp/
     LinkedIn/Instagram/MercadoLibre/TikTok icons, plus a Facebook one added later.
5. **Single unified login, not two.** Originally built as two separate systems (an `Admin`
   model + `/admin/login`, and a `Customer` model + `/ingresar`). The user found this
   confusing ("si me pongo a crear 2 botones se van a confundir") and asked explicitly to
   collapse it into one login where a flag on the customer account grants admin rights.
   This was a real migration: dropped the `Admin` table, added `Customer.isAdmin`,
   rewrote `proxy.ts`, deleted `/admin/login` and `/api/auth/*`. See §4 Auth model.
6. **Real branding replaced placeholders once the user provided it.** Original logo/hero
   image were AI-generated placeholders. The user later pasted the real logo (PNG,
   auto-cropped with `sharp` from a large transparent canvas down to the visible mark) and
   three real storefront photos, which now power the header/footer logo, the hero image,
   and the "Nosotros" section background. Real contact info (WhatsApp, Instagram, TikTok,
   Facebook, email, address) read off the physical store signage in those photos also
   replaced the placeholder Colombian phone/address used at project start.
7. **"Too white" feedback → deliberate background treatment.** Soft brand-colored gradient
   + blurred color blobs behind the Hero, a real photo (with dark gradient overlay) behind
   "Nosotros", light background tint on Ubicación/Contacto — deliberately not applied
   everywhere, to avoid looking cluttered.
8. **Cart drawer bug root cause (recurred once, see item 16).** `backdrop-filter` (the
   header's `backdrop-blur-md` on scroll) creates a new CSS containing block for `position:
   fixed` descendants — same as `filter`. Any `fixed`-positioned overlay rendered as a
   *child* of the header will behave like it's `absolute` to the header instead of the
   viewport once the header is scrolled and blurred. Fix: always render such overlays
   (`CartDrawer`, and later the mobile nav menu) as **siblings** of `<Header>`, never
   children — a Fragment (`<>...</>`) inside `Header` works for this without needing a
   portal.
9. **Homepage split from the full catalog once the real product import was planned.** The
   homepage shows only two manually curated sections, **Destacados** and **Ofertas**
   (`Product.featured`/`Product.onSale`, toggled via checkboxes in `/admin/productos`), and
   the full browsable/paginated/filterable catalog lives at `/productos`. **Why manual
   curation, not "top sellers by sales":** too few real orders exist to rank by sales.
   Permanent approach, not a stopgap — revisit only if the user asks for algorithmic
   ranking once real order volume exists.
10. **MercadoLibre icon is the real multi-color brand mark, not a `currentColor` glyph.**
    Special-cased in `social-icons.tsx` (`MercadoLibreLogo` component, `bg-white` wrapper
    instead of a brand color). `Settings.mercadolibreUrl` = `mercadolibre.com.ve/pagina/
    amaking`, confirmed correct against the live storefront.
11. **Real storefront-shelf photos as section backgrounds.** `public/categorias-bg.jpg` /
    `public/productos-bg.jpg`, flat `bg-brand-blue-dark/45` tint (not a heavy gradient —
    the user explicitly wanted the real photo to read through: "no tanto el fondo azul,
    quiero que vean que es una tienda real"), legibility via `drop-shadow-[...]` on text
    instead of darkening the photo further.
12. **Hero/Nosotros copy settled after a few rounds.** Misión lives in "Sobre Nosotros"
    (intro paragraph removed entirely per user request). Visión lives in the Hero, replacing
    the old marketing paragraph (not sitting beside it — this flip-flopped once before
    landing here). The "Sobre Nosotros" stat cards (**1500+ Productos, 1000+ Ventas en
    Mercado Libre, 6000+ Seguidores en Instagram, 45 Marcas aliadas**) and the Hero's third
    quick-stat are **fixed marketing numbers, not live DB counts** — deliberate choice.
    **Now that the real catalog is imported (1570 products), "1500+ Productos" is worth
    revisiting as a live `Product.count()`** — flagged by the user as worth doing at this
    point, not done yet, see §7.
13. **Header "Productos" nav link was a dead anchor — root-caused and fixed.** Left over
    from before the homepage catalog was split into Destacados/Ofertas — `/#productos`
    pointed at an anchor that no longer exists. Fixed to point straight at `/productos`.
14. **MercadoLibre catalog import — the big one.** Replaced all 20 demo products with the
    store's real MeLi catalog. Full story:
    - **The MeLi Developers API path was abandoned.** The Developers panel for Venezuela
      (developers.mercadolibre.com.ve) never worked, and even the public unauthenticated
      `/items/{id}` API returns `403 PA_UNAUTHORIZED`. Confirmed live, repeatedly, across
      several sessions — not worth waiting on further.
    - **The actual source of truth: a manual bulk export.** The user exported
      `Publicaciones-2026_08_07-00_07.xlsx` directly from MeLi's Central de Vendedores
      (bulk publication editor) — no API needed. Real structure (verified by inspection,
      not assumed): sheet named `"Publicaciones"`, first 3 rows are template
      instructions/headers (filter by `ITEM_ID` matching `/^MLV\d+/` to get real rows),
      columns `FAMILY_ID, ITEM_ID, VARIATION_ID, SKU, TITLE, VARIATIONS, QUANTITY, PRICE,
      CURRENCY_ID, STATUS, CATEGORY`. 1570 real rows, all `STATUS="Activa"`,
      `CURRENCY_ID="US$"` (no currency conversion needed), `ITEM_ID` unique per row (no
      variation-grouping to worry about — each row is one product).
    - **Category mapping: keyword classifier, not manual per-row.** 337 distinct MeLi
      category strings were classified via regex keyword rules
      (`scripts/import-meli-catalog.ts` has the exact rule list) into the 11 site
      categories. A **condensed mapping table was built as an HTML artifact and reviewed
      by the user before anything touched the DB** — this is the pattern to repeat for any
      future large reclassification: don't ask for line-by-line approval, build the
      grouped summary, let them approve/adjust once. Products that don't fit any hardware
      rubric (kitchenware, home decor, fishing/nautical gear, pet supplies, office
      supplies — the seller's MeLi shop sells meaningfully beyond "ferretería") went to
      the new **`otros-varios`** category rather than being excluded, per user's explicit
      choice. A residual ~22 products with no clear MeLi category (either MeLi's own
      generic "Productos no clasificados" or a genuinely blank category cell) also went to
      `otros-varios`.
    - **Demo data removal was verified safe before deleting anything.** Checked which demo
      products had `featured`/`onSale` set (3 and 2 respectively — flagged to the user that
      Destacados/Ofertas would go empty until real products get curated) and whether any
      `Order`/`OrderItem` referenced demo products (yes, all 3 test orders did) — confirmed
      `OrderItem.productId`'s `onDelete: SetNull` + the `productName` snapshot field meant
      deleting was 100% safe, no data loss, no failure risk. Deleted all 20, then imported.
    - **Images were deliberately deferred, not solved at import time** — see the dedicated
      section below, this became its own multi-session effort.
    - **`description` is currently just a copy of `TITLE`** — the Excel has no separate
      description field. Explicit interim choice, to be enriched later "desde otro archivo"
      the user mentioned having (specs/brand/model) but hasn't provided yet — see §7.
15. **Security review + hardening.** A manual, evidence-based security audit (the
    `/security-review` skill needs a git-diff base and doesn't fit a fresh/full-codebase
    audit well, so this was done by direct code reading instead) covered: env var/secret
    exposure, password hashing, rate limiting, API data exposure, input validation, table
    ACLs, route protection, error message safety, dev/debug endpoints, logging. Two
    high-severity findings got fixed immediately (see the dedicated section below); two
    more (medium: admin API routes have no per-route auth check, only the shared proxy;
    low: client components receive full raw Prisma rows instead of a selected subset) were
    **deliberately left for later**, not urgent enough to block anything.
16. **Mobile UI regression chain — several rounds of "fix X, which breaks Y".** Worth
    understanding as a sequence because the root causes recur:
    - Mobile hamburger menu added to the header (previously there was **no way to reach
      Categorías/Productos/Nosotros/Ubicación on mobile at all** — genuine bug, not a
      redesign ask).
    - Adding the hamburger button shifted available header width, which pushed the
      right-side group (currency toggle + cart) into wrapping onto a second row on
      mobile — this is what "pushed the hero down" (the hero's `padding-top` is a fixed
      value sized for a single-row header). Fixed with `flex-nowrap` + tighter responsive
      gaps, not by touching the hero's padding itself.
    - The mobile menu panel itself broke (rendered transparent/squished) **because it was
      rendered as a child of `<header>`**, which gets `backdrop-blur-md` when scrolled —
      this is the exact same containing-block bug as item 8, reintroduced by putting the
      new menu inside `<header>` instead of as a sibling. Fixed the same way: moved to be
      a sibling via a Fragment.
    - Fixing the mobile hamburger's spacing then broke the **desktop** header (logged-in
      admin state: nav + currency + "Panel admin" + logout + Carrito together overflowed
      at laptop-ish widths ~900-1000px and dropped Carrito to a second row) — the original
      `sm:flex-wrap` was still there as a leftover safety net that no longer made sense
      once nowrap was needed elsewhere. Fixed with responsive gap steps
      (`gap-2 sm:gap-3 lg:gap-6`) plus `whitespace-nowrap` + `shrink-0` on every text
      item, verified at 900/1024/1440px.
    - **Lesson banked here for future layout work**: any time header/nav spacing changes,
      re-check both the narrowest mobile width AND the "laptop" 900-1024px range with a
      logged-in admin session (more nav items than a logged-out visitor) — that specific
      range broke twice in this project already.
    - Admin panel (`/admin/*`) had **zero mobile layout** — the persistent 256px sidebar
      ate almost the whole viewport. Fixed with the same hamburger-drawer pattern as the
      public site (`admin-sidebar.tsx`), plus the container flipped from `flex` (row) to
      `flex flex-col md:flex-row` so `<main>` gets full width on mobile.
    - Admin products table got `overflow-x-auto` (was `overflow-hidden`, silently clipping
      columns instead of letting you scroll to them) + `min-w-[760px]` on the table so it's
      clearly scrollable rather than just cramped.
17. **Real product images — MercadoLibre's picture URLs are not derivable from ITEM_ID.**
    Extensively tested and conclusively ruled out before landing on the working approach:
    - Confirmed live (multiple tests, with evidence) that constructing a picture CDN URL
      from a product's own `ITEM_ID` **does not work** — MeLi picture filenames embed a
      **different, unrelated internal ID** (13-14 digits) than the seller-facing `ITEM_ID`
      (9-10 digits), even though both are formatted like `MLV<digits>` and look
      superficially interchangeable. Do not attempt this shortcut again, it was checked
      thoroughly.
    - Scraping the public product page HTML is blocked by an anti-bot wall
      (`account-verification` redirect) even with realistic browser headers/cookies. The
      MeLi API (`api.mercadolibre.com/items/{id}`) is blocked too (403, unauthenticated).
      The image CDN itself (`http2.mlstatic.com`) is **not** blocked (plain `curl` gets a
      real file) — the blocker is only in *discovering* which picture ID belongs to which
      product, not in downloading it once known.
    - **The working technique, found by the user**: open MeLi's "Editor Masivo" (bulk
      publication editor) in a real logged-in browser session, and use the browser's own
      **"Guardar página como > Página web completa"**. This is a completely legitimate,
      non-scraping technique — it's the browser saving what the user's own authenticated
      session already loaded. It produces an `.html` file + a sibling `..._files/` folder
      containing the real product images.
    - **Why the image filenames alone aren't enough**: same problem as above, the filename
      embeds the wrong (internal, non-seller-facing) ID. **The correct cross-reference
      lives in the HTML itself**: every row has
      `<img alt="image-MLV798055406" aria-label="image-MLV798055406"
      src="./Editor masivo_files/910594-....jpg">` — the `alt`/`aria-label` attribute
      carries the real `ITEM_ID` (verified against the product's title in the same row).
      `scripts/match-meli-images.ts` parses the `.html`, not the image filenames, for
      exactly this reason.
    - See §7 item 1 for the full process and script behavior/flags — the backfill this
      technique powered is now finished (1570/1570), kept there for reference.

## 6. Code conventions actually followed in this codebase

- **Server Components fetch data directly via Prisma** (no API round-trip needed for the
  page's own render) — e.g. `(store)/page.tsx`, `producto/[id]/page.tsx`,
  `mis-pedidos/page.tsx`. API routes exist for **client-triggered mutations/fetches**
  (forms, admin CRUD tables, cart checkout), not for data the page itself needs on load.
- **Every API route validates its body with `zod`** before touching Prisma. See any file
  under `src/app/api/**/route.ts` for the pattern: define a schema, `safeParse`, return
  400 with a Spanish error message on failure. (GET query params like `?q=`/`?categoria=`
  are the one exception — not zod-validated, but safe because they flow through Prisma's
  parameterized query builder, never string-concatenated SQL.)
- **Client-side "add to cart" always re-validates on the server.** Never trust a
  client-submitted price — `api/orders` re-reads `Product.priceUsd`/`stock` from the DB.
- **Errors returned to the client are never raw.** Only app-defined "controlled" error
  types (e.g. `OrderValidationError` in `api/orders`) get their `.message` shown to the
  user. Anything unexpected returns a generic message and gets `console.error`'d
  server-side instead. Verified empirically (not just by code reading) that Next 16's
  production route handlers already return an empty body on uncaught exceptions by
  default — this convention is belt-and-suspenders on top of that default, not a
  workaround for a leaky default.
- **Rate limiting**: `src/lib/rate-limit.ts`, in-memory, no new dependency. Two usage
  patterns depending on the threat model — `recordFailedAttempt()` + `clearAttempts()` for
  login/register (only failures count, resets on success — don't punish legitimate users
  who mistype a password once), vs. `recordAttempt()` for orders (**every** attempt counts,
  success included, because a successful order is exactly what does the damage —
  decrementing real stock). `isRateLimited(key, context)` takes a `context` string purely
  for the log line, and **logs via `console.warn` itself** whenever a block actually
  triggers — callers don't need to remember to log separately.
- **Secrets have no hardcoded fallback.** `JWT_SECRET` throws at module load if unset —
  established as the pattern after finding (and removing) a hardcoded dev fallback during
  the security review. Don't reintroduce a `?? "some-default"` for any secret.
- **One-off / bulk-operation scripts live in `scripts/`, run via `npx tsx scripts/
  <name>.ts`, never inside the running app.** Each imports `"dotenv/config"` first (so
  `process.env.DATABASE_URL`/etc. are available outside Next's own env loading) then
  `@/lib/prisma`. Established scripts: `inspect-demo-data.ts` (read-only),
  `delete-demo-products.ts`, `import-meli-catalog.ts`, `set-admin-password.ts` (interactive,
  hidden input, run by the user themselves — see §4 Auth model), `match-meli-images.ts` and
  `batch-match-meli-images.ts` (the now-finished image backfill tools, see §7 item 1). Diagnostic-only throwaway scripts prefixed
  `_` were used repeatedly during investigation and **deleted immediately after use** — if
  you see a `scripts/_something.ts`, it shouldn't be there, clean it up.
- **Destructive bulk scripts default to dry-run.** `match-meli-images.ts` requires an
  explicit `--copy` flag to actually write; without it, it only prints a diagnostic summary.
  It also defaults to **never overwriting** a product that already has an `imageUrl` (the
  user's MeLi filters produce overlapping/repeated batches often) — `--force` is required
  to intentionally replace an existing image. Follow this default-safe/explicit-override
  pattern for any future bulk-write script.
- **Context providers are layered in `src/app/providers.tsx`**, in this nesting order:
  `SiteSettingsProvider` → `CustomerProvider` → `CurrencyProvider` → `CartProvider`. All
  four are seeded with server-fetched initial values (no client-side loading state for
  session/settings/currency) — see `(store)/layout.tsx` for how each is fetched.
  `useSiteSettings()`, `useCustomerAuth()`, `useCurrency()`, `useCart()` are the
  corresponding hooks; each throws if used outside its provider (fail loud, not silent).
- **Scroll-reveal animation pattern**: `src/hooks/useReveal.ts` exports `useReveal()`
  (IntersectionObserver, fires once) and `revealStyle(revealed, delay, distance)` (returns
  an inline `style` object with opacity/transform/transition). Used across every homepage
  section for the fade-up-on-scroll effect, with per-item `delay` for staggering
  (`i * 0.08`-style).
- **Tailwind v4 arbitrary values are used liberally** (`text-[clamp(28px,3.2vw,40px)]`,
  `px-[18px]`, decimal spacing like `gap-4.5`) to hit exact design pixel values — this is
  intentional, Tailwind v4's spacing scale is a dynamic `calc()` formula so decimals like
  `4.5` are valid, not typos.
- **Any `fixed`-positioned overlay must be a sibling of `<Header>`, never a child.** The
  header's `backdrop-blur-md` (applied on scroll) creates a CSS containing block for
  `position: fixed` descendants, which breaks full-viewport overlays. Hit this twice
  already (`CartDrawer`, then the mobile nav menu) — see §5 items 8 and 16.
- **Brand color tokens are CSS custom properties**, not literal Tailwind colors — defined
  once in `src/app/globals.css` under `@theme inline` (`--color-brand-orange`,
  `--color-brand-blue`, `--color-brand-ink`, `--color-brand-bg2`, etc., all in `oklch()`).
  Change the palette in exactly one place; every component already references the token
  names (`bg-brand-orange`, `text-brand-ink-soft`, ...).
- **No comments unless explaining a non-obvious "why"** (e.g. the `eslint-disable-next-line
  react-hooks/set-state-in-effect` comments explain *why* the pattern is intentionally
  hydration-safe, not *what* the line does).
- **Spanish throughout** — all UI copy, error messages, and form labels are in Spanish
  (the business's language), including server-side log lines from `rate-limit.ts`/`auth.ts`
  now that logging exists. Code identifiers (variables, functions, files) are in English.
  Keep this split when adding anything new.
- **Money is stored/passed around as `Float` in USD**, never as VES — conversion only
  happens at display time via `useCurrency().format()`.
- **Never write literal Unicode combining-diacritic characters or raw control-character
  bytes directly into a source file via a tool call in this environment** — they get
  mangled silently (confirmed twice: once in `set-admin-password.ts`'s hidden-input key
  handling, once in `search.ts`'s accent-stripping regex). Use numeric escapes instead
  (`String.fromCharCode(0x0300)`, `"\u0003"` as literal backslash-u-escape text) — always
  verify with `cat -A` on the written file if a regex/string involves non-printable or
  accented characters, don't trust the Read tool's rendering alone.

## 7. Pending / next steps

Roughly in the order they'd probably matter to the user:

1. ~~Real product images — backfill in progress.~~ **DONE (2026-08-11): 1570/1570
   products now have a real photo.** Verified two ways: `Product.count({ where:
   { imageUrl: { not: null } } })` returned 1570, and a live check in the browser
   (`/productos?q=generador`) confirmed all 8 matching cards loaded their real
   `/uploads/products/<id>.jpg` via `/_next/image` with 200 OK, not the placeholder.
   Kept here for reference in case a similar bulk-image-matching problem comes up again:
   - **The technique** (see §5 item 17 for why it works this way): the user navigates
     MeLi's Editor Masivo, uses the browser's "Guardar página como > Página web completa"
     on each page/filtered view, producing an `.html` + a sibling `..._files/` folder with
     the real images. `scripts/match-meli-images.ts` parses the `.html`'s `alt="image-
     MLV..."` attributes (the only place the real seller-facing `ITEM_ID` appears — image
     filenames themselves embed a different, unrelated internal MeLi id) and cross-
     references against `Product.meliItemId`. Single-lote usage:
     ```
     npx tsx scripts/match-meli-images.ts "<ruta al .html>"          # diagnostico primero
     npx tsx scripts/match-meli-images.ts "<ruta al .html>" --copy   # aplica
     ```
   - **`scripts/batch-match-meli-images.ts`** — added partway through once the user
     started sending several lotes (.html + `..._files`) at once instead of one per
     message. Same exact matching logic, but takes a **root folder** instead of a single
     `.html`: finds every `.html` recursively inside it (works whether each lote is in its
     own subfolder or all dropped together), processes them in order re-querying the DB
     before each one (so a product resolved by lote 1 correctly shows as "ya tenia imagen"
     if lote 2 brings it again — Editor Masivo filters overlap often), and writes a
     `resumen-<timestamp>.txt` with the full per-lote/unmatched breakdown next to the
     lotes themselves.
     ```
     npx tsx scripts/batch-match-meli-images.ts "<carpeta con los lotes>"          # diagnostico
     npx tsx scripts/batch-match-meli-images.ts "<carpeta con los lotes>" --copy   # aplica
     ```
   - **The last 4 stragglers** weren't in any Editor Masivo export the user had handy, so
     they were matched by hand: the user pasted product photos found directly on MeLi, and
     images were assigned by exact `meliItemId` with a one-off throwaway script (written,
     run, and deleted immediately after — per the `scripts/_*.ts` convention). One of the
     four (a generator) had two look-alike MeLi listings; resolved by matching the exact
     `ITEM_ID` (`MLV845412912`) rather than guessing from title/photo similarity — the
     general lesson: **when two MeLi listings look identical, the stored `meliItemId` is
     the tiebreaker, not visual/title similarity.**
   - **Gotchas hit and handled by both scripts** (don't need to be re-solved, just be
     aware if this pattern recurs): the browser sometimes renames the `..._files` folder
     inconsistently between saves — both scripts index images by **filename only**,
     recursively across sibling folders, not by the exact path the HTML expects. Neither
     script **ever overwrites** a product that already has an image unless `--force` is
     passed (the user's MeLi filters produced overlapping/repeated batches often — this
     is why running the batch script's dry-run first was still worth doing every time,
     even near the end). An unusually low match rate in one batch (0/50, seen once) turned
     out to mean the Editor Masivo's status filter had drifted off "Activas", not a script
     bug. Unmatched items in general almost always meant "published after the Aug 7
     export," confirmed repeatedly against the original Excel.
2. **`description` field needs real enrichment.** Currently every imported product's
   `description` is just a copy of its MeLi `TITLE` (no separate description existed in
   the source Excel). The user mentioned having another file with specs (brand, model,
   etc.) to enrich this later but hasn't provided it yet.
3. **"1500+ Productos" stat is now stale and worth making live.** §5 item 12 — now that
   the real count is 1570 (close, but not the same, and will keep drifting as images/data
   get refined), the user flagged this as worth switching to a live `Product.count()`.
   Not done yet.
4. **Facebook URL still unverified.** `facebookUrl` was a best guess based on the
   `@ferrenewlink` handle pattern — worth the user double-checking it resolves to their
   real page. (`mercadolibreUrl` is confirmed correct.)
5. **Deployment/hosting — Railway, decided and in progress.** SQLite vs. Postgres is
   **resolved: Postgres**, via Railway's own managed Postgres service. What's done:
   - `src/lib/prisma.ts` now uses `@prisma/adapter-pg` (`PrismaPg`) instead of
     `@prisma/adapter-better-sqlite3`. The old SQLite migrations were moved to
     `prisma/migrations-sqlite-archive/` (kept for history, not applied anymore) and a
     fresh baseline migration `prisma/migrations/20260811174900_init_postgres/` was
     created against the Postgres schema. `scripts/export-sqlite-data.ts` /
     `scripts/import-postgres-data.ts` handle moving the real 1570-product catalog +
     orders data across (dump from the old SQLite `dev.db`, load into Postgres).
   - **`DATABASE_URL` is set in Railway** — auto-generated by Railway when the Postgres
     service was provisioned and linked to the app service. Not something to set manually.
   - **`JWT_SECRET` must be set in Railway's environment variables** — the app will not
     start without it (see §5 security section). A production value was generated once
     during an earlier session but is now **considered compromised** because it was posted
     in chat — the user was told to generate their own via `openssl rand -hex 64` (or
     `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) directly
     in their own terminal and paste it straight into Railway, never through chat.
     **Whoever picks this up next should not assume a JWT_SECRET value exists anywhere
     retrievable — it doesn't, by design.**
   - **Build step fixed**: `package.json`'s `build` script is now `"prisma generate &&
     next build"` — a first Railway deploy failed with a module-not-found on
     `@/generated/prisma/client` because that folder is gitignored (by design, regenerated
     from the schema) and nothing was regenerating it during the Railway build. Root cause
     confirmed by checking both `package-lock.json` (was fine, `@prisma/adapter-pg` was
     already present) and the build script (was just `"next build"`, no generate step).
   - **Migrations now run automatically on deploy via `railway.json`** (`deploy.
     preDeployCommand: "npx prisma migrate deploy"`). Chosen over baking `prisma migrate
     deploy` into the `start` script because Railway's Pre-Deploy Command only runs once
     per actual deploy (not on every container restart/crash-loop), and a failed migration
     blocks the deploy cleanly (old version keeps serving) instead of crash-looping the
     running container. This was needed because `migrate deploy` had only ever been run
     against Neon (a throwaway test Postgres used mid-migration), never against the real
     Railway Postgres — first Railway deploy after the DB switch would otherwise have
     booted against an empty schema.
   - Still open: nobody has confirmed a real deploy has gone green end-to-end yet with all
     of the above in place (build fix + preDeployCommand + real `DATABASE_URL`/
     `JWT_SECRET`) — verify on the next deploy and update this section once confirmed.
6. **Admin password already rotated by the user — nobody (including any Claude session)
   knows the current value.** This is intentional, not a gap — see §4 Auth model and
   `scripts/set-admin-password.ts`. If admin access is ever needed for a fresh session,
   ask the user to log in, don't attempt to guess/reset it unprompted.
7. **Two security findings deliberately left open (not urgent):**
   - **Medium**: none of the `/api/admin/*` route handlers check `session.isAdmin`
     themselves — they rely entirely on `src/proxy.ts`'s matcher. Works correctly today,
     but is a single point of failure if the matcher config ever changes or a route gets
     added outside the `/api/admin/` prefix by mistake.
   - **Low**: `ProductCard` and `ProductsSection` (client components) receive the full raw
     Prisma `Product` row as a prop instead of a selected subset — leaks `meliItemId`,
     `categoryId`, timestamps into the RSC payload even though unused in the UI. Not
     sensitive data, just unnecessary exposure.
8. **`codebase-memory-mcp` could not be installed.** Attempted per user request; failed
   because the tool's own latest GitHub release archive is missing a file that its own
   `install.ps1` requires — an upstream packaging bug. Could retry later if they fix their
   release.
9. **Minor cleanup**: `public/uploads/brand/` still holds the 4 original full-resolution
   images the user pasted (source material for the cropped logo / resized hero/about
   photos) — harmless to keep for reference but not referenced by any page.
10. **Uncommitted changes exist.** Git was initialized this session with one commit
    covering the state at that point. Everything since (the search fix, the security
    hardening, all the image-matching work, the migration for `meliItemId`, etc.) is
    **uncommitted** as of this writing — `git status` will show a long list of modified/
    new files. Not committed because nobody's asked for a commit yet; do a `git status`
    /`git diff` pass before committing to make sure nothing unexpected (like a stray
    `scripts/_*.ts` diagnostic file) is included.
11. Two unrelated tool installs were also done in the parent workspace directory
    (`C:\Users\Usuario\Desktop\ClaudeCode`, one level up from this project) at the user's
    request: **spec-kit** (`.specify/`, `/speckit-*` skills) and **ui-ux-pro-max-skill**
    plus **emilkowalski/skills** (animation/design skills, all under the workspace's
    `.claude/skills/`). These are dev-tooling additions, not part of the app itself.

## 8. Real business info currently in the database (for reference, not secret)

- WhatsApp / primary phone: `+58 416-4202795`
- Address: Local Nro. 178, Avenida Los Cedros, Maracay 2103, Aragua, Venezuela
- Email: ventasonline@ferrenewlink.com
- Instagram/TikTok: `@ferrenewlink`
- MercadoLibre: seller nickname **"amaking"**, site **MLV** (Venezuela),
  `mercadolibre.com.ve/pagina/amaking` — confirmed correct.
- Hours (hardcoded in `location-section.tsx`, not in `Settings` — update there if they
  change): Mon–Fri 8am–5pm, Sat 8am–2pm, closed Sunday
- Homepage "Sobre Nosotros" stats (`about-section.tsx`) are all fixed marketing numbers,
  not live DB counts: 1500+ Productos, 1000+ Ventas en Mercado Libre, 6000+ Seguidores en
  Instagram, 45 Marcas aliadas. **Worth revisiting "1500+ Productos" now** — see §7.
- Admin login is via `/ingresar` (unified system), email `admin@ferrenewlink.com`. The
  password is **no longer** the placeholder `Ferre2026` — it was rotated by the user via
  `scripts/set-admin-password.ts` and is not known to any Claude session (see §7 item 6).
