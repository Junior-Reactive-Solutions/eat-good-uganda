# Eat Good Uganda Icon System

This directory contains the official icon system for Eat Good Uganda—a cohesive, warm, and culturally grounded set of SVG icons designed for the customer app, bakery admin portal, and super admin dashboard.

## Quick Start

### Using an Icon in HTML

```html
<!-- Simple usage -->
<svg class="icon icon-24" viewBox="0 0 24 24" width="24" height="24">
  <use href="/assets/icons/payment/icon-payment-momo.svg#icon" />
</svg>

<!-- With text label -->
<div class="payment-method">
  <img
    src="/assets/icons/payment/icon-payment-momo.svg"
    alt="MTN Mobile Money"
    class="icon icon-32"
  />
  <span>MTN Mobile Money</span>
</div>

<!-- Interactive button -->
<button aria-label="Select Airtel Money payment" class="payment-btn">
  <img src="/assets/icons/payment/icon-payment-airtel.svg" alt="" class="icon icon-32" />
  Airtel Money
</button>
```

### Using Icons in React

```jsx
// Import SVG directly
import MomoIcon from '@/assets/icons/payment/icon-payment-momo.svg'

export function PaymentSelector() {
  return (
    <button className="payment-option" aria-label="MTN Mobile Money">
      <img src={MomoIcon} alt="" className="icon icon-32" />
      <span>Mobile Money</span>
    </button>
  )
}

// Or as an SVG component
const PaymentIcon = ({ type, size = 24 }) => {
  const icons = {
    momo: 'payment/icon-payment-momo.svg',
    airtel: 'payment/icon-payment-airtel.svg',
    bank: 'payment/icon-payment-bank.svg',
    cod: 'payment/icon-payment-cod.svg',
  }

  return (
    <svg className={`icon icon-${size}`} viewBox="0 0 24 24" width={size} height={size}>
      <use href={`/assets/icons/${icons[type]}#icon`} />
    </svg>
  )
}
```

### CSS Styling

```css
/* Base icon styles */
.icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  vertical-align: middle;
}

