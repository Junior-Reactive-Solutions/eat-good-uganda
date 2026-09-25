# 22 — UI Transition Plan

Tracks the move from the current admin/customer interfaces to the redesign agreed in
September 2026. Each phase is independently shippable and independently revertable.

## Status board (as of 2026-09-25)

| Phase | State | Live? |
| --- | --- | --- |
| 1 — Shell, navigation, icons | **Done** (2 follow-ups open) | Yes, verified |
| 2 — Action queues | **Done** (bakery queue in the live bundle since 07:07 UTC; super-admin needs an authenticated check) | Yes (super-admin unverified behind login) |
| 3 — Tables and pipeline | **Done in code** (limitations listed in the phase) | Yes, bundle-verified |
| 4 — Forms, shortcuts, polish | Not started | — |
| 5 — Customer storefront | Not started, **blocked** on reconnecting the customer Vercel project | No |

The full narrative — what was done, how, where, why, and every blocker — is in
[`23-SESSION_LOG_2026-09.md`](23-SESSION_LOG_2026-09.md). This document is the forward-looking checklist.

## Design references

| Deck | Covers |
| --- | --- |
| [Ops Console](design/ops-console.html) | Super Admin + Bakery Admin, 8 screens, icon set, shortcut map |
| [Storefront](design/storefront.html) | Customer, 7 screens, phone-first, motion spec |

Both decks are the source of truth for layout decisions. Where this document and a deck
disagree, the deck wins and this document should be corrected.

## Non-negotiables

Carried unchanged through every phase:

- **Palette.** Only tokens from `platform-theme.css`. No new brand hues.
- **WCAG 2.1 AA.** 4.5:1 body text, 3:1 UI boundaries, 44x44px touch targets, visible focus,
  status never carried by colour alone.
- **Tenant isolation.** Bakery Admin sees only its own `bakery_id`. The UUID is available for
  support but is not primary chrome.
- **Admin apps stay platform-branded.** Per `06-THEMING.md`, bakery theming applies to
  `/b/:slug/*` on the storefront only.
- **Stack.** TypeScript, Tailwind against existing tokens, existing component primitives
  extended rather than replaced.

## Phase 1 — Shell, navigation, icons

**Status: done — two follow-ups open (shared `PageHeader`, icon consolidation)**

- [x] Add `@phosphor-icons/react` (MIT) to all three apps.
- [x] `adaptIcon()` adapter maps Phosphor glyphs onto the existing `IconProps` contract, so
      `size` / `color` / `state` / `className` / `data-testid` behave identically and no call
      site changes.
- [x] Migrate 40 of 45 icons per app (120 files) to Phosphor.
- [x] Fix icon accessibility: an icon with `alt=""` is now `aria-hidden` rather than
      `role="img"` with a default label of "icon".
- [x] Bakery Admin nav: `NavLink` with a visible active state, grouped Operate / Configure,
      Settings and Payments surfaced in the rail for the first time.
- [x] Super Admin nav: `NavLink` with active state, grouped Oversight / Governance.
- [x] Super Admin header: hardcoded "Admin Dashboard" replaced with a live breadcrumb.
- [x] Bakery Admin header: raw tenant UUID replaced with bakery identity plus a copyable
      short id for support.
- [ ] Shared `PageHeader` with a primary-action slot, adopted across all 15 admin pages.
- [ ] Collapse the triplicated icon directories into `packages/ui` (see Known debt).

### Icons kept hand-drawn

Five glyphs have no Phosphor equivalent and stay custom:

| Icon | Why |
| --- | --- |
| `IconPaymentMomo` | MTN brand mark — must not be substituted |
| `IconPaymentAirtel` | Airtel brand mark — must not be substituted |
| `IconProductCupcake` | No Phosphor equivalent |
| `IconProductDonut` | No Phosphor equivalent |
| `IconProductPastry` | No Phosphor equivalent (no icon set has a croissant) |

`IconDeliveryBoda` was slated to stay custom but maps cleanly to Phosphor `Moped`, which is a
better drawing than the hand-built one. It has been migrated.

### Ugandan product glyphs — outstanding

No icon library covers mandazi, chapati, rolex, samosa or matoke. A set of roughly twelve
custom glyphs should be commissioned, drawn on Phosphor's 256x256 grid at matching stroke
weight so they sit in the set indistinguishably. Sketches are in the Ops Console deck.

