# 10 — Accessibility Rules

All changes to Eat Good Uganda must comply with WCAG 2.1 Level AA standards. This ensures the platform is accessible to users with disabilities including vision impairments, hearing loss, mobility limitations, and cognitive disabilities.

## WCAG 2.1 Level AA Compliance

**Non-negotiable requirements:**

- **Perceivable:** Users must be able to perceive information presented in the user interface
- **Operable:** Users must be able to operate the user interface using various input methods
- **Understandable:** Users must be able to understand the information and operation of the user interface
- **Robust:** Content must be compatible with assistive technologies

## Color Contrast

All text must meet WCAG AA contrast ratios:

- **Normal text (< 18pt):** Minimum 4.5:1 contrast ratio (dark on light or light on dark)
- **Large text (≥ 18pt or ≥ 14pt bold):** Minimum 3:1 contrast ratio
- **Decorative elements:** No minimum if non-essential to understanding
- **UI components and graphical objects:** Minimum 3:1 for boundaries and visual indicators

### Contrast Validation

Bakery theme colors are validated at setup via contrast checker in `packages/shared/src/accessibility/contrast.ts`:

```typescript
export function validateThemeContrast(theme: BakeryTheme): {
  valid: boolean
  errors: string[]
  warnings: string[]
}
```

**Rules:**
- Primary text on primary background must pass 4.5:1
- Secondary text on secondary background must pass 4.5:1
- Accent colors on backgrounds must pass at least 3:1
- Reject themes that fail critical ratios
- Warn (but allow) themes that fail secondary ratios

## Keyboard Navigation

**All interactive elements must be keyboard accessible:**

- **Focusable elements:** Links, buttons, form inputs, modal dialogs, menu items
- **Tab order:** Logical reading order, left-to-right, top-to-bottom
- **Focus visible:** Always visible indicator (focus ring, outline, or background change)
- **Skip links:** "Skip to main content" link on every page (visually hidden, visible on focus)
- **Modals:** Focus trap (Tab stays within modal, Escape closes)
- **Dropdowns:** Arrow keys navigate, Enter/Space select, Escape closes
- **Forms:** Tab through fields in order, Enter submits (if unambiguous)

## Semantic HTML

- Use correct HTML elements: `<button>` for buttons, `<a>` for links, `<form>` for forms
- Use `<label>` for form inputs (not just placeholder text)
- Use heading hierarchy: `<h1>` once per page, `<h2>`, `<h3>` for sections (never skip levels)
- Use lists: `<ul>`, `<ol>` for lists (not divs)
- Use `<fieldset>` and `<legend>` for grouped form controls
- Use `<nav>`, `<main>`, `<aside>`, `<footer>` for page structure

## ARIA Usage

Use ARIA attributes to enhance semantics when HTML alone is insufficient. **Avoid ARIA when semantic HTML is available.**

**Common ARIA attributes:**

- `aria-label` — Screen reader text for unlabeled elements
- `aria-labelledby` — Reference to element that labels this element
- `aria-describedby` — Reference to element that describes this element
- `aria-live` — Announce dynamic content changes (polite | assertive | off)
- `aria-hidden="true"` — Hide decorative elements from screen readers
- `aria-expanded` — Toggle state for expandable components
- `aria-pressed` — Toggle state for toggle buttons
- `aria-current="page"` — Mark current page in navigation
- `aria-invalid` — Mark invalid form fields
- `role` — Override or enhance element role (use sparingly)

**Examples:**

```typescript
// Button with icon only
<button aria-label="Close menu">
  <Icon />
</button>

// Menu disclosure button
<button aria-expanded={isOpen} aria-controls="menu">
  Menu
</button>
<ul id="menu" hidden={!isOpen}>
  ...
</ul>

// Live region for form errors
<div aria-live="polite" aria-atomic="true">
  {error && <p>{error}</p>}
</div>

// Icon-only actions
<button aria-label="Add to cart">
  <ShoppingCartIcon />
</button>
```

## Form Accessibility