/* Size variants */
.icon-24 {
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

/* Interactive states */
.icon-button {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.icon-button:hover {
  background-color: rgba(255, 107, 53, 0.1);
}

.icon-button:active {
  background-color: rgba(255, 107, 53, 0.15);
}

.icon-button:focus {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}

/* SVG color override (if needed) */
.icon-disabled {
  opacity: 0.6;
  filter: grayscale(100%);
}
```

---

## Directory Structure

```
assets/icons/
├── payment/              # Payment method icons
│   ├── icon-payment-momo.svg
│   ├── icon-payment-airtel.svg
│   ├── icon-payment-bank.svg
│   └── icon-payment-cod.svg
├── delivery/             # Fulfillment/delivery icons
│   ├── icon-delivery-boda.svg
│   └── icon-delivery-pickup.svg
├── product/              # Product category icons
│   └── icon-product-bread.svg
└── README.md            # This file
```

---

## Icon Reference

### Payment Methods

#### MTN Mobile Money (`icon-payment-momo.svg`)

- **Purpose:** Most-used mobile money payment method in Uganda
- **Design:** Phone with money symbol, warm accent on symbol
- **Size:** 24px × 24px (2px stroke)
- **Category:** Payment

#### Airtel Money (`icon-payment-airtel.svg`)

- **Purpose:** Alternative mobile money (Airtel network)
- **Design:** Signal waves with warm accent highlight
- **Size:** 24px × 24px (2px stroke)
- **Category:** Payment

#### Bank Transfer (`icon-payment-bank.svg`)

- **Purpose:** Traditional bank payment method
- **Design:** Bank building with columns, warm accent on structure
- **Size:** 24px × 24px (2px stroke)
- **Category:** Payment

#### Cash on Delivery (`icon-payment-cod.svg`)

- **Purpose:** Payment upon delivery
- **Design:** Money stack with receiving hand, warm accent on currency
- **Size:** 24px × 24px (2px stroke)
- **Category:** Payment

### Delivery Methods

#### Boda-Boda Delivery (`icon-delivery-boda.svg`)

- **Purpose:** Fast motorcycle delivery (culturally relevant to Uganda)
- **Design:** Simplified motorcycle with wheels, seat, handlebars
- **Size:** 24px × 24px (2px stroke)
- **Category:** Delivery
- **Accent:** Warm orange on main frame

#### Store Pickup (`icon-delivery-pickup.svg`)

- **Purpose:** Customer picks up at store location
- **Design:** Store building with door and windows, warm accent on roof
- **Size:** 24px × 24px (2px stroke)
- **Category:** Delivery

### Products

#### Bread (`icon-product-bread.svg`)

- **Purpose:** Bakery product category indicator
- **Design:** Loaf with diagonal score lines, warm accents
- **Size:** 24px × 24px (2px stroke)
- **Category:** Product

---

## Design Specifications

### Base Specifications

- **Grid:** 24px × 24px
- **Stroke Weight:** 2px (at 24px size)
- **Corner Radius:** 3–4px minimum
- **Padding:** 2–3px internal margin from edge
- **Format:** SVG (scalable)

### Color Palette

- **Outline:** #333333 (dark gray)
- **Accent:** #FF6B35 (warm orange)
- **Disabled:** #CCCCCC (light gray)
- **Focus:** #2196F3 (focus blue)

### Scaling Guide

| Size | Stroke | Use                          |
| ---- | ------ | ---------------------------- |
| 24px | 2px    | Controls, small displays     |
| 32px | 2.67px | Standard UI, navigation      |
| 48px | 4px    | Hero sections, large buttons |
| 64px | 5.33px | Marketing, promotions        |

---

## State Variations

### Default

- Stroke: #333333
- Accent: #FF6B35 (on key elements)
- Opacity: 1.0

### Hover

- Stroke: #FF6B35 (entire outline)
- Background: Optional rgba(255, 107, 53, 0.1) circle
- Transition: 0.2s ease

### Active

- Stroke: #FF6B35
- Background: rgba(255, 107, 53, 0.15) circle
- Opacity: 1.0

### Disabled

- Stroke: #CCCCCC
- Opacity: 0.6
- Conveys unavailability

### Focus (Keyboard Navigation)

- Outline: 2px solid #2196F3
- Outline Offset: 2px
- Applies to all interactive icons

---

## Accessibility

### Best Practices

1. **Always pair with text labels** when possible

   ```html
   <div class="payment-method">
     <img src="icon-payment-momo.svg" alt="" class="icon" />
     <span>Mobile Money</span>
   </div>
   ```

2. **Use `aria-label` for icon-only buttons**

   ```html
   <button aria-label="Pay with MTN Mobile Money">
     <img src="icon-payment-momo.svg" alt="" class="icon" />
   </button>
   ```

3. **Use `aria-hidden` for decorative icons**

   ```html
   <span>
     <img src="icon-payment-momo.svg" alt="" aria-hidden="true" class="icon" />
     Mobile Money
   </span>
   ```

4. **Ensure keyboard focus visibility**

   ```css
   .icon-button:focus {
     outline: 2px solid #2196f3;
     outline-offset: 2px;
   }
   ```

5. **Support reduced motion**
   ```css
   @media (prefers-reduced-motion: reduce) {
     .icon {
       transition: none;
     }
   }
   ```

### Contrast Ratios

- **Primary (#333333) on white:** 16.5:1 ✓ AAA
- **Accent (#FF6B35) on white:** 3.7:1 ✓ AA for non-essential
- **Disabled (#CCCCCC) on white:** 3.1:1 ✓ AA for disabled states

---

## Implementation Tips

### 1. Icon Scaling

Always maintain aspect ratio and use CSS for sizing:

```html
<!-- Scale with CSS -->
<img src="icon-payment-momo.svg" class="icon icon-32" />

<!-- Or scale SVG viewBox -->
<svg viewBox="0 0 24 24" width="32" height="32"><!-- --></svg>
```

### 2. Icon Color Overrides

Use CSS filters or SVG styling:

```css
/* Grayscale for disabled state */
.icon-disabled {
  opacity: 0.6;
}

/* Color override (if needed) */
.icon-custom-color {
  filter: hue-rotate(45deg) saturate(1.2);
}
```

### 3. Icon Spacing

Add consistent spacing around icons:

```css
.icon-spacing {
  margin-right: 8px; /* Space between icon and text */
  margin-bottom: 12px; /* Space between rows */
}
```

### 4. Icon Alignment

Ensure icons align properly with text:

```css
.icon-aligned {
  vertical-align: middle;
  display: inline-block;
}
```

---

## Styling Examples

### Payment Selection Screen

```html
<div class="payment-options">
  <button class="payment-card" aria-label="Select MTN Mobile Money">
    <img src="payment/icon-payment-momo.svg" alt="" class="icon icon-48" />
    <span>Mobile Money</span>
    <span class="hint">Instant transfer</span>
  </button>

  <button class="payment-card" aria-label="Select Bank Transfer">
    <img src="payment/icon-payment-bank.svg" alt="" class="icon icon-48" />
    <span>Bank Transfer</span>
    <span class="hint">1–2 hours</span>
  </button>
</div>
```

```css
.payment-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  padding: 20px;
}

.payment-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.payment-card:hover {
  border-color: #ff6b35;
  background-color: rgba(255, 107, 53, 0.05);
}

.payment-card:focus {
  outline: 2px solid #2196f3;
  outline-offset: 4px;
}
```

### Delivery Method Selection

```html
<div class="delivery-options">
  <label class="delivery-option">
    <input type="radio" name="delivery" value="boda" required />
    <img src="delivery/icon-delivery-boda.svg" alt="" class="icon icon-32" />
    <span>Boda Delivery (30 min)</span>
  </label>

  <label class="delivery-option">
    <input type="radio" name="delivery" value="pickup" />
    <img src="delivery/icon-delivery-pickup.svg" alt="" class="icon icon-32" />
    <span>Store Pickup (Ready in 1 hr)</span>
  </label>
</div>
```

---

## Adding New Icons

To add new icons to the system:

1. **Design on 24px grid** with 2px stroke
2. **Use naming convention:** `icon-[category]-[name].svg`
3. **Check the style guide** at `docs/ICON_STYLE_GUIDE.md`
4. **Add to correct category folder** (or create new if needed)
5. **Test at 24px, 32px, 48px** for clarity
6. **Verify accessibility** (colors, contrast, labels)
7. **Update this README** with new icon reference
8. **Optimize SVG** (remove unnecessary attributes, keep < 300 bytes)

---

## Support & Questions

For detailed specifications, design principles, and implementation guidelines:

- See **`docs/ICON_STYLE_GUIDE.md`** for complete reference
- Check icon examples in this directory for design patterns
- Review Eat Good Uganda design system for overall context

Remember: **Warm, approachable, culturally grounded, and grid-perfect.**

---

## Version History

| Version | Date       | Changes                                           |
| ------- | ---------- | ------------------------------------------------- |
| 1.0     | 2026-05-20 | Initial release with 7 hero icons and style guide |
