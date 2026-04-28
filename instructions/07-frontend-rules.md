# 07 — Frontend Rules

## Stack

- **Build:** Vite 5.
- **Framework:** React 19.
- **Styling:** Tailwind CSS v3 (utility-first). No CSS-in-JS.
- **Routing:** react-router v7 (data router).
- **Server state:** TanStack Query (@tanstack/react-query).
- **Client state:** Zustand (only where needed).
- **Forms:** React Hook Form + `@hookform/resolvers/zod`.
- **Icons:** lucide-react.
- **Date formatting:** Intl.DateTimeFormat / Intl.RelativeTimeFormat. No moment, no dayjs.
- **Testing:** Vitest + Testing Library.

## File organisation

Feature-first. Not component-first.

```
apps/customer/src/
├── main.tsx
├── App.tsx
├── router.tsx
├── layouts/
├── pages/                    Route-level page components
├── features/
│   ├── auth/
│   │   ├── api.ts            TanStack Query mutations/queries
│   │   ├── hooks.ts
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── schemas.ts        Zod schemas imported from @eatgood/shared
│   ├── bakery/
│   ├── cart/
│   ├── checkout/
│   └── orders/
├── components/               Pure reusable UI (Button, Input, Card)
├── hooks/
├── lib/
└── styles/
```

## Component rules

- **One component per file.** Filename matches component name.
- **Function components only.** No class components.
- **< 200 LOC per component.** If bigger, split.
- **No prop drilling > 2 levels.** Use context or Zustand.
- **Props typed explicitly.** No `any`, no "inferred from usage".
- **Default props via destructuring**, not `defaultProps`.

## Styling

- **Tailwind utilities only.** No inline `style={}` except for theme CSS variables (`--bakery-primary`).
- **No `!important`.** If you need it, Tailwind is already doing the wrong thing and you should rethink.
- **Consistent spacing scale.** Use Tailwind's scale. Don't mix `px` and `rem` across components.
- **Responsive breakpoints:** mobile-first. `sm:` / `md:` / `lg:` / `xl:`. Default is mobile.
- **Accessibility:** see `instructions/10-accessibility-rules.md`.

## Theming

Per-bakery theme via CSS variables. See `docs/06-THEMING.md`. In components, use the registered Tailwind colour tokens:

```tsx
// ✅ Correct
<button className="bg-bakery-primary text-bakery-primary-foreground hover:bg-bakery-primary-600">
  Order now
</button>

// ❌ Wrong — hard-coded colour
<button className="bg-[#8B4513] text-white">
  Order now
</button>
```

## Data fetching

- **TanStack Query** owns all server state.
- Query keys are structured as arrays: `['bakery', slug, 'products']`, `['orders', 'mine']`.
- Mutations invalidate the specific keys they affect, not the whole query cache.
- Polling intervals set via `refetchInterval`: 5000 for bakery-admin order lists, 15000 for customer order status.
- Errors from TanStack Query are surfaced via a shared `<ErrorBoundary>` at the route level.

```tsx
export function useBakeryOrders() {
  return useQuery({
    queryKey: ['bakery', 'orders'],
    queryFn: () => api.get('/v1/bakery/orders').then(r => r.data),
    refetchInterval: 5000,
    staleTime: 0,
  })
}
```

## Forms

- RHF + Zod resolver, always.
- Zod schemas imported from `@eatgood/shared/schemas` — same schema for client and server.
- Submit button disabled while `form.formState.isSubmitting`.
- Server-side validation errors mapped back onto form fields by `setError('fieldName', { message })`.

## Auth

- Cookies are HTTP-only; the frontend does not read them.
- Auth state derived from a `GET /v1/<namespace>/me` call cached via TanStack Query.
- 401 response from any endpoint: invalidate the `me` query and redirect to login.
- Login on success: redirect to the `redirect` query parameter if set and on the same origin, otherwise home.

## Cart (customer app only)

- Zustand store.
- Persists to `sessionStorage` (NOT localStorage) so each browser session is independent.
  - *Note:* Persisting at all is a tradeoff — cart survival across accidental refresh is worth it. No sensitive data in the cart.
- Cart is scoped to one bakery. Switching bakeries empties the cart with a confirmation dialog.
- Cart totals are recomputed client-side for display but always re-verified server-side at checkout.

## Error handling

- Global error boundary catches React render errors; logs to Sentry; shows a user-friendly fallback.
- API errors presented inline via a `<FormError>` component or a toast (via `react-hot-toast`).
- No raw error messages to users. Map error codes to friendly strings in `packages/shared/errorMessages.ts`.

## Performance

- Lazy-load route-level chunks via `React.lazy` + `<Suspense>`.
- Images lazy-loaded with `loading="lazy"`.
- Cloudinary URL transformations for responsive sizes (`w_768,q_auto,f_auto`).
- Lighthouse: target ≥ 90 on Performance on the customer storefront on throttled 3G + mid-range Android emulation.
- Measure before optimising. No premature `useMemo`/`useCallback`.

## Accessibility

- See `instructions/10-accessibility-rules.md`.
- Lighthouse Accessibility score ≥ 90 on every customer-facing page.
- Every interactive element reachable by keyboard.
- Every form field has a label.
- Focus states are visible (no `outline:none` without a replacement).

## Logging & analytics

- Frontend logger is a thin wrapper over `console.*` in dev and Sentry in prod.
- No analytics in v1 beyond Vercel Web Vitals. Adding product analytics (Posthog, Mixpanel) is a v2 decision.

## Internationalisation

- All user-facing strings live in `packages/shared/locales/en.json`.
- Components consume them via a `useT()` hook.
- English only at MVP, but we never hard-code user-facing copy in components.

## What we do NOT do

- **No global CSS beyond `index.css`.** It contains only Tailwind directives and CSS-variable definitions.
- **No component libraries** beyond Tailwind and our own components. No MUI, no Chakra, no Ant Design, no shadcn-ui "install everything" pattern. If we copy a shadcn component, we copy it deliberately and own it.
- **No state managers beyond Zustand.** No Redux, no MobX, no Jotai.
- **No runtime form libraries beyond React Hook Form.**
- **No animation libraries in customer app.** Small CSS transitions only. Framer Motion is allowed in bakery-admin and super-admin where bundle size matters less.

## Browser support

- Last 2 major versions of Chrome, Edge, Firefox, Safari.
- Mobile Safari and Chrome on Android (latest 3 versions).
- No IE11. No legacy Edge (pre-Chromium).