- **Labels:** Every input must have an associated `<label>`
- **Placeholder text:** Not a substitute for labels (too low contrast, disappears)
- **Error messages:** Associated via `aria-describedby`
- **Error announcement:** Use `aria-live="polite"` to announce validation errors
- **Required fields:** Mark with `required` attribute or aria-label
- **Disabled state:** Use `disabled` attribute (don't fake with opacity)
- **Help text:** Associated via `aria-describedby`

**Form example:**

```typescript
<form onSubmit={handleSubmit}>
  <div>
    <label htmlFor="email">Email *</label>
    <input
      id="email"
      type="email"
      required
      aria-describedby={emailError ? 'email-error' : undefined}
    />
    {emailError && (
      <span id="email-error" className="error">
        {emailError}
      </span>
    )}
  </div>

  <div aria-live="polite" aria-atomic="true">
    {formError && <p>{formError}</p>}
  </div>

  <button type="submit">Submit</button>
</form>
```

## Focus Management

- **Focus visible:** Every focusable element must have a visible focus indicator
  - Default browser outline is acceptable if styled clearly
  - Custom focus rings should be ≥ 2px, 3:1 contrast against background
- **Focus order:** Logical reading order (implement with HTML order, not tabindex)
- **Focus persistence:** Focus returns to trigger element when modal closes
- **Focus restoration:** Restore focus when user navigates back
- **No focus traps:** Users can always navigate away without keyboard alone

## Alternative Text

- **Images:** Every `<img>` needs alt text describing the image
  - Decorative images: `alt=""` (empty string, not omitted)
  - Content images: Concise description (5-125 characters)
  - Images of text: Transcribe the text
  - Logos: Company name or "Logo"
  - Icons: Context-dependent (often empty if text adjacent, or labeled button)

**Examples:**

```typescript
// Content image
<img
  src="bakery-photo.jpg"
  alt="Inside Kampala Crust bakery with fresh bread on shelves"
/>

// Icon button
<button aria-label="Add to cart">
  <ShoppingCartIcon />
</button>

// Decorative image
<img src="divider.svg" alt="" />

// Chart with description
<img
  src="sales-chart.svg"
  alt="Line chart showing sales by month, January highest at 2000 units"
/>
```

## Video and Audio Content

- **Videos:** Captions for dialogue and important sound effects
- **Audio:** Transcript provided
- **Autoplay:** Never autoplay audio or video
- **Controls:** Always provide play/pause/volume controls

## Color Usage

- **Don't use color alone:** Don't convey information using color only (e.g., "error in red")
- **Combine with text or icons:** Always pair color with text, icons, or patterns
- **Red-green pairs:** Avoid relying on red-green distinction (colorblind users)

**Examples:**

```typescript
// ❌ Bad: only color shows status
<div className="bg-red-500" />

// ✅ Good: color + text + icon
<div className="flex items-center gap-2 bg-red-500 text-white">
  <ErrorIcon />
  <span>Error: Invalid email</span>
</div>

// ✅ Good: color + pattern for charts
<div className="bg-blue-500" style={{ pattern: 'diagonal-lines' }} />
<div className="bg-red-500" style={{ pattern: 'dots' }} />
```

## Mobile and Touch Accessibility

- **Touch targets:** Minimum 44×44px for interactive elements (WCAG AAA)
- **Spacing:** At least 8px between touch targets
- **No hover-only:** Don't hide content on hover only (mobile users can't hover)
- **Readable text:** Minimum 16px font size for body text (no auto-zoom disability)
- **Zoom support:** Allow 200% zoom without loss of content (use rem for sizing)

## Content Accessibility

- **Language:** Mark document language: `<html lang="en">`
- **Abbreviations:** Explain first use or use `<abbr>` tag
- **Page titles:** Unique, descriptive, reflect page content
- **Headings:** Concise, reflect content structure, no skipped levels
- **Lists:** Use semantic HTML, not visual styling
- **Data tables:** Use proper structure with `<thead>`, `<th>`, `<tbody>`, `<caption>`
- **Complex jargon:** Define or simplify for plain language

## Testing

### Automated Testing

Use tools to catch common issues:

- **axe DevTools** — Browser extension for accessibility audits
- **WAVE** — Web Accessibility Evaluation Tool
- **Lighthouse** — Google Chrome built-in audit (Accessibility tab)
- **Playwright accessibility checks** — E2E test assertions

**Example Playwright test:**

```typescript
import { injectAxe, checkA11y } from 'axe-playwright'

test('customer home page is accessible', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await injectAxe(page)
  await checkA11y(page)
})
```

### Manual Testing

- **Keyboard only:** Navigate entire application using Tab, Shift+Tab, Enter, Escape, Arrow keys
- **Screen reader:** Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)
  - Verify all content is announced
  - Verify form labels are announced
  - Verify errors are announced
  - Verify dynamic updates are announced
- **Browser zoom:** Test at 200% zoom without horizontal scroll
- **Color contrast:** Use contrast checker on all text and UI elements
- **Mobile:** Test on mobile devices (not just browser emulation)

### Accessibility Checklist

Before any release:

- [ ] All pages tested with WCAG 2.1 Level AA automated tools
- [ ] Keyboard navigation works (Tab, Shift+Tab, Enter, Escape, arrows)
- [ ] Screen reader tested (at least one tool: NVDA, JAWS, VoiceOver)
- [ ] Color contrast validated (4.5:1 normal, 3:1 large)
- [ ] All images have alt text
- [ ] Form labels properly associated
- [ ] Error messages announced to screen readers
- [ ] Focus indicators visible on all elements
- [ ] No focus traps (unless intentional, e.g., modals)
- [ ] Mobile touches ≥ 44×44px
- [ ] Zoom to 200% works without horizontal scroll
- [ ] No content relying on color alone
- [ ] Data tables properly marked up
- [ ] Page has unique, descriptive title

## Accessibility Champions

- **Bakery app:** Logo, colors, theming must meet contrast requirements
- **Customer app:** Product images, descriptions, cart must be fully accessible
- **Admin apps:** Complex dashboards, tables, and filters must be keyboard navigable
- **API:** Error messages and documentation must be clear and unambiguous

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Material Design Accessibility](https://material.io/design/usability/accessibility.html)
- [React a11y ESLint Plugin](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)

## Exceptions

Accessibility exceptions require documented justification:

- Third-party components that don't meet WCAG (with remediation plan)
- Legacy code with technical debt (with timeline to fix)
- Experimental features (with accessibility improvement roadmap)

All exceptions must be reviewed and approved before release.