## Phase 2 — Action queues

**Status: done in code (`7904f0c`, `f9dfac9`, corrected in `333c30e`)**

- [x] `ActionQueue` component (one per app): severity stripe, counting title, evidence subtitle,
      inline action; renders nothing when the queue is empty.
- [x] Bakery Admin data: `getBakeryActionQueue` → `GET /v1/bakery/metrics/action-queue`
      (orders to confirm with wait time, orders due within 3 h, published-but-unavailable
      products, whether a payment method is enabled). Tenant-scoped by `bakery_id`.
- [x] Super Admin data: `getPlatformActionQueue` → `GET /v1/admin/dashboard/action-queue`
      (pending approvals, tickets older than 24 h, active bakeries with no payment method,
      approved bakeries with no published product after 3 days).
- [x] Fixed on the way: order status enum mismatch (`pending` vs `pending_payment`);
      `GET /v1/admin/dashboard` returning 500 (it read the never-populated `req.db`); the old
      super-admin banner linking to a route that does not exist.
- [ ] **Queue accuracy:** "orders to confirm" includes `pending_payment` orders that are still
      waiting on the customer's mobile-money PIN. Make it payment-method-aware.
- [ ] New-bakery dashboard becomes a setup checklist instead of four zeros.
- [ ] KPI tile with delta, sparkline and prior-period value. Direction and sentiment are
      separate inputs so a rising failure count reads red.
- [ ] Verify live: super-admin queue and dashboard need an authenticated check (TOTP). The bakery
      queue is present in the live bundle (2026-09-25 07:07 UTC); a visual check with the seed
      login is still recommended.

## Phase 3 — Tables and pipeline

**Status: done in code (`5ce815a`); limitations below must be fixed before heavy use**

- [x] Orders pipeline board (`OrderBoard.tsx`): six columns matching the real `order_status`
      transitions, each card carrying one primary advance action wired to the existing
      `PATCH /v1/bakery/orders/:id`. A waiting timer on the Pending column turns red past 15
      minutes. Board/Table toggle persists in `?view=`.
- [x] Fixed a second bug surfaced while wiring this up: the Phase 2 commit's URL-driven status
      filter for Orders never actually landed (a multi-part find/replace silently applied only
      one of its edits). `pending_payment` is now a real filterable tab, `?status=` round-trips
      correctly, and the action queue's "Review" deep link lands on the right filtered view.
- [x] Super Admin Bakeries: converted the card grid to a sortable table — click a column header
      to sort, click again to reverse direction. Saved-view tabs (All / Pending / Active /
      Suspended) replace the status `<select>`. Bulk select with a dark action bar that appears
      on first selection; "Approve N" calls the existing per-bakery approve endpoint for each
      selected pending row (no bulk endpoint exists yet — see Known debt).
- [ ] Shared `DataTable` component — the two tables above still duplicate their sort/select
      logic rather than sharing one component. Worth extracting once a third table needs the
      same behaviour.
- [ ] Three empty-state variants (no data yet / no results for filter / error) replacing every
      bare "No results" string — partially done (Orders board has its own "No orders yet"; the
      generic empty state used elsewhere is still the old one-liner).

### Phase 3 limitations to fix

- [ ] **Orders list filters run after pagination.** `GET /v1/bakery/orders` fetches a page ordered
      by recency and then filters by status/date in memory, with an approximate `total`. The
      "To confirm" tab can look empty while older pending orders exist. Move filters into SQL and
      return a real `COUNT(*)`.
- [ ] **Board window.** The board loads the latest 100 orders of any status, so accumulating
      `delivered` orders can push still-active older orders off the board. Query active statuses.
- [ ] **Board card a11y and feedback.** The card is `role="button"` containing a real button
      (nested interactive). Mutation failures are not shown to the user; no undo toast; no cancel.
- [ ] **Bulk approve** has no dedicated endpoint, no per-row result feedback, and only sees the
      current page's selection.

## Phase 4 — Forms, shortcuts, polish

- [ ] Sectioned settings with sticky save bar, dirty tracking and navigation guard. Payments
      folds in as a section.
- [ ] Menu availability switches with optimistic update and undo toast.
- [ ] Keyboard shortcut map (see Ops Console deck) plus the `?` cheat sheet.
- [ ] **WCAG 2.1.4 requirement:** single-key shortcuts must be disableable. Ship
      Settings -> Accessibility -> "Single-key shortcuts", default on.
