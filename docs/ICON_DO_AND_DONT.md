# Icon Do's and Don'ts

## Quick Reference Guide

### ✓ DO

- Use icons alongside text labels for clarity
- Use appropriate sizes (sm for inline, md default, lg for buttons)
- Provide alt text for semantic icons
- Use semantic colors for status (green=success, red=danger, yellow=warning, blue=info)
- Test icons at multiple sizes (24px, 32px, 48px)
- Keep stroke weight proportional
- Use icons to enhance, not replace, text
- Combine related icons with text labels
- Use our custom icons (never generic icons)
- Respect cultural context (celebrate local payment methods, delivery modes)

### ✗ DON'T

- Don't use icons as the sole communication method
- Don't ignore accessibility (no alt text)
- Don't change stroke weight arbitrarily
- Don't use sharp corners (min 3px radius)
- Don't scale icons non-uniformly
- Don't mix filled and outline styles
- Don't use generic, corporate-looking icons
- Don't override our color palette
- Don't create new icons that don't match our style
- Don't ignore the cultural context of Uganda

## Specific Examples

### Payment Flow: DO and DON'T

**✓ DO**

```jsx
<div className="payment-methods">
  <button className="payment-btn">
    <IconPaymentMomo size="lg" color="accent" />
    <span>MTN Mobile Money</span>
  </button>
  <button className="payment-btn">
    <IconPaymentAirtel size="lg" color="accent" />
    <span>Airtel Money</span>
  </button>
</div>
```

- Icons paired with text labels ✓
- Icons are sized appropriately (lg for buttons) ✓
- Using our custom icons ✓
- Celebrating local payment methods ✓

**✗ DON'T**

```jsx
<div className="payment-methods">
  <button>💰 <!-- generic emoji -->
  <button>🏦 <!-- generic bank emoji -->
  <button>💳 <!-- generic card emoji -->
</div>
```

- Using generic emoji instead of custom icons ✗
- No text labels ✗
- Not celebrating local payment methods ✗
- Accessibility issues ✗

### Status Indicator: DO and DON'T

**✓ DO**

```jsx
<span className="status-badge status-approved">
  <IconApproved size="sm" color="success" alt="Approved" />
  <span>Approved</span>
</span>
```

- Icon + text together ✓
- Semantic color (green for success) ✓
- Accessible (alt text provided) ✓
- Clear meaning ✓

**✗ DON'T**

```jsx
<span className="status-badge" style={{ color: 'green' }}>
  <IconApproved /> <!-- no text, only icon -->
</span>
```

- Icon alone without text ✗
- Relying on color alone ✗
- No alt text ✗
- Not accessible ✗

### Navigation: DO and DON'T

**✓ DO**

```jsx
<nav className="primary-nav">
  <NavLink to="/">
    <IconHome size="md" />
    <span>Home</span>
  </NavLink>
  <NavLink to="/search">
    <IconSearch size="md" />
    <span>Search</span>
  </NavLink>
</nav>
```

- Icon + text together ✓
- Consistent size (md) ✓
- Clear navigation targets ✓
- Accessible labels ✓

**✗ DON'T**

```jsx
<nav>
  <NavLink to="/">🏠</NavLink>
  <NavLink to="/search">🔍</NavLink>
  <NavLink to="/cart">🛒</NavLink>
</nav>
```

- Using emoji instead of custom icons ✗
- No text labels ✗
- Not accessible ✗
- Not brand-consistent ✗

### Product Category: DO and DON'T

**✓ DO**

```jsx
<div className="product-categories">
  <button className="category-btn">
    <IconBread size="md" />
    <span>Bread</span>
  </button>
  <button className="category-btn">
    <IconCake size="md" />
    <span>Cakes</span>
  </button>
</div>
```

- Custom icons for each category ✓
- Icons paired with text ✓
- Distinctive and recognizable ✓
- Clear product types ✓

**✗ DON'T**

```jsx
<div>
  <button>Bread</button>
  <button>Cakes</button>
  <!-- no icons at all -->
</div>
```

- No icons (missed opportunity for visual appeal) ✗
- Less engaging for users ✗
- Missing category visual identity ✗

### Action Buttons: DO and DON'T

**✓ DO**

