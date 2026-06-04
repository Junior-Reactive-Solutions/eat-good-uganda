# Eat Good Uganda — Icon System Reference

**Status:** Active  
**Last Updated:** 2026-06-04  
**Applies to:** All three apps (customer, bakery-admin, super-admin)

---

## Brand Color Palette

All icons derive from the Eat Good Uganda brand extracted from the primary logo:

| Token | Hex | Usage |
|-------|-----|-------|
| `--icon-amber` | `#F9A931` | Primary brand accent, highlight fills |
| `--icon-dark` | `#1A0A00` | Deep brown, icon dark fill / cutouts |
| `--icon-burnt` | `#D56900` | Burnt orange, secondary shading |
| `--icon-cream` | `#FDFBE5` | Off-white, light backgrounds |
| `currentColor` | inherited | Default icon stroke/fill in UI |

In UI contexts: icons use `currentColor` so they automatically adapt to dark sidebars (white) and light content areas (dark brown).

---

## Icon Size System

| Size Token | px | Sidebar | Page content | Heading |
|------------|----|---------|----|---------|
| `sm` | 16px | Sub-labels | Inline text | - |
| `md` | 20px | Nav items | Buttons | Card icons |
| `lg` | 24px | Feature icons | Section headers | - |
| `xl` | 32px | Hero icons | Empty states | Page icons |

---

## Design Principles

### 1. Stroke Weight
- **Standard:** `strokeWidth="2"` at 20–24px
- **Minimum:** `strokeWidth="1.5"` for fine detail only
- Always use `strokeLinecap="round"` and `strokeLinejoin="round"`

### 2. Fill Strategy
- Navigation icons: **stroke only** (outline style, adapts to any background)
- Status icons: **filled** (solid shapes communicate state clearly)
- Favicons: **filled with brand amber** on dark background

### 3. Grid Alignment
- All paths designed on a 24×24 viewBox
- Key vertices snap to 0.5px grid
- Minimum visible element: 2×2px at 16px render size

### 4. Character & Warmth
- Prefer **rounded corners** (`rx/ry` or `Q` curves) over sharp angles
- Icons should have **Ugandan context** where relevant (boda, MoMo, wheat)
- Avoid cold, geometric, corporate icon styles

---

## Favicon Specifications

### Super Admin — `apps/super-admin/public/favicon.svg`

**Concept:** Shield with crown cutout  
**Tab title:** `EGU Admin`  
**Meaning:** Platform authority, security, oversight  
**Colors:** Amber shield `#F9A931` on dark `#1A0A00` background

```
32×32 SVG:
  ┌──────────────────────┐
  │   Dark bg (#1A0A00)  │
  │   ┌─── Shield ───┐   │
  │   │   Amber fill │   │
  │   │  ┌─Crown─┐   │   │
  │   │  │ Dark  │   │   │
  │   │  └───────┘   │   │
  │   └──────────────┘   │
  └──────────────────────┘
```

**SVG path breakdown:**
- Background: `<rect width="32" height="32" rx="7" fill="#1A0A00"/>`
- Shield: `<path d="M16 4 L24 8 L24 17.5 C24 22.5 20.5 26.5 16 27.5 C11.5 26.5 8 22.5 8 17.5 L8 8 Z" fill="#F9A931"/>`
- Crown: `<path d="M11 21 L11 17.5 L13.2 19.5 L16 14 L18.8 19.5 L21 17.5 L21 21 Z" fill="#1A0A00"/>`

---

### Bakery Admin — `apps/bakery-admin/public/favicon.svg`

**Concept:** Bread loaf with score marks and steam  
**Tab title:** `EGU Bakery`  
**Meaning:** Bakery business, food, fresh baked goods  
**Colors:** Amber loaf `#F9A931`, burnt base `#D56900` on dark background

```
32×32 SVG:
  ┌──────────────────────┐
  │   Dark bg (#1A0A00)  │
  │  ~~~  (steam wisps)  │
  │  ╭──────────────╮    │
  │  │ Amber dome   │    │
  │  │  |  |  |     │    │  ← score marks
  │  ╰──────────────╯    │
  │  [burnt base bar]    │
  └──────────────────────┘
```

