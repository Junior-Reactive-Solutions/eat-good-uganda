# Prompt 15 — Theming Engine

## Context

Bakery theming is partially implemented across earlier prompts (colour on profile, CSS variables via `BakeryThemeProvider`). This prompt formalises and completes it.

Read before starting:
- `docs/06-THEMING.md`

## Goal

Complete the theming engine: derive palette from primary colour, enforce contrast, handle fallbacks, integrate with Tailwind, apply to emails.

## Deliverables

### `packages/shared/src/theme/`

- `derive.ts` — produces the full 50→900 palette from a primary hex.
- `contrast.ts` — `contrastRatio(a, b)`, `pickForeground(bg)`, `validateThemeColor(hex, { minContrast })`.
- `hexToHsl`, `hslToHex`, `hslString` helpers.
- Tests covering a range of primary colours.

### Provider

`apps/customer/src/features/bakery/BakeryThemeProvider.tsx` — finalised. Uses `deriveTheme` to set CSS variables. Provides a `useBakeryTheme()` hook that returns the current tokens.

### Tailwind integration

Confirm `apps/customer/tailwind.config.js` registers all `bakery-primary-*` utilities. Add `bakery-accent`, `bakery-accent-foreground`.

### Fallback behaviour

- When not inside a `BakeryThemeProvider`, `bakery-primary` resolves to the platform brand colour (EGU's saddle brown).
- Missing `primary_color` from API: fall back to platform brand colour.
- Missing `logo_url`: fall back to a coloured-letter circle (first letter of display name, bakery primary background).

### Email theming

Transactional emails use the bakery's primary colour sparingly — just for the primary CTA button and a small colour bar at the top. The rest of the email remains neutral. This keeps emails accessible across mail clients.

Templates in `packages/shared/email-templates/` receive bakery tokens as compile-time data (for the specific template instance) and inline the colour into the HTML.

### Accessibility validation

On `PATCH /v1/bakery/profile` when `primary_color` changes:
- Compute foreground contrast.
- If < 4.5:1, return 422 with a helpful message.
- Suggest darker/lighter alternatives in the error.

### Tests

- Unit: `deriveTheme` produces a reasonable palette for a range of primaries.
- Unit: contrast validation rejects bad choices, accepts good ones.
- Integration: PATCH with poor-contrast colour is rejected.
- Component: `BakeryThemeProvider` sets expected CSS variables on a stub bakery.
- Visual regression: not in scope for MVP.

## Constraints

- Themeing never introduces bundle bloat — all derivation is pure functions on small objects.
- No runtime CSS injection via JS — CSS variables only.
- Emails use static inline colour values, not CSS variables (mail clients don't support them).

## Acceptance checklist

- [ ] Theming works on bakery home, menu, product detail, checkout.
- [ ] Platform chrome (nav, footer) stays EGU-branded as intended.
- [ ] Poor-contrast colour rejected at update.
- [ ] Transactional email to a bakery's customer has a subtle colour accent.
- [ ] Tests pass.
