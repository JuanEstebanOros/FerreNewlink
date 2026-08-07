@AGENTS.md

# Ferre NewLink — Project State

> **Read this file first in any new session.** It is the authoritative source of truth for
> where this project stands. It was written to survive a full context reset — nothing here
> should require re-deriving from conversation history.

## 1. What this is

A real e-commerce + admin-panel web app for **Ferre NewLink**, an actual hardware store
(ferretería) in **Local Nro. 178, Avenida Los Cedros, Maracay 2103, Aragua, Venezuela**.
This is not a demo/portfolio project — the owner (the user) is actively using it and has
provided real branding assets, real contact info, and real feedback across several sessions.

The store sells herramientas, materiales de construcción, pintura, plomería y eléctrico.
Customers browse the catalog, add to cart, and check out by being redirected to WhatsApp
with a prefilled order summary (no real payment processing — this is intentional, see
§5 Design Decisions).

Prices are stored in USD and displayed to the customer in **USD or Venezuelan Bolívares
(VES)** via an admin-editable exchange rate.

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.2.11**, App Router, Turbopack | Newer than typical training data — see §3 |
| Language | TypeScript, React 19.2.4 | |
| Styling | **Tailwind CSS v4** (`@theme inline` tokens in `globals.css`) | No `tailwind.config.js` — v4 uses CSS-based config |
| Fonts | `next/font/google`: **Space Grotesk** (headings, `font-heading`), **Public Sans** (body) | Loaded in `src/app/(store)/layout.tsx`, scoped to the store route group |
| Database | **SQLite** via file `ferre-newlink/dev.db` | Local file, not a hosted DB |
| ORM | **Prisma 7.9.0** | Requires a driver adapter even for SQLite — see §3 |
| Auth | Custom JWT (`jose`) in an httpOnly cookie + `bcryptjs` password hashing | Single unified system, see §5 |
| Validation | `zod` on every API route body | |
| Icons | `lucide-react` v1.26 (brand icons like Instagram/LinkedIn were **removed** in this version — see `social-icons.tsx`) | |
| Charts | `recharts` (admin Reportes page) | |
| Package manager | npm | |

Run it: `npm run dev` inside `ferre-newlink/` (or via the root `.claude/launch.json` config
named `ferre-newlink-dev`, port 3000). Seed: `npx prisma db seed`. Migrate: `npx prisma
migrate dev --name <name>`.

**This directory is not a git repository.** No version control has been set up. Worth
doing before this goes further, but nobody has asked for it yet — don't init git
unprompted.

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
- **`prisma migrate dev` refuses to run non-interactively** if it detects a destructive
  change (e.g. dropping a non-empty table) — it wants a confirmation prompt that never
  comes in a scripted/agent environment. Workaround used here: empty the table first
  (`DELETE FROM X`) so Prisma sees no data-loss risk, then re-run the migration.
- **Turbopack/HMR can get into a corrupted state** after many rapid edits, throwing
  "module factory is not available" errors. Fix: stop the dev server, `rm -rf .next`,
  restart. Do this if you see weird build errors that don't match the actual code.

## 4. Architecture

### Route groups
- **`src/app/(store)/`** — the public-facing site. Shares one layout
  (`(store)/layout.tsx`) that loads the two Google Fonts, fetches `Settings` +
  categories + the customer session server-side, and wraps everything in `<Providers>`.
  Pages: `page.tsx` (home — Hero, Categorías, **Destacados** + **Ofertas** curated
  sections only, Nosotros, Ubicación, Contacto), `productos/` (full paginated catalog,
  24/page, filter by `?categoria=`/`?q=`/`?pagina=`), `producto/[id]/`, `checkout/`,
  `registro/`, `ingresar/`, `mis-pedidos/`. The homepage does **not** list the full
  catalog — that was deliberately moved to `/productos` once the catalog grew past a
  couple dozen demo items (see §5.9). `src/components/pagination.tsx` is the reusable
  pager, used by `/productos` (server-rendered, `?pagina=`) and independently
  reimplemented client-side in `/admin/productos` (same 24/page size).
