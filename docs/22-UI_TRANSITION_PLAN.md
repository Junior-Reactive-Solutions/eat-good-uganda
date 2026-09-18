# 22 — UI Transition Plan

Tracks the move from the current admin/customer interfaces to the redesign agreed in
September 2026. Each phase is independently shippable and independently revertable.

## Design references

| Deck | Covers |
| --- | --- |
| Ops Console | Super Admin + Bakery Admin, 8 screens, icon set, shortcut map |
| Storefront | Customer, 7 screens, phone-first, motion spec |

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

**Status: in progress**

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

- [ ] `ActionQueue` component: severity stripe, counting title, evidence subtitle, inline action.
- [ ] Bakery Admin queries: unconfirmed orders with wait timer, collections due, out-of-stock
      products, missing payment rails.
- [ ] Super Admin queries: pending approvals, SLA-breaching tickets, stalled onboarding,
      bakeries live without a payment method.
- [ ] New-bakery dashboard becomes a setup checklist instead of four zeros.
- [ ] KPI tile with delta, sparkline and prior-period value. Direction and sentiment are
      separate inputs so a rising failure count reads red.

## Phase 3 — Tables and pipeline

- [ ] Shared `DataTable`: sticky header, sortable columns, saved views in the URL, bulk select,
      row actions, result counts.
- [ ] Orders pipeline board with one-tap status advance, wired to `PATCH /v1/bakery/orders/:id`.
- [ ] Three empty-state variants (no data yet / no results for filter / error) replacing every
      bare "No results" string.

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