```jsx
<button className="btn btn-secondary" aria-label="Edit order details">
  <IconEdit size="sm" alt="Edit" />
  <span>Edit</span>
</button>
```

- Icon with clear text label ✓
- Appropriate size (sm) ✓
- ARIA label for accessibility ✓
- Action is obvious ✓

**✗ DON'T**

```jsx
<button className="btn">
  <IconEdit /> <!-- no text, only icon -->
</button>
```

- Icon alone without text ✗
- Action not clear without hovering ✗
- Less accessible ✗
- Poor UX ✗

## Size Guidelines

### When to Use Each Size

**sm (24px)**

- Inline in text or paragraphs
- Status badges
- Small UI elements
- Decorative accents

```jsx
<span>
  <IconApproved size="sm" /> Order confirmed
</span>
```

**md (32px)** - DEFAULT

- Primary navigation
- Product listings
- Card headers
- Standard button icons

```jsx
<NavLink><IconHome size="md" /> Home</NavLink>
<IconCake size="md" /> Cakes Section
```

**lg (48px)**

- Large call-to-action buttons
- Hero sections
- Large touch targets
- Primary category icons

```jsx
<button className="cta"><IconCart size="lg" /> Add to Cart</button>
<button className="category-hero"><IconBread size="lg" /></button>
```

**Custom (e.g., size={64})**

- Extra-large displays
- Logo or branding elements
- Accessible touch targets (48px min)

```jsx
<IconHome size={64} /> // 64px hero
```

## Color Guidelines

### When to Use Each Color

**default (dark gray #333333)**

- Primary text and UI
- Default navigation
- Neutral elements

```jsx
<IconHome color="default" />
```

**accent (orange #FF6B35)**

- Brand highlights
- Call-to-action
- Active/selected states
- Important actions

```jsx
<IconCart color="accent" /> <!-- prominent button -->
<IconApproved color="accent" state="active" /> <!-- selected -->
```

**success (green #4CAF50)**

- Approval status
- Confirmed actions
- Positive feedback

```jsx
<IconApproved color="success" /> Approved
```

**danger (red #F44336)**

- Rejection status
- Delete/destructive actions
- Critical alerts

```jsx
<IconRejected color="danger" /> Rejected
<button className="delete"><IconDelete color="danger" /></button>
```

**warning (yellow #FFC107)**

- Pending status
- Caution/attention
- Awaiting action

```jsx
<IconPending color="warning" /> Pending Review
```

**info (blue #2196F3)**

- Informational content
- Help/FAQ
- Notifications

```jsx
<IconHelp color="info" /> Need help?
<IconBellNotification color="info" /> New message
```

## Accessibility Checklist

Before shipping icon usage:

- [ ] Semantic icons have alt text
- [ ] Decorative icons have alt="" or aria-hidden="true"
- [ ] Color is not the only differentiator
- [ ] Touch targets are 48px minimum
- [ ] Icons work with screen readers
- [ ] Icon + text together for clarity
- [ ] Tested at multiple sizes
- [ ] Contrast meets WCAG AA (4.5:1)

## Common Mistakes & Fixes

| Mistake                 | Example                           | Fix                                                         |
| ----------------------- | --------------------------------- | ----------------------------------------------------------- |
| Icon without text       | `<button><IconEdit /></button>`   | Add text: `<button><IconEdit /> Edit</button>`              |
| Wrong size              | Large icon for inline text        | Use `size="sm"` for inline content                          |
| Color alone             | Green icon = success, but no text | Add text label or icon + text combo                         |
| Generic icons           | Using emoji instead of custom     | Use our custom icon library                                 |
| No alt text             | `<IconApproved />`                | Add alt: `<IconApproved alt="Approved" />`                  |
| Custom colors           | `color="purple"`                  | Use semantic colors: success, danger, warning, info         |
| Filled icons            | Modified custom icon to filled    | Keep outline style consistent                               |
| Sharp corners           | 0px border radius                 | Keep 3-4px minimum radius                                   |
| Icon as only affordance | `<button><IconDelete /></button>` | Make action clear: `<button><IconDelete /> Delete</button>` |
| Ignoring context        | Generic US-style icons            | Use local context (boda, MoMo, etc.)                        |