- **`src/app/admin/(dashboard)/`** — the admin panel. `layout.tsx` calls
  `getCustomerSession()` and redirects to `/ingresar` unless `session.isAdmin` is true.
  Pages: dashboard (`page.tsx`), `categorias/`, `productos/`, `pedidos/`, `reportes/`,
  `configuracion/`.
- **`src/app/api/`** — route handlers. `api/orders` (public checkout), `api/customer/*`
  (register/login/logout/orders — public), `api/admin/*` (categorias/productos/pedidos/
  configuracion/upload — gated by `proxy.ts`).

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
- `src/proxy.ts` reads that same cookie to gate `/admin/*` and `/api/admin/*` — it checks
  `session.isAdmin`, not just "is logged in".
- `src/lib/customer-session.ts` (`getCustomerSession()`) is the server-side helper (Server
  Components / Route Handlers) that reads and verifies the cookie.
- `src/context/customer-context.tsx` (`useCustomerAuth()`) is the client-side equivalent,
  seeded server-side via `initialCustomer` prop so there's no loading flicker.
- There is **no `Admin` model, no `/admin/login` route, no `/api/auth/*` routes** — all of
  that was deleted. If you see references to them anywhere, it's stale.
- New registrations (`/registro` → `POST /api/customer/register`) **always** get
  `isAdmin: false`. There is currently no UI to promote a customer to admin — it must be
  done directly in the SQLite DB (`UPDATE Customer SET isAdmin = 1 WHERE email = ...`).

### Data model (Prisma) — see `prisma/schema.prisma` for the literal source of truth
- `Category` (name, slug, description) → has many `Product`
- `Product` (name, description, priceUsd, originalPriceUsd?, stock, imageUrl?, active,
  featured, onSale, categoryId) → has many `OrderItem`. `featured`/`onSale` are manually
  curated booleans (checkboxes in `/admin/productos`, no sales-tracking algorithm yet — see
  §7). `originalPriceUsd` is only meaningful when `onSale` is true; the UI shows it
  struck-through next to `priceUsd`. `priceUsd` is always the actual charged price —
  `originalPriceUsd` is display-only, checkout logic never reads it.
- `Order` (customerName, customerPhone snapshot fields, currency, exchangeRateAtOrder,
  totalUsd, status: pending|completed|cancelled, optional `customerId` FK) → has many
  `OrderItem`
- `OrderItem` (productId? nullable + productName snapshot, qty, unitPriceUsd) — snapshots
  product name/price at order time so historical orders don't change if the product is
  edited/deleted later
- `Settings` — **single row**, always fetched with `findFirst()`. Holds exchangeRate,
  whatsappNumber, storeAddress, storePhone, contactEmail, and four optional social URLs
  (instagramUrl, facebookUrl, tiktokUrl, linkedinUrl, mercadolibreUrl). Icons for each
  social link only render if the URL is set (see `contact-section.tsx`) — never show a
  dead/fake link.
- `Customer` — see auth model above.

### Currency system
All prices are stored/entered in USD. `src/context/currency-context.tsx` holds the
selected display currency (`USD` | `VES`, persisted to `localStorage`) and the exchange
rate (fetched server-side once, from `Settings.exchangeRate`, passed down as
`initialExchangeRate`). `src/lib/currency.ts` has the `formatPrice()`/`convert()` helpers.
The rate is admin-editable at `/admin/configuracion` — there is **no external FX API**,
by deliberate choice (see §5).

### Checkout / WhatsApp flow
No payment gateway. `POST /api/orders` validates the cart server-side (re-checks product
price/stock — never trusts client-submitted prices), creates the `Order` + `OrderItem`s
inside a transaction, decrements stock, then builds a WhatsApp deep link
(`src/lib/whatsapp.ts` → `buildInvoiceMessage()` + `buildWhatsappUrl()`) with the order
details and returns it to the client, which opens it in a new tab. If the customer is
logged in, `customerId` is attached automatically (read from the session cookie
server-side) so it shows up in `/mis-pedidos`.

