# 23 — Session Log: September 2026

**Period:** 2026-09-12 → 2026-09-25
**Branch:** `master` (all work pushed; HEAD at time of writing is `333c30e` plus the documentation commit that adds this file)
**Commit range covered:** `8286966` … `333c30e` (14 commits)
**Companion documents:**
[`22-UI_TRANSITION_PLAN.md`](22-UI_TRANSITION_PLAN.md) (the forward plan and phase checklist) ·
[`17-DECISIONS_LOG.md`](17-DECISIONS_LOG.md) (architectural decisions, appended) ·
[`PROGRESS_TRACKER.md`](PROGRESS_TRACKER.md) (master tracker, updated) ·
[`design/`](design/) (the two design decks, as standalone HTML)

This document is deliberately blunt. Where something was claimed and turned out not to be true, it says so
(see §7). Where something could not be verified, it says that too (see §2 and §9).

---

## 1. Summary

### In one paragraph

The bakery-admin app could not be logged into or used on production because of a chain of independent bugs
(wrong auth paths tripping CSRF, a build broken by a Sentry API change, three API routes that were missing or
crashing). Those were fixed one by one against the live deployment. That established a working baseline, on top
of which a redesign of all three frontends was proposed (two interactive design decks, both approved) and the
first three phases of it were implemented: a new icon system and fixed navigation (Phase 1), "what needs doing"
action queues on both admin dashboards (Phase 2), and an orders pipeline board plus a sortable, bulk-actionable
bakeries table (Phase 3). A final audit found and fixed two features that had been committed under messages
claiming they worked when they did not fully land, plus a batch of lint errors that earlier "clean" reports had
wrongly said were clean.

### Status at a glance

| Area | State |
| --- | --- |
| Bakery Admin usable on production (login, dashboard, orders, menu, settings, payments) | **Done, verified live** |
| 404 / error pages (all 3 apps) | **Done.** Admin apps live (bundle-verified). Customer app **not deployed** — see §5 |
| Customer page titles + Open Graph tags | **Done in code. Not live** (customer deploys blocked). Social-preview limits in §6 |
| Phase 1 — icons + navigation | **Done, verified live** (bakery-admin visually; super-admin by bundle scan) |
| Phase 2 — action queues (bakery + super-admin) | **Done and pushed.** Both APIs live (route existence verified). Bakery queue UI confirmed live in the served bundle after the `333c30e` redeploy (07:07 UTC). Super-admin queue still needs an authenticated check |
| Phase 3 — orders board + bakeries table | **Done in code, pushed, bundle-verified live.** Known limitations in §6 |
| Phase 4 — forms, shortcuts, polish | **Not started** |
| Phase 5 — customer storefront redesign | **Not started. Blocked** on the customer Vercel project being reconnected |
| Customer app deployments | **Blocked** — Vercel project has no GitHub link; last deploy 12 Jun 2026 |

### Legend

`DONE` shipped and confirmed · `PUSHED` in `master`, deploy or live behaviour not yet confirmed ·
`OPEN` not done · `BLOCKED` needs something outside the code

---

## 2. What is live right now (evidence, not assumption)

Checked on 2026-09-25 ~07:00 UTC by fetching each production site and searching its served JavaScript for the
specific strings each feature contains. Repeat this with the script in §11 after any deploy.

| Frontend | Feature | Live? |
| --- | --- | --- |
| bakery-admin | Grouped nav (Operate/Configure), Settings + Payments in rail | Live |
| bakery-admin | Orders board (`Start preparing` etc.), Board/Table toggle | Live |
| bakery-admin | 404 page (`Page not found`) | Live |
| bakery-admin | **"Needs you now" action queue rendered on dashboard** | **Live as of 07:07 UTC.** It was *missing* at 07:00 (the component was imported but never rendered, so the bundler dropped it); `333c30e` fixed that and the new bundle contains it. The scan proves the code shipped, not that it shows correct data — see §9 |
| super-admin | Grouped nav, action queue UI (`Needs your decision`), bulk-approve bar, 404 page | Live |
| customer | 404 page, `og:title` tags | **Not live** — still serving the 12 June build |

| API route (Render) | Result | Meaning |
| --- | --- | --- |
| `GET /v1/bakery/metrics/action-queue` | 401 | Route exists (a nonexistent sibling path returns 404) |
| `GET /v1/admin/dashboard/action-queue` | 401 | Route exists — added in `333c30e` |
| `GET /v1/bakery/orders` | 401 | Route exists |

**Not verifiable by me (needs a human):** anything behind the super-admin login. It requires a rotating TOTP
code; generating one from a stored secret would bypass the second factor, so I did not. See §9 for the checklist.

---

## 3. Work completed, in order

Each item: **What** · **Where** · **Why** · **How** · **Verified** · **Commit**.

### A. Getting the Bakery Admin working on production (14 Sep)

