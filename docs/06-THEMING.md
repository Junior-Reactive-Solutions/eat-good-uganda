# 06 — Theming

## Scope for v1 (light theming)

The customer storefront stays branded **Eat Good Uganda**. When a customer enters a specific bakery's pages (`/b/:slug/*`), the following elements adopt that bakery's identity:

- Primary colour (buttons, links, header accents)
- Logo (in the bakery's sub-header)
- Hero image (on the bakery home page)
- Accent colour (optional secondary accent)
- Display name and tagline (heading text)

Everything else — the main site chrome, the checkout footer, the platform navigation — stays Eat Good Uganda. This is deliberate for v1: it communicates that customers are on a platform, not a private site, which builds trust with the "is this real?" problem that new bakeries face.

Full-takeover theming (option ii in the planning conversation) is reserved for v2. The data model already supports it; the UI just doesn't activate it yet.

## Data model

Theming is driven by fields on `bakeries`:

```sql
primary_color   text NOT NULL DEFAULT '#8B4513'   -- hex, 7 chars including #
accent_color    text                              -- optional
logo_url        text                              -- Cloudinary
hero_image_url  text                              -- Cloudinary
```

That is it. No separate `themes` table. Themes are not portable between bakeries; they are properties of the bakery itself.

We store colours as hex strings, not RGB tuples or HSL objects. Reasons:

- Simpler input UI (one colour picker)
- Hex is what designers paste in
- Conversion to HSL/derived shades happens client-side on mount

## How theming is applied

The customer app uses a `BakeryThemeProvider` that mounts once per bakery route and sets CSS custom properties on a scoped wrapper:

```tsx
// apps/customer/src/features/bakery/BakeryThemeProvider.tsx
import { deriveTheme } from '@eatgood/shared/theme'

export function BakeryThemeProvider({ bakery, children }) {
  const tokens = useMemo(
    () => deriveTheme(bakery.primary_color, bakery.accent_color),
    [bakery.primary_color, bakery.accent_color],
  )

  return (
    <div className="bakery-theme-scope" style={tokens as React.CSSProperties}>
      {children}
    </div>
  )
}
```

Derived tokens (computed from `primary_color`):

```ts
// packages/shared/src/theme/derive.ts
export function deriveTheme(primary: string, accent?: string) {
  const hsl = hexToHsl(primary)
  return {
    '--bakery-primary': primary,
    '--bakery-primary-50': hslString({ ...hsl, l: 97 }),
    '--bakery-primary-100': hslString({ ...hsl, l: 94 }),
    '--bakery-primary-200': hslString({ ...hsl, l: 86 }),
    '--bakery-primary-300': hslString({ ...hsl, l: 77 }),
    '--bakery-primary-400': hslString({ ...hsl, l: 66 }),
    '--bakery-primary-500': primary,
    '--bakery-primary-600': hslString({ ...hsl, l: Math.max(hsl.l - 10, 20) }),
    '--bakery-primary-700': hslString({ ...hsl, l: Math.max(hsl.l - 20, 15) }),
    '--bakery-primary-800': hslString({ ...hsl, l: Math.max(hsl.l - 28, 10) }),
    '--bakery-primary-900': hslString({ ...hsl, l: Math.max(hsl.l - 35, 6) }),
    '--bakery-primary-foreground': pickForeground(primary), // white or near-black for contrast
    '--bakery-accent': accent ?? primary,
  }
}
```

`pickForeground` computes relative luminance and returns `#FFFFFF` if the colour is dark enough for white text, otherwise a dark grey. This keeps accessibility contrast guaranteed regardless of what colour the bakery picks.

## Tailwind integration

Tailwind config registers the CSS variables as colour utilities:

```js
// apps/customer/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'bakery-primary': 'var(--bakery-primary)',
        'bakery-primary-50': 'var(--bakery-primary-50)',
        'bakery-primary-100': 'var(--bakery-primary-100)',
        // ... etc through 900
        'bakery-primary-foreground': 'var(--bakery-primary-foreground)',
        'bakery-accent': 'var(--bakery-accent)',
      },
    },
  },
}
```

Components within a `BakeryThemeProvider` can then use `bg-bakery-primary text-bakery-primary-foreground hover:bg-bakery-primary-600` and get the bakery's colour automatically.

Outside the provider (landing page, account page, super-admin), those utilities resolve to the `--bakery-primary` default set in `globals.css` — which we set to Eat Good Uganda's brand colour.

## Platform theme

Eat Good Uganda's own theme (landing page chrome, checkout framing) uses a separate token set:

```
--platform-bg
--platform-fg
--platform-primary
--platform-primary-foreground
--platform-muted
--platform-border
--platform-success
--platform-warning
--platform-destructive
```

These are defined in `apps/customer/src/styles/platform-theme.css` and do not change per bakery.

## Accessibility validation

On profile update in the bakery admin:

```ts
import { validateContrast } from '@eatgood/shared/theme'

// in PATCH /v1/bakery/profile handler
const fg = pickForeground(body.primary_color)
const ratio = contrastRatio(fg, body.primary_color)
if (ratio < 4.5) {
  return res.status(422).json({
    error: 'validation_failed',
    details: [
      {
        field: 'primary_color',
        code: 'insufficient_contrast',
        message: 'This colour does not provide enough contrast for text. Try a darker shade.',
      },
    ],
  })
}
```

This prevents a bakery from picking a neon yellow that looks terrible and fails WCAG AA.

## Hero image handling

The hero image is a Cloudinary upload sized for display at 1920x800 maximum. Cloudinary URL transformations generate responsive variants:

```
https://res.cloudinary.com/eatgood/image/upload/
  c_fill,w_1920,h_800,q_auto,f_auto/
  bakeries/<bakery_id>/hero.jpg

Narrow viewport:
  c_fill,w_768,h_400,q_auto,f_auto/...
```

The bakery admin form enforces a 16:9 aspect ratio on upload (cropping is done client-side with `react-image-crop` before sending to Cloudinary).

If a bakery has no hero image, a stock image from Cloudinary's `bakery-default-heroes/` folder is selected deterministically by bakery id, so every bakery always has something visually interesting even before they upload their own.

## Logo handling

- Expected aspect ratio: roughly square, 500x500 maximum.
- Display sizes: 48px (navbar), 96px (bakery page header), 32px (order confirmation email).
- Cloudinary generates the smaller sizes on demand.
- Fallback: the first letter of the bakery's `display_name` on a coloured circle (primary colour background, primary foreground letter).

## Caching

Theme data is part of the bakery profile response and is cached:

- Client: 5 minutes via TanStack Query
- Server: no cache — bakery profile changes should reflect immediately

## What this system does NOT attempt

- **Custom fonts per bakery.** Typography is Eat Good Uganda's. A bakery picking Comic Sans would make the platform look unprofessional.
- **Custom component layouts per bakery.** The menu page layout is the same for every bakery; the content is what differs.
- **Dark-mode opt-in per bakery.** Dark mode is a user preference, not a bakery setting.
- **CSS-in-JS styling per bakery.** Adds bundle size, complicates SSR if we ever add it, and is not needed when CSS variables solve the problem.

Future (v2) extensions when we graduate to full-takeover theming:

- Hide platform chrome
- Custom fonts (from a curated allowlist)
- Custom layout slots
- Custom domain
