# 10 — Accessibility Rules

Philosophy: see `docs/12-TESTING.md` for testing strategy. This file is the enforceable checklist for WCAG 2.1 AA compliance.

## Mandatory Requirements

### Color Contrast

- **Normal text:** 4.5:1 contrast ratio minimum
- **Large text (18pt+ or 14pt bold):** 3:1 contrast ratio minimum
- **UI components (buttons, inputs):** 3:1 contrast ratio against adjacent color

```ts
// Validate in theming engine
function validateContrast(fg: string, bg: string): boolean {
  const ratio = getContrastRatio(fg, bg)
  return ratio >= 4.5
}
```

Reject any bakery theme that doesn't meet these ratios.

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order must be logical (top-to-bottom, left-to-right)
- Focus indicator must be visible on all focusable elements
- Skip-to-content link required on every page

```tsx
// ✅ Correct
<button onClick={submit}>Submit</button>
<a href="/cart">View cart</a>

// ❌ Wrong - not keyboard accessible
<div onClick={submit}>Submit</div>
```

### Screen Reader Support

- All images must have descriptive alt text
- Form inputs must have associated labels
- Error messages must be announced
- ARIA attributes used correctly (and only when needed)

```tsx
// ✅ Correct
<input id="email" label="Email address" />
<img src="cake.jpg" alt="Chocolate layer cake" />
<button aria-label="Close dialog">×</button>

// ❌ Wrong
<input placeholder="Email" />  {/* no label */}
<img src="cake.jpg" />          {/* no alt */}
```

### Focus Management

- Modals must trap focus inside
- Focus must return to trigger element when modal closes
- Page changes must announce new content to screen readers

### Forms

- Every input has a visible label
- Required fields are marked (visual + ARIA)
- Error messages are specific and associated with fields
- Validation errors announced on submit

## Implementation Rules

### Do

- Use semantic HTML (`<button>`, `<a>`, `<label>`, `<nav>`, `<main>`)
- Use `<main>` for primary content
- Use `<nav>` for navigation regions
- Use `<h1>` through `<h6>` in correct hierarchy
- Test with keyboard only (no mouse)

### Don't

- Use `div` or `span` for clickable elements
- Use `color` alone to convey meaning
- Use auto-playing media without controls
- Create content that flashes more than 3 times per second

## Testing Requirements

### Pre-commit Checklist

- [ ] Tested with keyboard only
- [ ] Tested with screen reader (NVDA/VoiceOver)
- [ ] Color contrast passes 4.5:1 (normal text)
- [ ] All images have alt text
- [ ] Form labels are visible and associated

### Tools

- `eslint-plugin-jsx-a11y` for code-level checks
- Browser DevTools Accessibility inspector
- Lighthouse accessibility audit (target: 90+)

## Mobile Accessibility

- Touch targets minimum 44x44 pixels
- Sufficient spacing between interactive elements
- Text resize works without breaking layout
- No horizontal scroll at 320px viewport

## Acceptance Criteria

| Criterion | Target |
|-----------|--------|
| Lighthouse Accessibility | ≥ 90 |
| Keyboard-only navigation | All flows work |
| Screen reader | Core flows work |
| Color contrast | 4.5:1 minimum |
| Touch targets | 44px minimum |

See: `docs/12-TESTING.md`, `docs/14-SECURITY.md`