**SVG path breakdown:**
- Background: `<rect width="32" height="32" rx="7" fill="#1A0A00"/>`
- Dome: `<path d="M7 22 Q7 12 16 11 Q25 12 25 22 Z" fill="#F9A931"/>`
- Base: `<rect x="7" y="21" width="18" height="5" rx="1.5" fill="#D56900"/>`
- Scores: `<path d="M12 15.5 L12 22 M16 13.5 L16 22 M20 15.5 L20 22" stroke="#1A0A00" stroke-width="1.5" stroke-linecap="round"/>`
- Steam: `<path d="M12 10 Q12.5 8.5 12 7.5 M16 9.5 Q16.5 8 16 7 M20 10 Q20.5 8.5 20 7.5" stroke="#F9A931" stroke-width="1" stroke-linecap="round" opacity="0.6"/>`

---

### Customer App — `apps/customer/public/favicon.svg`

**Concept:** Shopping bag with wheat stalk  
**Tab title:** `Eat Good Uganda`  
**Meaning:** Customer storefront, ordering, bakery commerce  
**Colors:** Amber bag on dark background

---

## UI Icon Components

All icons live in each app under `src/components/icons/` and are organized by category. Icons are shared across apps via copy (not package export) since each Vite app bundles independently.

### Directory Structure

```
src/components/icons/
├── admin/
│   ├── IconAdminAnalytics.tsx    — Bar chart (sidebar: Bakeries section)
│   ├── IconAdminApproved.tsx     — Bold checkmark circle (approved status)
│   ├── IconAdminAuditLog.tsx     — Document with check (audit trail)
│   ├── IconAdminCustomers.tsx    — Two overlapping people (users)
│   ├── IconAdminInventory.tsx    — Box/stack (products/inventory)
│   ├── IconAdminPending.tsx      — Clock with dashed border (awaiting)
│   ├── IconAdminRejected.tsx     — Circle with X (declined)
│   ├── IconAdminRevenue.tsx      — Coins/money stack (financials)
│   ├── IconAdminStaff.tsx        — Person with badge (team member)
│   └── IconAdminSuspended.tsx    — Pause circles (suspended account)
├── delivery/
│   ├── IconDeliveryBoda.tsx      — Motorcycle side-profile (boda-boda)
│   ├── IconDeliveryLocation.tsx  — Map pin with pulse (location)
│   ├── IconDeliveryPickup.tsx    — Storefront with arrow (collect)
│   ├── IconDeliveryStatus.tsx    — Route with checkpoints (tracking)
│   └── IconDeliveryTime.tsx      — Hourglass rounded (ETA)
├── interaction/
│   ├── IconInteractionBellNotification.tsx — Bell with dot (alerts)
│   ├── IconInteractionClock.tsx            — Round clock face (time)
│   ├── IconInteractionDelete.tsx           — Trash can (remove)
│   ├── IconInteractionDownload.tsx         — Arrow down into tray
│   ├── IconInteractionEdit.tsx             — Pencil angled (edit)
│   ├── IconInteractionHelp.tsx             — Question mark circle
│   ├── IconInteractionPhone.tsx            — Phone handset (contact)
│   └── IconInteractionShare.tsx            — Up-arrow from box (share)
├── navigation/
│   ├── IconNavigationCart.tsx     — Shopping basket with handle
│   ├── IconNavigationFavorites.tsx — Heart (save/wishlist)
│   ├── IconNavigationHome.tsx     — Clean house silhouette
│   ├── IconNavigationMenu.tsx     — Hamburger (3 lines)
│   ├── IconNavigationOrders.tsx   — Stacked boxes (order history)
│   ├── IconNavigationProfile.tsx  — Person circle (account)
│   ├── IconNavigationSearch.tsx   — Magnifying glass
│   └── IconNavigationSettings.tsx — Gear/cog (settings)
├── payment/
│   ├── IconPaymentAirtel.tsx  — Phone with Airtel-red signal arc
│   ├── IconPaymentBank.tsx    — Building with columns (bank)
│   ├── IconPaymentCod.tsx     — Hand holding coins (cash)
│   ├── IconPaymentGeneric.tsx — Phone with currency symbol
│   ├── IconPaymentMomo.tsx    — Phone with MTN-amber signal (MoMo)
│   └── IconPaymentShield.tsx  — Shield with checkmark (trusted)
└── product/
    ├── IconProductBreadLoaf.tsx  — Rounded loaf with score lines
    ├── IconProductCake.tsx       — Layered cake with decoration
    ├── IconProductCookie.tsx     — Round cookie with chips
    ├── IconProductCupcake.tsx    — Cupcake with swirl frosting
    ├── IconProductDonut.tsx      — Donut ring with glaze drip
    ├── IconProductPastry.tsx     — Croissant curved silhouette
    ├── IconProductStarRating.tsx — 5-point star (review/rating)
    └── IconProductTrending.tsx   — Upward arrow with sparkle
```