- [ ] axe-playwright sweep of all admin pages against the AA checklist.

## Phase 5 — Customer storefront

Phone first, tablet second, desktop third. Depends on Phases 1-4 for shared components.

- [ ] Fulfilment fact chips on discovery cards and a fact grid on the bakery page — delivery
      fee, minimum order, lead time, rating. All from columns that already exist and are
      currently rendered nowhere.
- [ ] Open / closed / opens-at state computed in Africa/Kampala.
- [ ] Live minimum-order gap in the basket, with switch-to-pickup and top-up escapes.
- [ ] Four-step checkout with a total that never changes at the last step.
- [ ] Mobile money states: waiting (with `*165#` fallback and visible expiry), timeout
      (leading with "no money has left your account", order held 15 minutes), success.
- [ ] Order tracking timeline mirroring the bakery's pipeline, with ETA card.
- [ ] `/account` becomes a real hub instead of "Account settings coming soon".
- [ ] Bottom tab bar on phone: Home, Orders, Saved, Account.

### Motion spec

Six named animations, transform and opacity only, nothing over 320ms:

| Motion | Use | Spec |
| --- | --- | --- |
| Sheet rise | Filters, variant pickers, address selection | translateY, 320ms, ease-out |
| Toast | Confirm an action with no visible result; carries undo | translateY + opacity, 200ms |
| Skeleton shimmer | Replaces every list spinner | background-position, 1.5s loop |
| Tap + count bump | Add to basket | scale, 120ms press, 200ms spring |
| List stagger | Results after search/filter, first six items | translateY + opacity, 70ms stagger |
| Status halo | Current tracking step only | scale + opacity, 2.2s loop |

Rules: no entrance animation on content already in view; one ambient loop maximum per screen;
`prefers-reduced-motion` removes every animation and transition.

## Open decisions

| Question | Blocks |
| --- | --- |
| Are ratings in scope for v1? There is no `ratings` table. | Discovery cards, order history |
| Is "Notify me when back in stock" worth the notification plumbing? | Sold-out product rows |
| Rail stays espresso, or goes light cream with an amber active fill? | Phase 1 polish |

## Known debt surfaced during this work

- **The 45 icon components are triplicated** across `customer`, `bakery-admin` and
  `super-admin` — 135 files maintained in parallel. They should move to `packages/ui` and be
  imported by all three. Deferred to keep Phase 1 low-risk.
- The customer app's Vercel project lost its GitHub link and last deployed on 12 June 2026.
  It must be reconnected before any customer-side work can be verified live.
- **No bulk approve endpoint for bakeries.** The Bakeries table's bulk approve calls
  `POST /:bakeryId/approve` once per selected row. Fine at today's volume; a real
  `POST /v1/admin/bakeries/bulk-approve` should replace it before onboarding scales up, both
  for a single audit-log entry and to avoid N sequential round-trips.
- **Found and fixed while building Phase 3:** a prior patch (Phase 2, `7904f0c`
  `feat(bakery-admin): add the action queue`) claimed to wire `?status=` into the bakery-admin Orders page but a
  multi-part scripted edit silently applied only one of several intended replacements — the
  `useSearchParams` wiring never actually landed. The lesson: verify each replacement
  individually rather than asserting only that *some* change occurred.
- **A second silent partial edit was found later** (`f9dfac9` and `7904f0c` again): the
  `GET /v1/admin/dashboard/action-queue` endpoint and the `req.db` fix were never applied to the
  API route, and the bakery dashboard imported its new component without rendering it. Corrected
  in `333c30e`. The verification rules that came out of this (exact match counts, grep after
  edit, exit codes not silence) are in `23-SESSION_LOG_2026-09.md` §7.
- **Lint debt inherited from earlier phases:** the customer app reports 17 ESLint errors and 12
  TypeScript errors in test files. None come from this work (proved with `git blame`), but they
  make the lint gate unreliable until cleared.
- **Social previews:** per-page Open Graph tags are set client-side, which WhatsApp/Facebook/X
  crawlers do not execute. Dynamic previews need prerendering or edge middleware.
  `og-default.png` is JPEG data with a `.png` name and should be regenerated at 1200×630.
- **Migration `0024`** (`website`, `currency_code` on `bakeries`) is committed but unapplied
  because the local database credentials are stale. Apply it or delete it.
