# Icon Implementation Guide

This guide provides step-by-step instructions for implementing the Eat Good Uganda icon system in React, HTML, and CSS.

---

## Quick Start for Developers

### 1. Copy Icon Files to Your Project

```bash
# Icons are located in:
# assets/icons/payment/
# assets/icons/delivery/
# assets/icons/product/
# [future categories will be added here]

# No build process needed—SVG files are production-ready
```

### 2. Import and Use Icons

#### HTML (Static Files)

```html
<!-- Simple image tag -->
<img
  src="/assets/icons/payment/icon-payment-momo.svg"
  alt="MTN Mobile Money"
  class="icon icon-32"
/>

<!-- SVG with inline styling -->
<svg class="icon icon-32" viewBox="0 0 24 24" width="32" height="32">
  <use href="/assets/icons/payment/icon-payment-momo.svg#icon" />
</svg>
```

#### React (Vite/Next.js)

```jsx
// Method 1: Import as image
import MomoIcon from '@/assets/icons/payment/icon-payment-momo.svg'

export function PaymentButton() {
  return (
    <button className="payment-btn">
      <img src={MomoIcon} alt="" className="icon icon-32" />
      <span>Mobile Money</span>
    </button>
  )
}

// Method 2: Import SVG directly in JSX (Vite)
import { ReactComponent as MomoIcon } from '@/assets/icons/payment/icon-payment-momo.svg'

export function PaymentMethod() {
  return (
    <div className="payment">
      <MomoIcon className="icon icon-32" />
      <span>MTN Mobile Money</span>
    </div>
  )
}
```

#### Vue

```vue
<!-- Method 1: Image tag -->
<template>
  <img src="@/assets/icons/payment/icon-payment-momo.svg" alt="Mobile Money" class="icon icon-32" />
</template>

<!-- Method 2: SVG component -->
<template>
  <svg class="icon icon-32" viewBox="0 0 24 24" width="32" height="32">
    <use href="@/assets/icons/payment/icon-payment-momo.svg#icon" />
  </svg>
</template>
```

---

## CSS Setup

### Base Icon Styles

```css
/* Base icon sizing */
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

/* Size variants (responsive) */
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
.icon-64 {
  width: 64px;
  height: 64px;
}

/* Icon button styling */
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  background: none;
  border: 2px solid transparent;
  padding: 8px 12px;
  border-radius: 6px;

  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #333333;

  transition: all 0.2s ease;
}

.icon-button:hover {
  background-color: rgba(255, 107, 53, 0.1);
  border-color: rgba(255, 107, 53, 0.3);
  color: #ff6b35;
}

.icon-button:active {
  background-color: rgba(255, 107, 53, 0.15);
  border-color: #ff6b35;
}

.icon-button:focus {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}

/* Disabled state */
.icon-button:disabled,
.icon-button[aria-disabled='true'] {
  opacity: 0.6;
  cursor: not-allowed;
  color: #999999;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .icon-button {
    transition: none;
  }
}
```

---

## Component Examples

### Payment Method Selector

```jsx
// React component example
import MomoIcon from '@/assets/icons/payment/icon-payment-momo.svg'
import AirtelIcon from '@/assets/icons/payment/icon-payment-airtel.svg'
import BankIcon from '@/assets/icons/payment/icon-payment-bank.svg'
import CodIcon from '@/assets/icons/payment/icon-payment-cod.svg'

const PAYMENT_METHODS = [
  { id: 'momo', name: 'Mobile Money', icon: MomoIcon, description: 'Instant transfer' },
  { id: 'airtel', name: 'Airtel Money', icon: AirtelIcon, description: 'Instant transfer' },
  { id: 'bank', name: 'Bank Transfer', icon: BankIcon, description: '1–2 hours' },
  { id: 'cod', name: 'Cash on Delivery', icon: CodIcon, description: 'Pay at delivery' },
]

export function PaymentSelector({ selected, onSelect }) {
  return (
    <div className="payment-grid">
      {PAYMENT_METHODS.map((method) => (
        <button
          key={method.id}
          className={`payment-card ${selected === method.id ? 'active' : ''}`}
          onClick={() => onSelect(method.id)}
          aria-label={`Select ${method.name}`}
        >
          <img src={method.icon} alt="" className="payment-icon icon-48" />
          <span className="payment-name">{method.name}</span>
          <span className="payment-hint">{method.description}</span>
        </button>
      ))}
    </div>
  )
}
```

