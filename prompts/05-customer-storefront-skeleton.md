# Prompt 05 — Customer Storefront Skeleton

## Context

Backend has bakeries (prompt 02–04). No customer frontend beyond `<App />` placeholder.

Read before starting:
- `docs/01-ARCHITECTURE.md` (URL scheme, state management)
- `docs/06-THEMING.md` (theming scope)
- `instructions/07-frontend-rules.md`

## Goal

Build the customer storefront shell: router, layout, platform chrome, theme provider scaffold, auth plumbing, shared components. No bakery pages yet (prompt 07). No landing page beyond placeholder (prompt 06).

## Deliverables

### Routing

`apps/customer/src/router.tsx`:

```
/                                   Landing (placeholder for prompt 06)
/b/:slug                            Bakery home (placeholder for prompt 07)
/b/:slug/products/:productSlug      Product detail (placeholder)
/b/:slug/checkout                   Checkout (placeholder for prompt 08)
/account                            Customer account
/account/orders                     Order list
/account/orders/:id                 Order detail
/login
/signup
/verify-email?token=...
/forgot-password
/reset-password?token=...
/privacy
/terms
/about
/contact
```

`/admin` and `/admin/*` are NOT React routes (prompt 11 sets up the real 403; for now, ensure they are not React routes — do not add them).

### Layout

`apps/customer/src/layouts/PublicLayout.tsx`:
- Top nav with logo, "All bakeries", account menu (login / account).
- Footer with links (Privacy, Terms, About, Contact).
- `<BakeryThemeProvider>` wraps `<Outlet />` when on a `/b/:slug/*` route.

`apps/customer/src/layouts/AccountLayout.tsx`:
- Sidebar: Profile, Orders, Favourites, Logout.
- Eat Good Uganda chrome only (no bakery theming — this is platform-scoped).

### Auth plumbing

- `features/auth/hooks.ts`: `useMe()` using TanStack Query to `GET /v1/customer/me`.
- `features/auth/LoginForm.tsx`, `SignupForm.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`.
- `lib/api.ts`: Axios instance with `withCredentials: true`, CSRF header injection, 401 interceptor that invalidates `me` and redirects to `/login`.
- Route guards: `<RequireAuth />` wrapping `/account/*`.

### Shared components

In `apps/customer/src/components/`:
- `Button.tsx` (variants: primary, secondary, ghost, danger; sizes: sm, md, lg)
- `Input.tsx` (text, email, tel, password, textarea) with built-in label + error
- `Card.tsx`
- `FormError.tsx`
- `Skeleton.tsx`
- `LoadingSpinner.tsx`
- `Toast.tsx` (uses react-hot-toast)
- `EmptyState.tsx`
- `PageHeader.tsx`

All accessible (labels, aria, focus rings) per `instructions/10-accessibility-rules.md`.

### Theme scaffold

`features/bakery/BakeryThemeProvider.tsx` per `docs/06-THEMING.md`. For now, it reads from TanStack Query's `['bakery', slug]` cache and applies CSS variables. Actual bakery-page content comes in prompt 07.

Tailwind config includes the `bakery-primary-*` colour tokens.

### Platform styles

`styles/platform-theme.css` with the platform's own CSS variables (`--platform-bg`, `--platform-fg`, `--platform-primary`, etc.) — Eat Good Uganda branding.

Choose a platform palette:
- Primary: a warm brown (`#8B4513` — saddle brown — bakery-appropriate)
- Accent: a cream / off-white
- Background: near-white with slight warmth
- Foreground: near-black

### Tests

- Smoke test: each layout renders without crashing.
- Component tests for `Button`, `Input`, `FormError`.
- Auth flow component tests: login form submits, shows errors, calls the right endpoint.
- E2E: `/login` → successful login → `/account` → logout → back to `/`.

## Constraints

- Mobile-first. Layouts work at 360px viewport before desktop.
- Lighthouse Performance ≥ 90 at this stage (easy because there's barely anything rendered).
- Lighthouse Accessibility ≥ 95.
- No additional dependencies beyond those listed in `instructions/07-frontend-rules.md`.

## Acceptance checklist

- [ ] Router works, all placeholder routes render without error.
- [ ] Auth flows (login, signup, forgot, reset, verify-email) work end-to-end against the API.
- [ ] `<BakeryThemeProvider>` applies CSS variables on `/b/:slug/*` routes (verified with a stub bakery).
- [ ] Shared components are accessible and documented in Storybook (stretch goal) or at least in a /dev page listing examples.
- [ ] All tests pass.
