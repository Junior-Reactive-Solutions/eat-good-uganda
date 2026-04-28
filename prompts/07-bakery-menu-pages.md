# Prompt 07 — Bakery Menu Pages

## Context

Landing page exists (prompt 06). No bakery-specific pages yet.

Read before starting:
- `docs/06-THEMING.md`
- `docs/01-ARCHITECTURE.md` (URL scheme)
- `instructions/07-frontend-rules.md`

## Goal

Build the bakery home, menu, and product detail pages at `/b/:slug/*`. Apply per-bakery theming. Build foundation for cart (prompt 08).

## Deliverables

### API

- `GET /v1/public/bakeries/:slug` — bakery profile including theme tokens and fulfilment settings.
- `GET /v1/public/bakeries/:slug/products?category=&page=` — published available products with variant previews (variant count, starting price).
- `GET /v1/public/bakeries/:slug/categories`.
- `GET /v1/public/bakeries/:slug/products/:productSlug` — full product detail with all variants.
- 404 when slug is invalid or bakery is not `active`.

### Pages

`apps/customer/src/pages/BakeryHomePage.tsx`:
- Wrapped by `BakeryThemeProvider`.
- Hero (bakery's hero image or fallback from `bakery-default-heroes/`).
- Bakery name, tagline, short description, address, phone.
- Hours (if we store them — not in v1 schema; show "Contact for hours" for now).
- "Browse menu" CTA scrolls or links to menu section.
- Category strip.
- Featured products (first 6 published products).

`apps/customer/src/pages/BakeryMenuPage.tsx`:
- Category sidebar (sticky on desktop, top-scrolling strip on mobile).
- Product grid: image, name, starting price, "Add" button (adds first variant to cart; products with multiple variants open the detail page instead).
- Pagination if > 40 products.
- Empty state per-category.

`apps/customer/src/pages/ProductDetailPage.tsx`:
- Image gallery (carousel, simple — no autoplay, keyboard navigable).
- Name, description, price.
- Variant selector (radio list or dropdown — pick based on variant count).
- Quantity input.
- "Special notes" textarea (cake messages, allergies).
- "Add to cart" button.
- Related products (same category, 4 items).

### Theming in action

All buttons, price tags, CTAs on these pages use `bakery-primary-*` Tailwind utilities so they adopt the bakery's colour.

### Cart hook (scaffold — detail in prompt 08)

`features/cart/store.ts`:
```ts
interface CartState {
  bakeryId: string | null
  bakerySlug: string | null
  items: CartItem[]
  addItem(...): void
  removeItem(...): void
  setQuantity(...): void
  clear(): void
}
```

Persists to `sessionStorage`. If a user tries to add an item from a different bakery, prompt: "Start a new order from <Bakery B>? Your cart from <Bakery A> will be cleared."

### Tests

- Integration: `GET /v1/public/bakeries/:slug` 404 when bakery inactive.
- Integration: `GET /v1/public/bakeries/:slug/products` filters by category.
- Integration: only published products appear.
- Component: `BakeryHomePage` applies theme correctly (test that a specific CSS variable is set).
- Component: adding from a different bakery shows the confirmation dialog.
- E2E: browse bakery → menu → product detail → add to cart → cart shows correct item.

## Constraints

- Variant prices replace base price once a variant is selected.
- Images respect Cloudinary transformation URLs for responsive sizes.
- Product description supports plain text with line breaks, no HTML.
- Special notes field: max 500 chars, validated client and server.

## Acceptance checklist

- [ ] All three pages render with correct theming.
- [ ] Adding to cart works; cart state persists across page reloads via sessionStorage.
- [ ] Switching bakeries warns before clearing cart.
- [ ] Product detail handles products with 0, 1, and many variants correctly.
- [ ] All tests pass.
- [ ] Lighthouse ≥ 90 Performance and ≥ 90 Accessibility on a real bakery page.