```css
/* Payment selector styles */
.payment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  padding: 20px;
}

.payment-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  cursor: pointer;

  transition: all 0.2s ease;
}

.payment-card:hover {
  border-color: #ff6b35;
  background-color: rgba(255, 107, 53, 0.05);
  transform: translateY(-2px);
}

.payment-card.active {
  border-color: #ff6b35;
  background-color: rgba(255, 107, 53, 0.1);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.15);
}

.payment-card:focus {
  outline: 2px solid #2196f3;
  outline-offset: 4px;
}

.payment-icon {
  width: 48px;
  height: 48px;
}

.payment-name {
  font-weight: 600;
  color: #333333;
  font-size: 14px;
}

.payment-hint {
  font-size: 12px;
  color: #666666;
}
```

---

### Delivery Method Selector

```jsx
import BodaIcon from '@/assets/icons/delivery/icon-delivery-boda.svg'
import PickupIcon from '@/assets/icons/delivery/icon-delivery-pickup.svg'

export function DeliverySelector({ selected, onSelect }) {
  const methods = [
    {
      id: 'boda',
      label: 'Boda Delivery',
      description: 'Ready in 30 mins',
      icon: BodaIcon,
      price: '5,000 UGX',
    },
    {
      id: 'pickup',
      label: 'Store Pickup',
      description: 'Ready in 1 hour',
      icon: PickupIcon,
      price: 'Free',
    },
  ]

  return (
    <fieldset className="delivery-options">
      <legend className="visually-hidden">Delivery Method</legend>

      {methods.map((method) => (
        <label key={method.id} className="delivery-option">
          <input
            type="radio"
            name="delivery"
            value={method.id}
            checked={selected === method.id}
            onChange={(e) => onSelect(e.target.value)}
            required
          />

          <div className="delivery-content">
            <img src={method.icon} alt="" className="delivery-icon icon-32" />
            <div className="delivery-text">
              <span className="delivery-label">{method.label}</span>
              <span className="delivery-description">{method.description}</span>
            </div>
          </div>

          <span className="delivery-price">{method.price}</span>
        </label>
      ))}
    </fieldset>
  )
}
```

```css
/* Delivery selector styles */
.delivery-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: none;
  padding: 0;
  margin: 0;
}

.delivery-option {
  display: flex;
  align-items: center;
  gap: 12px;

  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;

  transition: all 0.2s ease;
}

.delivery-option input[type='radio'] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #ff6b35;
}

.delivery-option input[type='radio']:focus {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}

.delivery-option:has(input:checked) {
  border-color: #ff6b35;
  background-color: rgba(255, 107, 53, 0.05);
}

.delivery-option:hover {
  border-color: #ff6b35;
  background-color: rgba(255, 107, 53, 0.05);
}

.delivery-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.delivery-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.delivery-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.delivery-label {
  font-weight: 600;
  color: #333333;
  font-size: 14px;
}

.delivery-description {
  font-size: 12px;
  color: #666666;
}

.delivery-price {
  font-weight: 600;
  color: #ff6b35;
  font-size: 14px;
  white-space: nowrap;
}
```

---

### Icon with Text (List Item)

```jsx
export function OrderStatusItem({ icon, label, status }) {
  return (
    <div className="status-item">
      <img src={icon} alt="" className="status-icon icon-24" />
      <div className="status-text">
        <span className="status-label">{label}</span>
        <span className={`status-value status-${status}`}>{status}</span>
      </div>
    </div>
  )
}

// Usage
;<OrderStatusItem icon={BodaIcon} label="Delivery Method" status="boda-delivery" />
```

```css
.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
}

.status-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-label {
  font-size: 12px;
  color: #666666;
  font-weight: 500;
}

.status-value {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.status-boda-delivery::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4caf50;
  margin-right: 6px;
}
```

---

## Accessibility Best Practices

### 1. Icon-Only Buttons

Always provide `aria-label` for interactive icons without text:

```jsx
<button className="icon-button" aria-label="Payment settings">
  <img src={SettingsIcon} alt="" className="icon icon-24"/>
</button>

<!-- Or with SVG -->
<button className="icon-button" aria-label="Edit order">
  <svg className="icon icon-24" viewBox="0 0 24 24">
    <use href="/assets/icons/action/icon-action-edit.svg#icon"/>
  </svg>
</button>
```

### 2. Decorative Icons

Hide decorative icons from screen readers:

```jsx
<span>
  <img src={CheckIcon} alt="" aria-hidden="true" className="icon icon-16" />
  <span>Order Confirmed</span>
</span>
```

### 3. Color and Status

Never use color alone to convey meaning:

```jsx
// ❌ Wrong: Color only
<span style={{ color: '#4CAF50' }}>●</span>

// ✅ Right: Icon + color + text
<span className="status-success">
  <img src={DeliveredIcon} alt="" className="icon icon-24"/>
  <span>Delivered</span>
</span>
```