The starting point: all Vercel builds for bakery-admin had been failing since 12 June, and the live app could
not be logged into. The work below was done against the live deployment (Vercel + Render), not locally, per the
requirement that verification happen on hosted services.

#### A1. Login blocked by CSRF — `8286966`

- **What:** Login returned `403 {"error":"csrf token mismatch"}`.
- **Where:** `apps/bakery-admin/src/pages/LoginPage.tsx`, `features/auth/hooks.ts`, `layouts/DashboardLayout.tsx`.
- **Why:** The CSRF middleware exempts only paths matching `/^\/v1\/(admin|bakery|customer)\/auth\//`. The login
  page posted to `/v1/bakery/login` (missing `/auth/`), so it was not exempt. `useMe` had the same wrong path.
- **How:** Diagnosed by wrapping `XMLHttpRequest` in the live page to capture the real URL and 403 body. Ruled out
  credentials and CORS first (direct `curl` login worked; the OPTIONS preflight returned 204 with correct headers).
  Corrected both paths to `/v1/bakery/auth/login` and `/v1/bakery/auth/me`. Replaced a logout that only cleared
  `localStorage` with a real `POST /v1/bakery/auth/logout` plus `queryClient.clear()`.
- **Verified:** Logged in live.

#### A2. Bakery ID header blank — `8a5d65c`

- **Why:** `/v1/bakery/auth/me` returns `{ user: {...} }`; `useMe` returned the wrapper, so `me.bakery_id` was
  `undefined` and the header/`BakeryContext` were empty.
- **How:** `api.get<{ user: MeResponse }>` and `return res.data.user`.
- **Verified:** Header showed the real bakery UUID on the live site.

#### A3. Vercel builds failing since 12 June — `41e1268`

- **What:** Two TypeScript errors broke every production build: `TS2339 Property 'Replay' does not exist on type
  'typeof @sentry/react'` and `TS2578 Unused '@ts-expect-error'`.
- **Where:** `main.tsx` in all three apps; `apps/bakery-admin/vitest.config.ts`.
- **Why:** `@sentry/react` v10 removed the `Replay` class in favour of the `replayIntegration()` factory. Phase 7
  had introduced the old API, so the error was present in every commit since. The stale `@ts-expect-error` became
  an error itself once the underlying type problem stopped occurring.
- **How:** `new Sentry.Replay()` → `Sentry.replayIntegration()` (×3). Removed the suppression comment. (The same
  commit also reorders one import in `DashboardLayout.tsx`, a lint-only change.)

#### A4. Dashboard metrics returned 500 — `b9d7616`

- **Why:** `routes/bakery/metrics.ts` called `getBakeryMetrics((req as any).db, bakeryId)`. **Nothing in this
  codebase ever sets `req.db`**, so it was always `undefined`.
- **How:** Use the shared `pool`. This is the third confirmed instance of the pattern (earlier: `9a0c5b7`; later:
  `admin/dashboard.ts`, fixed in `333c30e`). `customer/payments.ts` and `webhooks/mtn-momo.ts` mention `req.db` but only as a
  fallback (`req.db ?? pool`), which is correct.

#### A5. `/v1/bakery/orders` did not exist — `9126b22`

- **What:** The Orders page called an endpoint that returned 404; it had never been implemented or mounted.
- **Where:** New `apps/api/src/routes/bakery/orders.ts` (251 lines); mounted in `apps/api/src/app.ts`.
- **How:** Three routes, all behind `authenticateToken('bakery')` + `requireBakeryContext()` and scoped by
  `bakery_id`: `GET /` (paginated list with customer name and payment method joined in), `GET /:orderId`
  (detail + line items), `PATCH /:orderId` (status change through the existing `updateOrderStatus`, which
  enforces the transition table and returns 422 on an invalid transition).
- **Known weaknesses (open, see §6):** status/date filters are applied in memory *after* the database page is
  fetched, and `total` is approximated rather than counted.

#### A6. Settings page returned 500 — `ae8f06b`, `8bba6c2`

- **What:** `GET /v1/bakery/settings` failed with `column "website" does not exist`.
- **Why:** `getBakeryProfile` selected `website` and `currency_code`; neither column exists in `bakeries`
  (migration `0003`). Found by reading the Render application logs rather than guessing.
- **How:** Removed both columns from the SELECT/RETURNING lists, the `BakeryProfile` type, the Zod schema, the
  form and its tests. Added migration `0024_add_website_currency_to_bakeries.sql` for when the columns are wanted.
- **Verified:** Settings page loaded real data on the live site.
- **OPEN:** Migration `0024` is **committed but not applied** — see blocker B3. Until it runs (or is deleted),
  the Website field stays out of the UI.

### B. 404 pages and page metadata (14 Sep)

#### B1. Friendly 404 / error UI — `9fc6eec`

- **What:** Unknown URLs showed React Router's default "Unexpected Application Error! 404 Not Found 💿 Hey
  developer" screen.