---

## Icon Design Standards — Per Category

### Admin Icons

| Icon | Key Shape | Must Convey | Bad to avoid |
|------|-----------|-------------|--------------|
| Analytics | 4 bars ascending left-to-right, baseline rule | Growth, data, metrics | Equal height bars, no baseline |
| Approved | Filled circle + bold checkmark inside | Confirmed, positive | Thin check, no circle |
| AuditLog | Document page + small checkmark at bottom-right | Record, compliance | Generic file icon |
| Customers | 2 person silhouettes (front + back) | Group, users | Single person |
| Inventory | Box/crate with lid lines | Stock, storage | Abstract squares |
| Pending | Clock with soft dashed outer ring | Waiting, in-progress | Solid clock (looks like "time") |
| Rejected | Filled circle + bold X inside | Declined, blocked | Thin X alone |
| Revenue | 2 stacked coin circles + vertical lines | Money, UGX | Dollar sign (not Ugandan) |
| Staff | Person with small badge/diamond on shoulder | Team member, role | Plain person silhouette |
| Suspended | Two overlapping pause bars in circle | Paused, frozen | Just two vertical bars |

### Navigation Icons

| Icon | Key Shape | Size notes |
|------|-----------|------------|
| Home | Bold house roof triangle + door rectangle | Visible at 16px |
| Search | Circle + handle line at 45° | Handle should be 45° not 135° |
| Cart | Basket body + 2 wheels or handles | Ugandan market basket feel |
| Orders | 2-3 stacked rectangles (boxes) | Overlapping, not aligned flat |
| Profile | Circle (head) + rounded torso arc | No fine detail |
| Favorites | Full heart, not outline | Filled = saved |
| Menu | 3 horizontal lines, proportional spacing | Middle line slightly shorter |
| Settings | 8-tooth gear OR rounded hexagon with hole | 6 teeth minimum |

### Payment Icons (Uganda-specific)

| Icon | Design notes | Color hint |
|------|-------------|------------|
| MoMo (MTN) | Phone with radiating arc + small coin | Amber arc |
| Airtel Money | Phone with signal bar | No color bias |
| Bank Transfer | Classical building with 3-4 columns | Solid/formal |
| Cash on Delivery | Open hand holding stacked coins | Warm, approachable |
| Shield (trust) | Shield body + checkmark | Minimal, bold |

### Product Icons (Bakery)

| Icon | Distinctive feature |
|------|---------------------|
| Bread Loaf | 3 diagonal score marks across dome |
| Cake | 2-layer body + candle or cherry top |
| Cookie | Circle + 6 chocolate chip dots |
| Cupcake | Tulip wrapper + dome swirl on top |
| Donut | Ring with irregular glaze drip one side |
| Pastry | Curved crescent + layered flake lines |

---

## Icon Component Props API