### 4. Focus States

Ensure keyboard navigability with visible focus indicators:

```css
/* Required: Focus outline */
button:focus {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}

/* Optional but recommended: Focus ring component */
.focus-ring:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.25);
}
```

### 5. Reduced Motion

Respect user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Performance Optimization

### 1. SVG Optimization

All icons are pre-optimized (< 1.5KB each). No additional compression needed.

### 2. Caching Strategy

```js
// Cache SVG icon files for 30 days
// Set in your server/CDN configuration:
Cache-Control: public, max-age=2592000, immutable
```

### 3. Bundle Size

- Inline small icons (< 1KB) directly in CSS/JS
- Use `sprite sheets` for multiple icons (optional)
- Lazy-load decorative icons below fold

### 4. Sprite Sheet Example (Optional)

```html
<!-- Create a single SVG containing all icons -->
<svg style="display: none;">
  <defs>
    <symbol id="icon-payment-momo" viewBox="0 0 24 24">
      <!-- Icon content -->
    </symbol>
    <symbol id="icon-delivery-boda" viewBox="0 0 24 24">
      <!-- Icon content -->
    </symbol>
  </defs>
</svg>

<!-- Reference anywhere -->
<svg class="icon icon-32" viewBox="0 0 24 24">
  <use href="#icon-payment-momo" />
</svg>
```

---

## Styling Customization

### Dark Mode Support

```css
@media (prefers-color-scheme: dark) {
  /* Icons remain same color, but adjust backgrounds */
  .icon-button {
    color: #e0e0e0;
  }

  .icon-button:hover {
    background-color: rgba(255, 107, 53, 0.2);
  }
}
```

### Custom Icon States

```css
/* Loading state */
.icon-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Success animation */
.icon-success {
  animation: bounce 0.6s ease-out;
}

@keyframes bounce {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

---

## Testing Icons

### Unit Testing (React)

```jsx
import { render, screen } from '@testing-library/react'
import PaymentSelector from './PaymentSelector'

describe('PaymentSelector', () => {
  it('renders all payment methods', () => {
    render(<PaymentSelector selected="momo" onSelect={jest.fn()} />)

    expect(screen.getByLabelText('Select Mobile Money')).toBeInTheDocument()
    expect(screen.getByLabelText('Select Airtel Money')).toBeInTheDocument()
    expect(screen.getByLabelText('Select Bank Transfer')).toBeInTheDocument()
  })

  it('highlights selected method', () => {
    render(<PaymentSelector selected="momo" onSelect={jest.fn()} />)

    const button = screen.getByLabelText('Select Mobile Money').closest('button')
    expect(button).toHaveClass('active')
  })
})
```

### Accessibility Testing

```jsx
import { axe, toHaveNoViolations } from 'jest-axe'

it('has no accessibility violations', async () => {
  const { container } = render(<PaymentSelector selected="momo" onSelect={jest.fn()} />)
  const results = await axe(container)

  expect(results).toHaveNoViolations()
})
```

---

## Troubleshooting

### Icon Not Displaying

```jsx
// Check file path is correct
// Check SVG file exists and is readable
// Check mime type is `image/svg+xml`

// Debug: Log the icon source
console.log('Icon path:', iconPath)

// Verify file with curl
// curl -I https://your-domain/assets/icons/payment/icon-payment-momo.svg
```

### Icon Color Not Changing

```css
/* SVG fills need to be transparent for color override to work */
/* Ensure SVG has fill="none" and uses stroke only */

/* If you need to color SVG content, use filter */
.icon-red {
  filter: hue-rotate(345deg) saturate(1.5);
}
```

### Icon Sizing Issues

```css
/* Ensure parent container isn't constraining size */
.icon-container {
  width: auto; /* ✓ Good */
  min-width: 0; /* ✓ Good (flex child) */
  flex-shrink: 0; /* ✓ Good (flex parent) */
}

/* Avoid */
.icon-container {
  width: 100%; /* ✗ Stretches icon */
}
```

---

## Additional Resources

- **Style Guide:** `docs/ICON_STYLE_GUIDE.md`
- **Icon Reference:** `docs/ICON_REFERENCE.md`
- **Icons Directory:** `assets/icons/`
- **README:** `assets/icons/README.md`

---

## Version & Support

**Document Version:** 1.0  
**Icon System Version:** 1.0  
**Last Updated:** 2026-05-20

For questions or feature requests, consult the style guide or create an issue in the design system tracker.

Remember: **Warm, approachable, culturally grounded, and grid-perfect.**