The contact/quote form (`contact-section.tsx`, "Solicita tu cotización") follows the exact
same WhatsApp-redirect pattern client-side, without creating an `Order` record (it's a
lead, not a sale).

## 5. Design decisions & why (chronological, so the reasoning is legible)

1. **WhatsApp checkout instead of a payment gateway.** The user's actual business process
   is WhatsApp-based order confirmation, not online payment. Building a fake "buy now"
   button that doesn't charge anyone would be misleading; building a real payment
   integration was never asked for.
2. **Admin-editable exchange rate instead of a live FX API.** Explicit user choice —
   fewer moving parts, no external dependency/cost, and VES parallel-market rates are
   often what small Venezuelan businesses actually track manually anyway.
3. **Demo products/categories at first, meant to be replaced.** The user explicitly chose
   "productos de ejemplo" over waiting for a real catalog. **As of now, none of the 20 demo
   products have real photos or accurate real names/prices — this is the single biggest
   pending gap, see §7.**
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
   image were AI-generated placeholders (explicitly "don't worry about the logo, I'll send
   it later"). The user later pasted the real logo (PNG, auto-cropped with `sharp` from a
   large transparent canvas down to the visible mark) and three real storefront photos,
   which now power the header/footer logo, the hero image, and the "Nosotros" section
   background. Real contact info (WhatsApp, Instagram, TikTok, Facebook, email, address)
   read off the physical store signage in those photos also replaced the placeholder
   Colombian phone/address that was used at project start (before it was clear the
   business is in Venezuela, not Colombia).
7. **"Too white" feedback → deliberate background treatment.** The user disliked how flat/
   white the page looked. Fix: soft brand-colored gradient + blurred color blobs behind
   the Hero, a real photo (with dark gradient overlay for legibility) behind "Nosotros"
   instead of flat navy, and a light background tint on Ubicación/Contacto to break up the
   monotony — deliberately not applied everywhere, to avoid looking cluttered.
8. **Cart drawer bug root cause.** The cart drawer briefly rendered squished/clipped
   inside the header's height instead of covering the full viewport. Root cause:
   `backdrop-filter` (the header's `backdrop-blur-md` on scroll) creates a new CSS
   containing block for `position: fixed` descendants — same as `filter`. The
   `<CartDrawer />` was originally rendered as a child of `<Header>`. Fix: moved
   `<CartDrawer />` up to be a sibling of `<Header>`/`<Footer>` in the store layout. If you
   ever see a `fixed`-positioned overlay behaving like it's `absolute` to some ancestor,
   check for `backdrop-filter`/`filter`/`transform` on an ancestor first.
9. **Homepage split from the full catalog once the real ~2000-product import was planned.**
   The homepage used to render 2-per-category as a mini "catálogo" grid — fine for 20 demo
   products, not for ~2000 real ones. Now the homepage shows only two manually curated
   sections, **Destacados** and **Ofertas** (`Product.featured`/`Product.onSale`, toggled
   via checkboxes in `/admin/productos`), and the full browsable/paginated/filterable
   catalog lives at `/productos`. **Why manual curation, not "top sellers by sales":** at
   the time this was built there were only 3 orders in the DB (all test data) — nowhere
   near enough signal to rank by real sales. Manual curation was chosen as the permanent
   approach for now, not a stopgap; revisit only if the user asks for an algorithmic
   "most sold" ranking once real order volume exists.
10. **MercadoLibre icon is the real multi-color brand mark, not a `currentColor` glyph.**
    The other five "Síguenos" icons (`social-icons.tsx`) are single-path SVGs that inherit
    `currentColor` so they sit as white glyphs inside a solid `bg-brand-orange`/
    `bg-brand-blue` circle. The user supplied MercadoLibre's actual logo file (multi-path,
    fixed brand colors `#2d3277`/`#ffe600`/white, non-square viewBox), which can't be
    forced through that pattern without breaking the brand colors. It's special-cased:
    `SocialIcon` renders a dedicated `MercadoLibreLogo` component for that platform, and
    its wrapper `<a>` in `contact-section.tsx` uses `bg-white` instead of a brand color
    (the logo already carries its own colors — wrapping it in another colored circle
    looked wrong). `Settings.mercadolibreUrl` itself was already correct
    (`mercadolibre.com.ve/pagina/amaking`, confirmed against the live API) — only the icon
    artwork changed.
