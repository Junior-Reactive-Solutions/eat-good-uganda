# Eat Good Uganda Icon System Style Guide

## Visual Language Overview

The Eat Good Uganda icon system embodies warmth, approachability, and cultural relevance. Each icon is hand-crafted with a slightly imperfect, sketchy quality that mirrors the platform's wireframe aesthetic—creating a friendly, human-centered experience across all surfaces.

### Design Philosophy

Our icons are **warm and organic**, not cold or generic. They feature:

- **Rounded corners** that eliminate harsh angles and create approachability
- **Curved, flowing strokes** that feel hand-drawn and natural
- **Consistent stroke weight** that maintains visual harmony across sizes
- **Minimal complexity** that ensures clarity at any scale
- **Culturally grounded design** reflecting Uganda's payment and delivery ecosystem
- **Subtle asymmetry** that adds character without sacrificing clarity

This system serves as the visual signature of Eat Good Uganda, instantly recognizable across the customer app, bakery admin portal, and super admin dashboard.

## Additional Resources

For complete implementation guidance, see:

- [Icon Usage Guide](./ICON_USAGE_GUIDE.md) - How to use each icon in React components
- [Icon Accessibility Guide](./ICON_ACCESSIBILITY.md) - Accessibility labels and ARIA attributes
- [Brand Guidelines](./ICON_BRAND_GUIDELINES.md) - Design standards and visual language
- [Do's and Don'ts](./ICON_DO_AND_DONT.md) - Best practices and common mistakes
- [Animation Guidelines](./ICON_ANIMATIONS.md) - Animation recommendations and examples

---

## 1. Grid & Metrics

### Base Grid

- **Dimensions:** 24px × 24px (primary design size)
- **Grid Units:** 1px square grid alignment
- **Safe Zone:** 2–3px internal padding from the 24px boundary
- **Actual Content Area:** 20px × 20px (accounting for padding)

### Scaling Rules

Icons are designed at 24px and scale proportionally across all sizes:

| Size     | Stroke Weight | Use Cases                                      |
| -------- | ------------- | ---------------------------------------------- |
| **24px** | 2px           | UI controls, small buttons, list items         |
| **32px** | 2.67px        | Standard icon display, navigation items        |
| **48px** | 4px           | Hero sections, large buttons, featured content |
| **64px** | 5.33px        | Marketing materials, high-prominence sections  |

**Formula:** Stroke = 2px × (target size ÷ 24px)

### Corner Radius

- **Minimum:** 3px (at 24px size; scales proportionally)
- **Maximum:** 4px (maintains warmth without becoming too soft)
- **Application:** Apply to all corners and curves; no sharp angles anywhere

### Stroke Specifications

- **Type:** Stroke (not fill)
- **LineCap:** `round` (creates soft endpoints)
- **LineJoin:** `round` (curves at intersections)
- **Fill:** None (transparent) for outline icons
- **Stroke Color:** #333333 (dark gray) — primary outline

---

## 2. Color Palette

### Primary Colors

| Color           | Hex     | Usage                                      | Context                 |
| --------------- | ------- | ------------------------------------------ | ----------------------- |
| **Outline**     | #333333 | Icon strokes, primary visual               | All icons               |
| **Warm Accent** | #FF6B35 | Highlight important details, money symbols | Payment icons, emphasis |
| **Disabled**    | #CCCCCC | Inactive/disabled states                   | Interactive states      |

### Status Colors (Secondary)

| Color              | Hex     | Meaning                     | Use Cases         |
| ------------------ | ------- | --------------------------- | ----------------- |
| **Success Green**  | #4CAF50 | Completed, active, approved | Status indicators |
| **Warning Yellow** | #FFC107 | Pending, caution, waiting   | Status indicators |
| **Alert Red**      | #F44336 | Error, failure, critical    | Status indicators |
| **Info Blue**      | #2196F3 | Information, processing     | Status indicators |

### Color Usage Guidelines