- **Where:** New `pages/RouteErrorPage.tsx` in all three apps; changes to each `router.tsx`.
- **Why (non-obvious):** `errorElement` alone does **not** fix this. That screen appears when *no route matches
  at all*, and `errorElement` only fires for a matched route that throws. A `path: '*'` catch-all is required.
- **How:** One `RouteErrorPage` per app using `isRouteErrorResponse` to tell a 404 from a runtime error, styled
  with existing tokens. `errorElement` on top-level routes for genuine render errors, plus a catch-all nested
  under the authenticated layout (so the sidebar survives) and a top-level catch-all. Customer app has a single
  root layout, so it has one nested catch-all.
- **Verified:** The strings are present in the live admin bundles. **Not visually confirmed**: an unauthenticated
  visit to an unknown admin path redirects to `/login` first (by design, `RequireAuth` runs before the catch-all),
  so the page is only reachable when signed in.

#### B2. Per-page titles and Open Graph tags (customer app) — `8f902dd`

- **What:** Every customer page now sets its own `<title>`, meta description, `og:*` and `twitter:*` tags.
- **Where:** New `components/PageMeta.tsx`, used by 21 customer pages plus the error page; `index.html`; `public/og-default.png`.
- **How:** React 19 hoists `<title>`/`<meta>` rendered anywhere in the tree into `<head>`, so no helmet library
  was needed. Bakery, menu and product pages build their title/description/image from live data. Private pages
  (account, checkout, order pages, auth flows) emit `noindex`.
- **Caveats — please read (also §6):**
  1. This is a client-rendered SPA. **WhatsApp, Facebook and X crawlers do not run JavaScript**, so shared links
     will show only the static defaults from `index.html`, not the per-bakery/product values. The commit message
     for `8f902dd` overstated this. Real dynamic previews need server-side rendering or edge middleware.
  2. `og-default.png` is the 1024×1024 brand logo, and is actually **JPEG data with a `.png` name**. It should be
     regenerated as a proper 1200×630 PNG.
  3. `og:url` in `index.html` is hard-coded to the `.vercel.app` root and will be wrong once the domain moves.
- **Not live:** the customer app is not being deployed (blocker B1).

### C. Design proposals (14–18 Sep)