11. **Real storefront-shelf photos as section backgrounds (Categorías/Productos).** The
    user sent two real photos of the physical store's display shelves (a kitchen-appliance
    cabinet and a wall of yellow Ingco power tools with visible price tags) to use as
    backgrounds, "para que se vea que es una tienda real." Implementation:
    `public/categorias-bg.jpg` behind `categories-section.tsx`, `public/productos-bg.jpg`
    behind the combined Destacados+Ofertas block in `(store)/page.tsx` (one shared
    full-bleed wrapper around **both** `ProductsSection` instances, not one background per
    section — two separate `fill` images stacked back-to-back would show a visible seam/
    restart in the photo at the section boundary). Both images were re-encoded with `sharp`
    (`.rotate().jpeg({quality:82})`) from the originals in Downloads, matching the
    `about-storefront.jpg` pattern already established.
    **Overlay tuning went through one iteration**: the first pass used a dark gradient
    overlay (`brand-blue-dark` at ~85-90% opacity, same treatment as "Nosotros" §5.7) —
    the user pushed back ("no me gustó, quiero que se vea más la imagen, no tanto el fondo
    azul, quiero que vean que es una tienda real"). Fixed by dropping to a **flat**
    `bg-brand-blue-dark/45` tint and moving legibility work onto the text itself via
    `drop-shadow-[...]` on headings/eyebrows, instead of darkening the photo further. If
    you add more photo backgrounds elsewhere, start with the flat/lighter treatment +
    text drop-shadow, not the heavier Nosotros-style gradient — the heavier one reads as
    "too corporate/generic" to this user, the photo itself is the value.
12. **Hero/Nosotros copy went through a few rounds before settling.** Current final state:
    - **Misión** lives permanently in "Sobre Nosotros" (`about-section.tsx`): a "MISIÓN"
      eyebrow + paragraph, placed right after the section heading. The section's original
      intro paragraph ("Servimos a contratistas, maestros de obra...") was **removed
      entirely** per user request — Sobre Nosotros now shows only: heading → Misión block
      → the 3-item checklist (Asesoría técnica / Entrega el mismo día / Precios
      mayoristas). Don't re-add that intro paragraph if refactoring this section.
    - **Visión** lives in the Hero (`hero.tsx`), as a "VISIÓN" eyebrow + paragraph, in the
      exact spot the Hero's old short marketing paragraph ("Herramientas, materiales de
      construcción, pintura y plomería en un solo lugar...") used to be — that old
      paragraph is gone, replaced by the Visión text, not kept alongside it. This took two
      passes: first added, then removed entirely ("ya está la misión abajo, no hace falta
      repetirlo arriba"), then re-added at the user's explicit request once they decided
      they wanted the Visión text visible on the homepage after all, this time replacing
      the old paragraph instead of sitting beside it.
    - The Hero's third quick-stat (next to "Trayectoria" and "Mismo día") used to be a
      **live** `{productCount}+` fed by `prisma.product.count()` in `page.tsx` — now a
      hardcoded `"1500+"` (label "productos"), same fixed-number choice made for the
      "Sobre Nosotros" stat cards (see below). The now-unused query and `productCount`
      prop were removed from `page.tsx`/`hero.tsx` entirely, not left dead.
    - The "Sobre Nosotros" stat cards are **all fixed marketing numbers**, not live DB
      counts: **1500+ Productos, 1000+ Ventas en Mercado Libre, 6000+ Seguidores en
      Instagram, 45 Marcas aliadas**. Two of these four used to be real (`categoryCount`/
      `productCount` from Prisma) before this change. Explicit user decision: keep all
      four fixed for now; **"1500+ Productos" is the one candidate worth switching to a
      live `Product.count()`** once the real MeLi catalog is imported (see §7.1) — the
      other two (MeLi sales, IG followers) need separate integrations and stay hardcoded
      indefinitely regardless.
13. **Header "Productos" nav link was a dead anchor — user-reported bug, root-caused.**
    `NAV_LINKS` in `header.tsx` had `{ href: "/#productos", label: "Productos" }`, left
    over from before the homepage catalog was split into Destacados/Ofertas (§5.9) — the
    homepage no longer has an element with `id="productos"` (that section is now
    `id="destacados"` + `id="ofertas"`). Clicking "Productos" in the header therefore did
    nothing (tried to scroll to a nonexistent anchor on whatever page you were already on)
    instead of navigating to the real catalog. **This was not a query bug** — `/productos`
    itself (and the Hero's "Ver catálogo" button, which already pointed at `/productos`
    directly) correctly showed all products, paginated, with no category selected; this
    was verified live before concluding the nav link was the actual cause. Fixed by
    pointing that link straight at `/productos`. If another `/#section-id` link is ever
    added to `NAV_LINKS` or anywhere else, verify that section id still exists on the
    homepage — it's easy for these to silently rot when sections get restructured.

## 6. Code conventions actually followed in this codebase

- **Server Components fetch data directly via Prisma** (no API round-trip needed for the
  page's own render) — e.g. `(store)/page.tsx`, `producto/[id]/page.tsx`,
  `mis-pedidos/page.tsx`. API routes exist for **client-triggered mutations/fetches**
  (forms, admin CRUD tables, cart checkout), not for data the page itself needs on load.
- **Every API route validates its body with `zod`** before touching Prisma. See any file
  under `src/app/api/**/route.ts` for the pattern: define a schema, `safeParse`, return
  400 with a Spanish error message on failure.
- **Client-side "add to cart" always re-validates on the server.** Never trust a
  client-submitted price — `api/orders` re-reads `Product.priceUsd`/`stock` from the DB.
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
- **Brand color tokens are CSS custom properties**, not literal Tailwind colors — defined
  once in `src/app/globals.css` under `@theme inline` (`--color-brand-orange`,
  `--color-brand-blue`, `--color-brand-ink`, `--color-brand-bg2`, etc., all in `oklch()`).
  Change the palette in exactly one place; every component already references the token
  names (`bg-brand-orange`, `text-brand-ink-soft`, ...).
- **No comments unless explaining a non-obvious "why"** (e.g. the `eslint-disable-next-line
  react-hooks/set-state-in-effect` comments explain *why* the pattern is intentionally
  hydration-safe, not *what* the line does).
- **Spanish throughout** — all UI copy, error messages, and form labels are in Spanish
  (the business's language). Code identifiers (variables, functions, files) are in
  English. Keep this split when adding anything new.
- **Money is stored/passed around as `Float` in USD**, never as VES — conversion only
  happens at display time via `useCurrency().format()`.

## 7. Pending / next steps

Roughly in the order they'd probably matter to the user:

1. **Replace the 20 demo products with the real catalog (~2000 products from the store's
   MercadoLibre account).** This is the biggest gap, and it's actively in progress:
   - Seller confirmed against the live MeLi storefront: nickname **"amaking"**, site
     **MLV** (Venezuela), storefront literally titled "FERRE NEWLINK", product mix matches
     (carretillas, motobombas, herramientas Ingco, etc.). `Settings.mercadolibreUrl`
     already points at `mercadolibre.com.ve/pagina/amaking` — correct, no change needed.
   - Storefront displays prices in **US$** natively — needs a final per-item
     `currency_id` check via the authenticated API before bulk import, but no VES→USD
     conversion is expected to be necessary.
   - **Blocker**: MeLi's API now requires OAuth2 for essentially all GET endpoints (even
     `/items/{id}` returns `403 PA_UNAUTHORIZED` unauthenticated) — waiting on the user to
     create an app at developers.mercadolibre.com.ve and do a one-time authorization so the
     import script has a refresh token. Also unresolved: SQLite vs. the Postgres the user
     referenced (schema is still SQLite as of this writing — see §2) — pending user's
     confirmation before the import script picks a target DB.
   - The **schema/UI side is now ready** for this import regardless of source: `Product`
     has `featured`/`onSale`/`originalPriceUsd`, the homepage no longer dumps the full
     catalog, `/productos` and `/admin/productos` are both paginated (24/page) so they
     won't choke on ~2000 rows. The import itself (standalone script, not done inline in
     chat) is the remaining piece.
   - Category mapping (MeLi's categories vs. this store's 5 + the missing "Herrería"/
     "Impermeabilización" seen on physical signage) is still an open question for the
     import script.
   - Once real products land, decide whether "1500+ Productos" (§5.12) should switch from
     a hardcoded number to a live `Product.count()` — the user flagged this as worth
     revisiting at that point, not before.
2. **Facebook URL still unverified.** `facebookUrl` was my best guess based on the
   `@ferrenewlink` handle pattern (`facebook.com/ferrenewlink`) since the storefront sign
   just said "Facebook: Ferre Newlink" without a direct URL — worth the user double-checking
   it resolves to their real page. (`mercadolibreUrl` **is** now confirmed correct, see
   item 1 above — no longer an open question.)
3. **Change the admin password.** Current login (via `/ingresar`, unified system): email
   `admin@ferrenewlink.com`, password `Ferre2026`. This was set as a simple, memorable
   placeholder at the user's request ("algo sencillo que no se complique la vida") — fine
   for local dev, should be rotated before any real deployment.
4. **No git repository yet.** Worth initializing before doing much more work, purely for
   safety/history — not done because nobody asked for it.
5. **`codebase-memory-mcp` could not be installed.** Attempted per user request; failed
   because the tool's own latest GitHub release archive is missing a file
   (`codebase-memory-mcp.payload.exe`) that its own `install.ps1` requires — an upstream
   packaging bug, not something on our end. Could retry later if they fix their release.
6. **No deployment/hosting set up.** Everything so far runs locally (`npm run dev`,
   SQLite file DB). Moving to production would need: a real Postgres/MySQL (SQLite +
   better-sqlite3 driver adapter won't work well on most serverless hosts), env vars for
   `JWT_SECRET` (currently a hardcoded dev fallback) and `DATABASE_URL`, and a decision on
   hosting (Vercel is the obvious fit for Next.js but needs a hosted DB).
7. **Minor cleanup**: `public/uploads/brand/` still holds the 4 original full-resolution
   images the user pasted (source material for the cropped logo / resized hero/about
   photos) — harmless to keep for reference but not referenced by any page; fine to leave
   or delete.
8. Two unrelated tool installs were also done in the parent workspace directory
   (`C:\Users\Usuario\Desktop\ClaudeCode`, one level up from this project) at the user's
   request: **spec-kit** (`.specify/`, `/speckit-*` skills) and **ui-ux-pro-max-skill**
   plus **emilkowalski/skills** (animation/design skills, all under the workspace's
   `.claude/skills/`). These are dev-tooling additions, not part of the app itself.

## 8. Real business info currently in the database (for reference, not secret)

- WhatsApp / primary phone: `+58 416-4202795`
- Address: Local Nro. 178, Avenida Los Cedros, Maracay 2103, Aragua, Venezuela
- Email: ventasonline@ferrenewlink.com
- Instagram/TikTok: `@ferrenewlink`
- Hours (hardcoded in `location-section.tsx`, not in `Settings` — update there if they
  change): Mon–Fri 8am–5pm, Sat 8am–2pm, closed Sunday
- Homepage "Sobre Nosotros" stats (`about-section.tsx`) are all fixed marketing numbers now,
  not live DB counts: 1500+ Productos, 1000+ Ventas en Mercado Libre, 6000+ Seguidores en
  Instagram, 45 Marcas aliadas. Revisit "1500+ Productos" once the real MeLi catalog is
  imported — the user said it may be worth switching that one to a live `Product.count()`
  at that point; the other two need separate integrations (MeLi sales API, Instagram) so
  they stay fixed indefinitely.