```typescript
interface IconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'  // 16, 20, 24, 32px
  color?: 'default' | 'accent' | 'success' | 'danger' | 'warning' | 'muted'
  state?: 'default' | 'hover' | 'active' | 'disabled'
  className?: string
  alt: string          // REQUIRED for accessibility
  'data-testid'?: string
}
```

**Color token mapping:**
- `default` → `currentColor` (inherits text color from parent)
- `accent` → `var(--platform-accent)` (#F9A931 or brand amber)
- `success` → `#22C55E` (green)
- `danger` → `#EF4444` (red)
- `warning` → `#F59E0B` (amber)
- `muted` → `var(--platform-fg-muted)` (40% opacity)

---

## Usage Rules

### DO
- Always pass `alt=""` for decorative icons (not read by screen readers)
- Pass descriptive `alt` text for icons that convey meaning alone
- Use `size="md"` (20px) for sidebar nav items
- Use `size="lg"` (24px) for page section headings
- Use `size="xl"` (32px) for empty state illustrations

### DO NOT
- Do not hardcode colors in SVG paths — use `currentColor` or `stroke="currentColor"`
- Do not use `fill="black"` or `fill="white"` — breaks dark/light mode
- Do not embed brand amber `#F9A931` directly in UI icons (only in favicons)
- Do not use raster images (PNG/JPG) for icons — SVG only
- Do not add icons with fewer than 2px stroke at 24px render size

---

## Improvement Backlog

Icons currently deployed but marked for redesign (too generic/thin):

| Icon | Issue | Priority |
|------|-------|----------|
| `IconAdminStaff` | Body path geometry awkward | HIGH |
| `IconNavigationHome` | Small window rect disappears at 16px | HIGH |
| `IconDeliveryBoda` | Too much detail, loses shape at sm | MEDIUM |
| `IconPaymentMomo` | Phone silhouette unclear | MEDIUM |
| `IconProductCake` | Looks too similar to cup | LOW |
| `IconInteractionEdit` | Pencil tip could be sharper | LOW |

When redesigning, update ALL three app copies simultaneously:
- `apps/customer/src/components/icons/[category]/Icon[Name].tsx`
- `apps/bakery-admin/src/components/icons/[category]/Icon[Name].tsx`
- `apps/super-admin/src/components/icons/[category]/Icon[Name].tsx`

---

## Redesign: HIGH Priority Icons

### IconAdminStaff — Improved Design

```tsx
// Person with badge: head circle + body arc + diamond badge
<circle cx="12" cy="7.5" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
<path d="M6 20 C6 15 8 13 12 13 C16 13 18 15 18 20" 
      stroke="currentColor" strokeWidth="2" fill="none" 
      strokeLinecap="round"/>
// Badge (diamond/role indicator) on shoulder
<path d="M17 10 L19 12 L17 14 L15 12 Z" 
      stroke="currentColor" strokeWidth="1.5" fill="none"/>
```

### IconNavigationHome — Improved Design

```tsx
// Simpler house: just roof triangle + body rect + door
// Remove the small window rect (lost at small sizes)
<path d="M12 3 L21 10 L21 21 C21 21.55 20.55 22 20 22 
         L15 22 L15 16 L9 16 L9 22 L4 22 C3.45 22 3 21.55 3 21 
         L3 10 Z" 
      stroke="currentColor" strokeWidth="2" fill="none"
      strokeLinecap="round" strokeLinejoin="round"/>
```

---

## File Locations Reference

| File | Purpose |
|------|---------|
| `apps/super-admin/public/favicon.svg` | Super admin tab icon (shield+crown) |
| `apps/bakery-admin/public/favicon.svg` | Bakery admin tab icon (bread loaf) |
| `apps/customer/public/favicon.svg` | Customer tab icon (bag+wheat) |
| `apps/super-admin/index.html` | Links to favicon, sets tab title "EGU Admin" |
| `apps/bakery-admin/index.html` | Links to favicon, sets tab title "EGU Bakery" |
| `apps/customer/index.html` | Links to favicon, sets tab title "Eat Good Uganda" |
| `docs/ICON_SYSTEM.md` | **This file** — single source of truth for icon design |