Two interactive decks were produced and iterated with the product owner. Both were approved ("top notch, feels
perfect"). They are the source of truth for layout decisions and are stored in this repo as standalone pages:

| Deck | File | Contents |
| --- | --- | --- |
| Ops Console | [`design/ops-console.html`](design/ops-console.html) | Super Admin + Bakery Admin: 8 annotated screens, findings, icon-set verdict, keyboard shortcut map, patterns, 4-phase rollout |
| Storefront | [`design/storefront.html`](design/storefront.html) | Customer, phone-first: 7 screens across phone/tablet/desktop, breakpoint strategy, six-motion animation spec, icon-only sprite |

Requirements captured from the owner, which constrain all further work:

- Keep the existing palette (`platform-theme.css`), WCAG 2.1 AA, tenant isolation, and per-bakery theming rules.
- **Customer side is designed for phone and tablet first, desktop second.**
- **No emoji anywhere the UI can use an icon.**
- Animation should be smooth and purposeful — "efficient and looks first, not complex and flashy". Codified as
  six named motions, transform/opacity only, nothing over 320 ms, `prefers-reduced-motion` honoured.
- Keyboard shortcuts that avoid browser-reserved combinations (single keys and `g`-sequences alongside `⌘K`).

Icon decision: adopt **Phosphor Icons** (MIT, ~1,500 glyphs × 6 weights) over Flaticon. Reasons: Flaticon's free
tier legally requires per-author attribution on every screen, mixes many authors' styles, and has no React
package; Phosphor's prop surface (`size`/`color`/`weight`/`alt`) nearly matches the existing `IconProps` contract
and its `fill` weight solves the "active nav item" problem. Glyph names were verified against the installed
package (1,512 glyphs) before mapping. Full reasoning is in the Ops Console deck and `17-DECISIONS_LOG.md`.

**Unsourced claims in the decks — verify before using externally:** "about 1 in 3 Ugandan customers pay with
Airtel", "Uganda's web traffic is overwhelmingly mobile", and the USSD fallback codes (`*165#` for MTN MoMo).
All figures inside the mockups (names, order numbers, UGX amounts) are illustrative example data.

### D. Phase 1 — icons and navigation — `e689ccf`

- **What / Why:** Three "blocks"-severity findings from the design review: (1) nav items were
  `<button onClick={navigate}>` with no active state, no `aria-current`, and no middle-click; (2) the Bakery Admin
  header showed a raw tenant UUID; (3) the Super Admin header said "Admin Dashboard" on every route. Plus the
  icon set, which had inconsistent strokes inside single glyphs and was hand-authored (45 files).
- **Where:** `apps/*/src/components/icons/**` (120 files regenerated + `adapt.tsx` ×3), `layouts/DashboardLayout.tsx`
  (bakery), `layouts/AdminLayout.tsx` (super-admin), `package.json` ×3, `pnpm-lock.yaml`.
- **How — icons:** Added `@phosphor-icons/react ^2.1.10` to all three apps. Wrote `adaptIcon(Glyph, defaultAlt)`
  which maps a Phosphor glyph onto the existing `IconProps` contract (same `size`/`color`/`state` classes and
  `data-testid`), so **no call site changed**. Generated 40 of the 45 icons per app from a mapping table. Five
  stay hand-drawn because no equivalent exists: `IconPaymentMomo`, `IconPaymentAirtel` (brand marks — must not be
  substituted), `IconProductCupcake`, `IconProductDonut`, `IconProductPastry`.
- **How — accessibility fix:** the old wrapper rendered `role="img"` with a default label of `"icon"` on every
  glyph. An icon with `alt=""` is now `aria-hidden`; only icons with real alt text are exposed.
- **How — navigation:** `NavLink` with a visible amber active edge and `aria-current`; groups Operate/Configure
  (bakery) and Oversight/Governance (super-admin); **Settings and Payments added to the bakery rail** (previously
  reachable only by typing the URL); super-admin header replaced with a live breadcrumb; bakery header shows the
  bakery user's identity with a copyable short id instead of the UUID.
- **Side effects:** the diff is large (1,072 insertions, 7,025 deletions) because hand-drawn SVG paths were
  removed. The lockfile change also happened to resolve a duplicate `vite` typing conflict, so
  `bakery-admin` `tsc` now exits 0 (it previously failed on `vitest.config.ts`).
- **Verified:** Logged into live bakery-admin and confirmed icons, grouped nav, active state and header. Super-admin
  confirmed by bundle scan only. **Customer icons changed appearance too and have not been seen live.**
- **Debt created:** the 45 icon components are still triplicated across three apps (135 files). See §6.

### E. Phase 2 — action queues — `7904f0c`, `f9dfac9`, corrected in `333c30e`

- **What / Why:** Both dashboards opened on totals (four zeros on a new bakery). An operator's first question is
  "what needs me?", so each dashboard now leads with a severity-striped queue where each row has a counting
  title, an evidence line and an inline action. Renders nothing when there is nothing to do.
- **Bakery — data:** `packages/db/src/queries/bakery-action-queue.ts` → `getBakeryActionQueue(db, bakeryId)`:
  orders in `pending_payment` (oldest first, with wait minutes); `confirmed`/`preparing` orders scheduled within
  3 hours; published products with `is_available = false`; and whether any `bakery_payment_credentials` row is
  enabled. Every query filters by `bakery_id`. Endpoint `GET /v1/bakery/metrics/action-queue`.
- **Bakery — UI:** `apps/bakery-admin/src/components/ActionQueue.tsx`, hook `useBakeryActionQueue` (1-min stale,
  2-min refetch), rendered on `DashboardPage`. "Review" deep-links to `/orders?status=pending_payment`.
- **Super Admin — data:** `packages/db/src/queries/admin/action-queue.ts` → `getPlatformActionQueue(db)`:
  bakeries in `pending_approval`; support tickets `open`/`in_progress` older than 24 h (a heuristic — no formal SLA
  field exists); active bakeries with no enabled payment credential; active bakeries approved ≥ 3 days ago with no
  published product. Endpoint `GET /v1/admin/dashboard/action-queue`. Exported with the same
  `eslint-disable-next-line no-restricted-imports` used by the existing admin export, because admin query
  helpers are deliberately import-restricted.
- **Super Admin — UI:** `apps/super-admin/src/components/ActionQueue.tsx`, hook `usePlatformActionQueue`.
  It **replaces** the old pending-approvals banner, whose "Review" button linked to `/admin/bakeries?...` — a path
  that does not exist in this router (routes mount at root), so it always landed on the 404 page.
- **Bugs fixed on the way:**
  - `routes/bakery/orders.ts` validated status against `'pending'` but the DB enum value is `'pending_payment'`,
    and omitted `'refunded'`; filtering or updating to either would 400.
  - `routes/admin/dashboard.ts` read `req.db` (never populated) — `GET /v1/admin/dashboard` returned 500 on every
    request. **This fix and the queue endpoint did not actually land until `333c30e`** (§7).
- **Design caveat (OPEN):** `pending_payment` means both "waiting for the customer's MoMo PIN" and "cash on
  delivery, waiting for the bakery". The queue currently treats all of them as "to confirm", so it can prompt a
  bakery to confirm an order that is still unpaid. It should distinguish by payment method (§6).

### F. Phase 3 — orders board and bakeries table — `5ce815a`

- **Orders board — What/Why:** The order status enum is already a pipeline; showing it as one turns "open detail →
  change a select → save → back" into a single tap. **Where:** `apps/bakery-admin/src/components/OrderBoard.tsx`,
  `pages/OrdersPage.tsx`.
- **How:** Six columns (Pending, Confirmed, Preparing, Ready, Out for delivery, Delivered) matching
  `VALID_TRANSITIONS` in `packages/db/src/queries/orders.ts`. Each card has one primary action wired to the
  existing `PATCH /v1/bakery/orders/:id`: Confirm → Start preparing → Mark ready → (Send for delivery | Mark
  delivered depending on fulfilment mode) → Mark delivered. The Pending column shows a wait timer that turns red
  after 15 minutes. Board/Table toggle persists in `?view=`; a bare `?status=` deep link lands on the filtered
  table instead of the board (which ignores status filters).
- **Bug found and fixed while doing this:** `7904f0c` claimed the Orders page reads `?status=` from the URL. It did
  not — only one of its scripted edits had applied (§7). The page was rewritten in full and `pending_payment` is
  now a real filter tab.
- **Bakeries table — What/Why:** The card grid could not sort, select, or act in bulk; approving several
  applications meant several page loads. **Where:** `apps/super-admin/src/pages/BakeriesPage.tsx`.
- **How:** Sortable table (click a header to sort, again to reverse), saved-view tabs (All/Pending/Active/
  Suspended) replacing the status `<select>`, row checkboxes, and a dark action bar that appears on first
  selection with "Approve N". No bulk endpoint exists, so it calls the existing per-bakery
  `POST /:bakeryId/approve` once per selected pending row. Bulk *suspend* was deliberately left out because
  suspending requires a reason.
- **Verified:** typecheck, lint and production build all exit 0; strings present in the live bundles. Not
  exercised against the live API (needs the super-admin login).

### G. Corrective audit — `333c30e`

Before writing this log I compared each commit's diffstat with what it was supposed to contain. Full account in §7.
Outcome: two features completed, 12 + 8 + 2 lint errors fixed, and every touched file re-verified with real exit
codes.

---

## 4. Verification standard now in use

After the audit, "done" means all of the following, with **exit codes captured, not inferred from silence**:

| Check | Result at `333c30e` |
| --- | --- |
| `eslint` on the api, bakery-admin, super-admin and db files this work created or substantially changed | exit 0 |
| `tsc --noEmit` for `packages/db`, `apps/api`, `apps/bakery-admin`, `apps/super-admin` | exit 0 |
| `tsc --noEmit` for `apps/customer` | exit 2 — 12 errors, **all in `*.test.tsx` / `vitest.config.ts`**, none in `src/` |
| `vite build` for bakery-admin, super-admin, customer (`build:ci`, the script Vercel uses) | exit 0 |
| `eslint` on customer files touched | exit 1 — 17 errors, **0 of 16 flagged lines introduced this session** (proved with `git blame`) |
| API test suite | **Cannot run locally** — all 26 files fail at import: `DATABASE_URL or DATABASE_URL_DIRECT must be set` |

---

## 5. Blockers faced

| # | Blocker | Impact | How handled | Status |
| --- | --- | --- | --- | --- |
| B1 | **Customer Vercel project has no GitHub link** (`link: null`); last deploy 12 Jun 2026 | Nothing customer-side (404 page, titles, OG tags, redesign) can go live or be verified | Cannot be fixed from code. Owner must reconnect: Vercel → project → Settings → Git | **BLOCKED** |
| B2 | bakery-admin / super-admin Vercel projects are **not visible to the Vercel connector** (different team) | Could not read build logs or promotion state; had to infer deploy status from served bundles | Built a bundle-content scanner (§11) as a substitute | Worked around |
| B3 | **Local `DATABASE_URL` credentials are stale** (`28P01 password authentication failed` from Neon) | `pnpm migrate` cannot run, so migration `0024` is unapplied; API tests cannot run | Avoided the schema change by removing the columns from queries. Owner must refresh the connection string from the Neon console | **BLOCKED** (for migrations/tests) |
| B4 | **Super-admin login requires TOTP** | Authenticated super-admin behaviour could not be verified by me | By design — bypassing MFA is not mine to do. Checklist in §9 | Needs owner |
| B5 | **Render free-tier cold starts** (~30–50 s observed) even though a 14-minute keep-alive workflow exists (worth checking that workflow is actually running) | Logins and first requests appear to hang; caused several false alarms while testing | Waited/retried; check `uptime_seconds` on `/v1/internal/health` to tell a cold start from a hang | Ongoing |
| B6 | **Mixed CRLF/LF line endings** in the repo | Multi-line scripted find/replace silently failed on CRLF files | Normalise to LF before scripting; prefer whole-file writes | Lesson learned (§7) |
| B7 | **Background command output capture was unreliable** | Empty output was misread as "no lint errors" — the direct cause of the false "clean" reports | Now require an explicit exit code | Lesson learned (§7) |
| B8 | Vercel deploy timing/promotion unclear | Owner reported "deploy finished" while production still served a Sept 18 bundle | Compared `Last-Modified`, bundle hashes and bundle contents | Resolved by content scan |
| B9 | Pre-existing debt in the customer app (17 lint errors, 12 test-file TS errors) | Noise in every lint/typecheck run | Proved it pre-dates this work; not fixed here | Open (§6) |

---

## 6. Known debt and risks (highest severity first)

1. **Orders list filtering is incorrect for busy bakeries.** `GET /v1/bakery/orders` fetches
   `limit + 1` rows ordered by `created_at DESC`, *then* filters by status/date in memory, and returns an
   approximate `total`. The "To confirm" tab — and therefore the dashboard's "Review" deep link — can show an empty
   page while older pending orders exist. Fix: push status and date filters into `listOrdersForBakery` SQL and
   return a real `COUNT(*)`.
2. **The board only sees the latest 100 orders, of any status.** As `delivered` orders accumulate, older orders that
   are still active can fall off the board. Fix: query active statuses explicitly (and only recent `delivered`).
3. **Action queue "to confirm" ignores payment method** (see §3E). Refine using the `payments` table.
4. **Board card is `role="button"` containing a real `<button>`** — nested interactive controls, an axe violation.
   Also: mutation failures (e.g. a 422 invalid transition) are not surfaced to the user, there is no undo toast,
   and there is no cancel action on the board.
5. **Bulk approve** loops N single calls with no per-row result feedback, only sees the current page's
   selection, and has no dedicated endpoint or single audit entry.
6. **Social link previews will not be dynamic** (§3B2) without prerendering/edge middleware; `og-default.png` is
   mis-typed; `og:url` is hard-coded.
7. **Icons are triplicated** across three apps (135 files). Should move to `packages/ui`.
8. **Customer app lint/test debt:** 17 eslint errors (`any` in form handlers, deprecated `FormEvent`, numeric
   template literals, non-null assertions) and 12 TS errors in test files. CI lint is not a reliable gate while
   these exist.
9. **Dependabot reports 67 vulnerabilities** on the default branch (1 critical, 31 high, 28 moderate, 7 low). Seen
   on every push; not triaged.
10. **`.claude/settings.local.json` is tracked but machine-local** and shows as modified in every `git status`. It
    was intentionally never committed during this work. Should be untracked or added to `.gitignore`.
11. **Migration numbering:** two files share the `0018_` prefix (pre-existing), and `0024` is unapplied.
12. **Repo hygiene:** line endings are mixed; there is no `.gitattributes` normalising them.

---

## 7. Process failures found in this work, and what changed

Reported honestly because they affected trust in earlier "done" claims.

**What happened.** Three separate kinds of false "done":

1. **Scripted edits that silently half-applied.** I patched files with Node `String.replace` scripts. On files with
   CRLF line endings the multi-line patterns did not match, and the only guard was a final `if (s === before)`,
   which passes as soon as *any* single replacement (e.g. an import line) succeeds. Result:
   - `7904f0c` — `OrdersPage` URL-filter wiring never landed (only a label tweak did); `DashboardPage` imported the
     new component but never rendered it.
   - `f9dfac9` — `admin/dashboard.ts` only had its import line changed: the `req.db` bug was not fixed and the
     `/action-queue` endpoint did not exist, so the super-admin frontend was calling a nonexistent route.
   Both commit messages described the intended change, not the actual one.
2. **Empty command output read as success.** Lint and typecheck runs were pushed to the background; an empty output
   file was taken to mean "no errors". Re-running with captured exit codes showed real errors in `orders.ts` (8),
   both `ActionQueue` components (9 + the same patterns), `DashboardLayout`, and the icon adapters.
3. **A wrong diagnosis.** When the action queue did not appear on the live dashboard I attributed it to a stale
   Vercel deploy. The stale deploy was real, but the component was also never rendered — the bundle scan later
   showed `Needs you now` absent even though its hook was present (tree-shaking removed the unused component).

**How it was found.** Comparing `git show --stat` for each commit against its intended scope (a 2-line diff for a
change described as a route rewrite is the tell), then grepping the files for the expected symbols.

**What changed going forward.**

- Every scripted replacement asserts an **exact expected match count** and aborts otherwise.
- Prefer the whole-file `Write` and the exact-match `Edit` tools over regex scripts; normalise CRLF first.
- After any edit, **grep for the expected symbol** and check `git diff --stat` against intent before committing.
- A verification step only counts with an **explicit exit code**. Empty output is "unknown", never "pass".
- Verify deployments by **searching the served bundle for a feature-specific string**, not by trusting the
  dashboard or `Last-Modified`.

---

## 8. What is on its way (in flight)

| Item | State | What's needed |
| --- | --- | --- |
| Redeploy of bakery-admin containing `333c30e` (renders the action queue) | **Landed 07:07 UTC** (`Needs you now` flipped to LIVE in the bundle scan) | Visual check with the seed login (§9 item 1) |
| Render redeploy carrying the admin dashboard `req.db` fix | Appears live (route exists, uptime 21 s at check time) | Authenticated smoke test of `GET /v1/admin/dashboard` |
| Customer redeploy | Not happening | Reconnect the Vercel project (B1) |
| Migration `0024` | File committed, unapplied | Refresh DB credentials (B3), then decide: apply, or delete |

---

## 9. Manual verification checklist (things only a human can confirm)

**Bakery Admin** (owner login from `PROGRESS_TRACKER.md` §11):
1. Dashboard shows a **"Needs you now"** panel. For Kampala Crust the expected row is *"No payment method is
   enabled"* (it has none configured). `333c30e` is deployed as of 07:07 UTC.
2. Sidebar highlights the current page; Settings and Payments appear under **Configure**.
3. `/orders` opens the **Board**; the toggle switches to **Table**; `/orders?status=pending_payment` opens the
   Table on the **TO CONFIRM** tab.
4. `/not-a-page` (while signed in) shows the friendly 404 inside the layout.

**Super Admin** (requires TOTP — not done by me):
5. `GET /v1/admin/dashboard` now loads. **It returned 500 on every load before `333c30e`.** Confirm the dashboard
   renders its charts.
6. "Needs your decision" appears when any bakery is pending, a ticket is > 24 h old, an active bakery has no
   payment method, or an approved bakery has published nothing.
7. **Bakeries** is a table: header-click sorting, view tabs, checkbox selection, and "Approve N" on pending rows.
   Its "Review" link from the dashboard opens `/bakeries?status=pending_approval`.

**Customer** (only after reconnecting Vercel):
8. Unknown URL shows the friendly 404; each page has its own tab title; icons look right at 16–48 px.

**API:** `curl https://eatgooduganda-api.onrender.com/v1/internal/health` → `{"status":"ok",...}`.

---

## 10. What's next, in order

**P0 — unblock (owner actions)**
1. Reconnect the customer Vercel project to `Junior-Reactive-Solutions/eat-good-uganda` (B1).
2. Confirm the bakery-admin redeploy landed (run §11); do the §9 super-admin checks with TOTP.
3. Refresh the Neon connection string in `.env` (B3), then apply or delete migration `0024`.

**P1 — correctness debt from this work** (§6 items 1–5)
4. Push orders status/date filters into SQL with a real total; make the board query active statuses only.
5. Make the action queue payment-method-aware.
6. Board: fix nested-interactive markup, surface mutation errors, add an undo toast and a cancel action.
7. Add `POST /v1/admin/bakeries/bulk-approve` with a single audit entry and per-row results.
8. Untrack `.claude/settings.local.json`; add `.gitattributes` to normalise line endings.
9. Triage the Dependabot alerts (start with the critical one).

**P2 — Phase 4: forms, shortcuts, polish** (see `22-UI_TRANSITION_PLAN.md`)
10. Shared `PageHeader` with a primary-action slot across the 15 admin pages.
11. Sectioned Settings with a sticky save bar, dirty tracking, navigation guard; fold Payments in as a section.
12. Menu availability switch on each card with optimistic update and undo.
13. Keyboard shortcut map + `?` cheat sheet + the Settings → Accessibility toggle that WCAG 2.1.4 requires for
    single-key shortcuts.
14. Shared `DataTable` and three empty-state variants; `axe-playwright` sweep of all admin pages.

**P3 — Phase 5: customer storefront** (phone → tablet → desktop; depends on P0 #1)
15. Fact chips on discovery cards (fee, minimum, lead time, rating) and open/closed state in Africa/Kampala.
16. Live minimum-order gap in basket with pickup/top-up escapes; four-step checkout with a stable total.
17. Mobile-money states: waiting (with fallback code and expiry), timeout ("no money has left your account", order
    held 15 min), success.
18. Order tracking timeline + ETA; `/account` as a real hub; bottom tab bar.
19. The six named motions and `prefers-reduced-motion` handling.
20. **Decisions needed first:** are ratings in v1 (no table exists)? Is "Notify me when back in stock" worth the
    notification plumbing? Rail colour: espresso (proposed) or light?
21. Prerendering / edge middleware so shared bakery and product links get real previews (§6 item 6).

**P4 — platform and operations**
22. Move the icon components into `packages/ui`; commission the ~12 Ugandan product glyphs (mandazi, chapati,
    rolex, samosa, matoke…) on Phosphor's 256×256 grid.
23. Set Sentry DSNs (`SENTRY_DSN`) on Render/Vercel.
24. Cloudflare DNS cutover from `.vercel.app` / `.onrender.com` to `eatgooduganda.com` (and fix `og:url`).
25. Onboard the first real bakery through the super-admin console.

---

## 11. Appendix

### Files created this period

| Path | Purpose |
| --- | --- |
| `apps/api/src/routes/bakery/orders.ts` | Bakery orders API (list, detail, status update) |
| `packages/db/src/queries/bakery-action-queue.ts` | Bakery "needs you now" query |
| `packages/db/src/queries/admin/action-queue.ts` | Platform "needs your decision" query |
| `packages/db/migrations/0024_add_website_currency_to_bakeries.sql` | Adds `website`, `currency_code` (**unapplied**) |
| `apps/*/src/components/icons/adapt.tsx` (×3) | Phosphor → `IconProps` adapter |
| `apps/bakery-admin/src/components/ActionQueue.tsx`, `OrderBoard.tsx` | Queue and pipeline board |
| `apps/super-admin/src/components/ActionQueue.tsx` | Platform queue |
| `apps/*/src/pages/RouteErrorPage.tsx` (×3) | 404 / error page |
| `apps/customer/src/components/PageMeta.tsx`, `public/og-default.png` | Page metadata |
| `docs/22-…`, `docs/23-…`, `docs/design/*.html` | Plan, this log, design decks |

### API endpoints added

| Method + path | Auth | Notes |
| --- | --- | --- |
| `GET /v1/bakery/orders` | bakery | List; **filters applied after pagination** (§6.1) |
| `GET /v1/bakery/orders/:orderId` | bakery | Detail with items, customer, payment method |
| `PATCH /v1/bakery/orders/:orderId` | bakery | Status change; 422 on invalid transition |
| `GET /v1/bakery/metrics/action-queue` | bakery | Tenant-scoped queue |
| `GET /v1/admin/dashboard/action-queue` | super admin | Cross-tenant queue |

### Live check script

Save as `check-live.cjs` and run with `node`. It scans each production frontend's JavaScript for feature strings.

```js
const https = require('https')
const get = (u) => new Promise((res, rej) => https.get(u, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)) }).on('error', rej))
const checks = {
  'bakery-admin': { 'action queue UI': 'Needs you now', 'orders board': 'Start preparing', '404 page': 'Page not found' },
  'super-admin':  { 'action queue UI': 'Needs your decision', 'bulk approve': 'pending selected', '404 page': 'Page not found' },
  'customer':     { '404 page': 'Page not found', 'og tags': 'og:title' },
}
;(async () => {
  for (const [app, feats] of Object.entries(checks)) {
    const base = `https://eat-good-uganda-${app}.vercel.app`
    const html = await get(base + '/')
    const queue = [...new Set([...html.matchAll(/assets\/[\w.-]+\.js/g)].map(m => m[0]))]
    const seen = new Set(); let text = html
    while (queue.length && seen.size < 60) {
      const f = queue.shift(); if (seen.has(f)) continue; seen.add(f)
      const js = await get(`${base}/${f}`); text += js
      for (const m of js.matchAll(/["'`]\.?\/?([\w.-]+\.js)["'`]/g)) queue.push('assets/' + m[1])
    }
    console.log(`\n${app} (${seen.size} chunks)`)
    for (const [label, s] of Object.entries(feats)) console.log(`  ${text.includes(s) ? 'LIVE   ' : 'MISSING'} ${label}`)
  }
})()
```

### Route-existence probe (unauthenticated)

An unknown path under a router returns **404**; an existing route that needs auth returns **401**. Compare a
known-bogus sibling against the route you care about — a lone 401 proves nothing, because a guard can 401
everything under a prefix.

### Deployment facts

| Thing | Value |
| --- | --- |
| API (Render service) | `eatgooduganda-api`, id `srv-d8gidiu7r5hc73b74qcg`, `https://eatgooduganda-api.onrender.com` |
| Frontends (Vercel) | `eat-good-uganda-{customer,bakery-admin,super-admin}.vercel.app` |
| Customer Vercel project | `prj_RNAXeQhKpdXjrdWVfkCflsxVrqKx`, team `team_NQhGCh74to1X7fGTz49wiKpz`, **unlinked from Git** |
| Vercel builds (bakery/super) | `vercel.json` in each app: install + build `@eatgood/shared`, `@eatgood/db`, then the app |
| Vercel build (customer) | root `vercel.json`: `pnpm --filter @eatgood/customer build:ci` (no typecheck) |
| Seed logins | `PROGRESS_TRACKER.md` §10–§11 (not repeated here) |

### Conventions worth knowing

- Tenant-scoped queries **must** filter by `bakery_id` (`docs/03-MULTI_TENANCY.md`). Use `pool` directly; do not
  read `req.db`.
- `packages/db/src/queries/admin/**` is import-restricted by ESLint to `apps/api/src/routes/admin/**` and
  `apps/super-admin/**`.
- Build order matters: `@eatgood/shared` → `@eatgood/db` → apps. After changing `packages/db`, run its build
  before typechecking `apps/api`.
- Icons: use the existing `Icon*` components (Phosphor-backed). No emoji in product UI.