1. **Outline (#333333):** Default stroke for all icon elements
2. **Warm Accent (#FF6B35):**
   - Use strategically to highlight key symbols (money symbols, important features)
   - Never fill entire icon; accent 1–2 key elements only
   - Creates warmth and draws focus without overwhelming
3. **Disabled (#CCCCCC):**
   - Applied to entire icon when disabled
   - Signals unavailability without removing from view
4. **Status Colors:**
   - Used only in conjunction with an icon (e.g., green highlight on a successful delivery icon)
   - Never as primary icon stroke; always as secondary accent or fill

---

## 3. Icon Design Principles

### Principle 1: Warm & Approachable

✅ **DO:**

- Use curved, flowing lines
- Round all corners (never sharp angles)
- Add subtle organic imperfections
- Apply warm accent color (#FF6B35) to highlight key elements

❌ **DON'T:**

- Create rigid, geometric shapes
- Use sharp 90° angles or points
- Fill entire icon with accent color
- Make icons feel mechanical or cold

### Principle 2: Hand-Crafted Feel

✅ **DO:**

- Allow slight asymmetry to add character
- Vary stroke endpoints slightly
- Create sketchy, imperfect quality
- Use rounded line caps and joins

❌ **DON'T:**

- Make icons perfectly symmetrical (feels machine-made)
- Use sharp edges or clean geometry
- Apply perfect mathematical precision
- Create icons that look computer-generated

### Principle 3: Consistent Stroke Weight

✅ **DO:**

- Maintain 2px stroke throughout (at 24px size)
- Apply stroke weight consistently across all icon elements
- Use the same stroke color for all outlines

❌ **DON'T:**

- Mix stroke weights (e.g., 2px and 1.5px in same icon)
- Use fill and stroke together (outline only)
- Vary stroke colors unpredictably

### Principle 4: Recognizable at Any Size

✅ **DO:**

- Simplify shapes to essential forms
- Maintain adequate spacing between elements
- Use clear, distinct silhouettes
- Test icons at 24px, 32px, and 48px

❌ **DON'T:**

- Add intricate details that disappear at small sizes
- Crowd elements together
- Create ambiguous or confusing symbols
- Forget to test across all sizes

### Principle 5: Culturally Relevant

✅ **DO:**

- Design payment icons reflecting Uganda's ecosystem (MoMo, Airtel, banks)
- Create delivery icons relevant to Uganda (boda-boda motorcycles)
- Use symbols familiar to East African users
- Honor local context in visual metaphors

❌ **DON'T:**

- Use generic, location-agnostic designs
- Include unfamiliar payment systems
- Ignore cultural context
- Create icons that feel imported or out-of-place

### Principle 6: Grid-Based Alignment

✅ **DO:**

- Place all key points on the 24px grid
- Align circles to grid centers
- Use grid units for spacing
- Verify alignment at 24px before scaling

❌ **DON'T:**

- Use arbitrary decimal coordinates
- Place elements off-grid
- Assume grid alignment will scale correctly
- Skip verification at native size

---

## 4. Stroke Weight Scaling

### How to Scale Icons Correctly

When resizing an icon from 24px to another size, scale the entire SVG (width, height, viewBox) but adjust stroke weight separately:

#### Method 1: CSS Transform

```css
/* At 32px, use SVG at 24px with stroke scaling */
<svg width="24" height="24" viewBox="0 0 24 24" class="icon-32">
  <circle cx="12" cy="12" r="10" stroke="#333333" stroke-width="2.67" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

/* CSS */
.icon-32 {
  width: 32px;
  height: 32px;
  transform: scale(1.333);
  transform-origin: center;
}
```

#### Method 2: Direct Stroke Adjustment

```xml
<!-- At 24px: stroke-width="2" -->
<svg width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" stroke="#333333" stroke-width="2" fill="none"/>
</svg>

<!-- At 32px: stroke-width="2.67" -->
<svg width="32" height="32" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" stroke="#333333" stroke-width="2.67" fill="none"/>
</svg>
```

#### Method 3: SVG with presentation attributes

For most implementations, design at 24px with 2px stroke and let CSS handle scaling:

```css
.icon {
  width: 24px;
  height: 24px;
}

.icon-32 {
  width: 32px;
  height: 32px;
}

.icon-48 {
  width: 48px;
  height: 48px;
}
```

---

## 5. State Variations

### Default State

- **Stroke Color:** #333333 (dark gray)
- **Stroke Weight:** 2px (at 24px)
- **Accent Color:** #FF6B35 (warm orange) on key elements
- **Opacity:** 1.0

### Hover State

- **Stroke Color:** #FF6B35 (warm accent)
- **Stroke Weight:** 2px (same)
- **Background:** Optional subtle background circle (rgba(255, 107, 53, 0.1))
- **Opacity:** 1.0
- **Effect:** Add `transition: stroke 0.2s ease` for smooth change

### Active State

- **Stroke Color:** #FF6B35 (warm accent)
- **Stroke Weight:** 2px (same)
- **Accent Color:** Brighten or intensify existing accents
- **Background:** Slightly more prominent circle (rgba(255, 107, 53, 0.15))
- **Opacity:** 1.0

### Disabled State

- **Stroke Color:** #CCCCCC (light gray)
- **Stroke Weight:** 2px (same)
- **Accent Color:** #CCCCCC (match stroke)
- **Opacity:** 0.6
- **Effect:** Conveys unavailability without removing visual presence

### Focus State (Accessibility)

- **Stroke Color:** #333333 (primary outline)
- **Outline:** Add outer ring at 1.5px offset with #2196F3 (focus blue)
- **Purpose:** Keyboard navigation indication
- **Effect:** `outline: 2px solid #2196F3; outline-offset: 2px`

---

## 6. Naming Conventions

### Format

```
icon-[category]-[name].svg
```

### Categories

| Category            | Prefix           | Examples                                              |
| ------------------- | ---------------- | ----------------------------------------------------- |
| **Payment Methods** | `icon-payment-`  | `icon-payment-momo.svg`, `icon-payment-airtel.svg`    |
| **Fulfillment**     | `icon-delivery-` | `icon-delivery-boda.svg`, `icon-delivery-pickup.svg`  |
| **Navigation**      | `icon-nav-`      | `icon-nav-home.svg`, `icon-nav-orders.svg`            |
| **Products**        | `icon-product-`  | `icon-product-bread.svg`, `icon-product-pastry.svg`   |
| **Admin**           | `icon-admin-`    | `icon-admin-analytics.svg`, `icon-admin-settings.svg` |
| **Interaction**     | `icon-action-`   | `icon-action-edit.svg`, `icon-action-delete.svg`      |

### Naming Rules

1. Use **lowercase** for all names
2. Use **hyphens** to separate words (kebab-case)
3. Be **descriptive** but **concise** (max 2 words after category)
4. Use **common terms** (e.g., "cod" for cash-on-delivery, not "c-o-d")
5. Avoid **generic names** (use "boda" not "motorcycle")

### Examples

- ✅ `icon-payment-momo.svg` (clear, specific)
- ✅ `icon-delivery-boda.svg` (culturally relevant)
- ❌ `icon-payment-method-mobile.svg` (too verbose)
- ❌ `icon-payment-MTN.svg` (unnecessary uppercase)

---

## 7. Export Specifications

### SVG Export Settings

#### Optimal SVG Markup

```xml
<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <!-- icon content -->
</svg>
```

#### Required Attributes

- `width="24"` and `height="24"` (square format)
- `viewBox="0 0 24 24"` (defines coordinate system)
- `fill="none"` (prevents unintended fills)
- `xmlns="http://www.w3.org/2000/svg"` (XML namespace)

#### Element Specifications

- **Strokes:** Always use `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`
- **Circles & Paths:** Use `fill="none"` to ensure outline-only style
- **Colors:** Use hex format (#333333, #FF6B35)
- **Precision:** Round all coordinates to 1 decimal place

#### File Optimization

1. Remove unnecessary attributes (`id`, `class`, etc.)
2. Remove `<style>` tags; use inline attributes only
3. Use `stroke-linecap="round"` and `stroke-linejoin="round"` consistently
4. Minimize path data (round to 1 decimal)
5. Ensure `viewBox` exactly matches coordinate range (0 0 24 24)

#### Compression

- Use SVGO (SVG Optimizer) with these settings:
  ```json
  {
    "plugins": [
      "removeViewBox: false",
      "removeEmptyAttrs: true",
      "removeEmptyContainers: true",
      "cleanupEnableBackground: true"
    ]
  }
  ```
- Aim for **< 300 bytes** per icon (uncompressed)

### File Storage

```
/assets/icons/
├── payment/
│   ├── icon-payment-momo.svg
│   ├── icon-payment-airtel.svg
│   └── ...
├── delivery/
│   ├── icon-delivery-boda.svg
│   └── ...
└── ...
```

---

## 8. Reference Icons & Examples

The following hero icons demonstrate the Eat Good Uganda design language:

### Example 1: MTN Mobile Money (MoMo)

**Design Intent:** Warm, friendly payment icon reflecting Uganda's most-used mobile money system

**Key Features:**

- Circle frame (22px diameter, 2px stroke)
- Simplified phone silhouette inside (12px tall, 8px wide)
- Money symbol (₦) on phone screen
- Warm orange accent (#FF6B35) on money symbol
- Result: Instantly recognizable as a mobile payment method

**Grid Alignment:**

- Circle center: (12, 12)
- Circle radius: 11px
- Phone position: centered
- Money symbol: emphasized with accent color

---

### Example 2: Boda-Boda Delivery

**Design Intent:** Locally relevant, warm motorcycle icon representing Uganda's iconic delivery method

**Key Features:**

- Simplified motorcycle silhouette
- Two wheels (circles, 6px diameter each)
- Seat and handlebars (curved, friendly lines)
- Optional warm accent line along top frame
- Result: Culturally grounded, immediately recognizable

**Grid Alignment:**

- Left wheel center: (7, 15)
- Right wheel center: (17, 15)
- Seat position: between wheels, centered
- Handlebars: front-top, curved

---

### Example 3: Bank Transfer

**Design Intent:** Secure, trustworthy payment icon representing traditional banking

**Key Features:**

- Building silhouette (simplified, 14px tall)
- Columns or lines suggesting stability
- Optional shield accent for security
- Warm accent on key structural element
- Result: Conveys security without feeling cold or corporate

---

### Example 4: Cash on Delivery (COD)

**Design Intent:** Simple, clear icon for payment at delivery

**Key Features:**

- Cash symbol (money/notes visual)
- Optional delivery indicator (hand receiving)
- Warm accent on money element
- Result: Clear understanding of payment method

---

### Example 5: Airtel Money

**Design Intent:** Distinct from MoMo while maintaining warm, approachable style

**Key Features:**

- Similar circle frame as MoMo (22px diameter)
- Distinct visual from phone (perhaps signal waves)
- Money symbol integration
- Warm accent highlighting
- Result: Recognizable as alternative payment method

---

## 9. Do's and Don'ts

### DO: Create Warm Icons

✅ Use rounded corners (3–4px minimum)
✅ Apply warm accent color (#FF6B35) to highlight 1–2 key elements
✅ Use curved, flowing strokes
✅ Allow slight asymmetry for character
✅ Test at multiple sizes (24px, 32px, 48px)
✅ Maintain consistent 2px stroke weight

### DON'T: Create Cold Icons

❌ Use sharp angles or points
❌ Fill entire icon with accent color
❌ Apply straight, rigid geometric shapes
❌ Use only outline without any visual warmth
❌ Create perfectly symmetrical, machine-like forms
❌ Mix multiple stroke weights

### DO: Design for Clarity

✅ Simplify shapes to essential forms
✅ Use clear, recognizable silhouettes
✅ Maintain adequate spacing between elements
✅ Verify icons remain clear at 24px (smallest size)
✅ Use visual hierarchy (darker strokes for main shapes)

### DON'T: Overcomplicate Icons

❌ Add intricate details that disappear at small sizes
❌ Use multiple stroke weights
❌ Crowd too many elements together
❌ Create ambiguous or confusing symbols
❌ Add textures or gradients (outline only)

### DO: Honor Cultural Context

✅ Design with Uganda's payment ecosystem in mind
✅ Use locally familiar delivery methods (boda-boda)
✅ Create icons that feel at home in the region
✅ Reflect the warmth of Ugandan hospitality

### DON'T: Generic Design

❌ Use design patterns from global icon systems
❌ Create icons that feel imported or out-of-place
❌ Ignore regional relevance
❌ Default to minimalist styles that feel cold

---

## 10. Accessibility Considerations

### Visual Accessibility

1. **Sufficient Contrast**
   - Primary icon color (#333333) has contrast ratio 16.5:1 against white
   - Accent color (#FF6B35) has contrast ratio 3.7:1 against white (acceptable for non-essential elements)
   - Disabled state (#CCCCCC) has contrast ratio 3.1:1 (acceptable for disabled states)

2. **Size & Clarity**
   - Minimum interactive size: 24px × 24px (recommended: 32px × 32px)
   - Icons remain clear at 24px without intricate details
   - Strokes are visible without pixelation at all sizes

3. **Color Not Sole Indicator**
   - Never use color alone to convey meaning
   - Combine with text labels or additional visual cues
   - Example: Status icon + color + text label ("Delivered")

### Semantic Accessibility

1. **Icon Implementation**
   - When used as interactive controls, wrap in `<button>` or `<a>` tags
   - Provide `aria-label` for icons without accompanying text

   ```html
   <button aria-label="View payment methods">
     <svg class="icon icon-payment-momo"><!-- --></svg>
   </button>
   ```

2. **Decorative Icons**
   - If icon is decorative (alongside text), add `aria-hidden="true"`

   ```html
   <span>
     <svg class="icon" aria-hidden="true"><!-- --></svg>
     Payment Method
   </span>
   ```

3. **Focus States**
   - All interactive icons must have visible focus indicator
   - Use keyboard outline (blue ring around icon)
   - Apply focus state design (see Section 5)

### Motion & Animation

1. **Reduced Motion Support**
   - Respect `prefers-reduced-motion` media query
   - Provide non-animated fallbacks for hover/active states

   ```css
   @media (prefers-reduced-motion: reduce) {
     .icon {
       transition: none;
     }
   }
   ```

2. **Hover States**
   - Don't rely on hover-only interactions (mobile devices)
   - Combine hover with focus and active states
   - Provide clear visual feedback without motion if possible

### Icon Usage Guidelines

1. **Pair with Text**
   - Use icons alongside text labels for clarity
   - Exception: Very common icons (home, search) may stand alone with tooltips

2. **Provide Context**
   - Use icons in context where meaning is clear
   - Example: MoMo icon on payment selection screen (context-clear)
   - Never use icons as sole instruction mechanism

3. **Testing**
   - Test icons with screen readers (icons should have `aria-label` when necessary)
   - Verify focus indicators are visible
   - Check contrast at actual sizes used in product

---

## Implementation Checklist

When adding new icons to the system:

- [ ] Icon designed on 24px × 24px grid
- [ ] All corners rounded (3–4px minimum)
- [ ] Consistent 2px stroke weight throughout
- [ ] 2–3px internal padding maintained
- [ ] Warm accent color (#FF6B35) applied strategically (1–2 key elements)
- [ ] SVG properly formatted with required attributes
- [ ] Icon tested at 24px, 32px, 48px sizes
- [ ] Naming convention followed (`icon-[category]-[name].svg`)
- [ ] Unnecessary SVG attributes removed
- [ ] File size under 300 bytes (uncompressed)
- [ ] Cultural relevance verified (if applicable)
- [ ] Accessibility considerations addressed
- [ ] Icon added to appropriate category folder

---

## Version History

| Version | Date       | Changes                                               |
| ------- | ---------- | ----------------------------------------------------- |
| 1.0     | 2026-05-20 | Initial icon system guide with 5 hero reference icons |

---

## Questions & Support

For questions about icon design, style guide application, or feature requests:

1. Check this guide for relevant section
2. Review hero icons as reference implementations
3. Consult the Eat Good Uganda design system for overall aesthetic context

Remember: **Warm, approachable, culturally grounded, and grid-perfect.**
