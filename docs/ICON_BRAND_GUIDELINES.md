# Icon System Brand Guidelines

## Brand Vision

The Eat Good Uganda icon system represents our commitment to warm, approachable design that feels locally relevant and culturally grounded. Our icons should feel like they belong in a genuine Ugandan bakery community, not a corporate enterprise.

## Design Philosophy

### Core Values

1. **Warm & Approachable** - Rounded corners, soft curves, friendly forms
2. **Hand-Crafted** - Slightly imperfect, sketchy quality matching our wireframes
3. **Culturally Relevant** - References to Ugandan context (boda-boda, MoMo, local bakery items)
4. **Clear & Recognizable** - Immediate understanding at any size
5. **Consistent** - Unified visual language across all icons

## Visual Language

### Grid & Metrics

- Base grid: 24px × 24px
- Stroke weight: 2px (at 24px base, scales to 2.67px at 32px, 4px at 48px)
- Corner radius: 3-4px (for warmth, never sharp 0px)
- Safe area: 3px padding from grid edge
- All viewBoxes: "0 0 24 24" (consistent across sizes)

### Stroke Style

- Stroke-based design (outline, not filled)
- Use currentColor for color inheritance
- Round line caps (stroke-linecap="round")
- Round line joins (stroke-linejoin="round")
- Consistent stroke color throughout icon

### Color Palette

**Primary Colors:**

- Brand Orange: #FF6B35 (warm, friendly, Ugandan-inspired)
- Dark Gray: #333333 (default, readable, professional)
- Light Gray: #CCCCCC (disabled, low importance)

**Semantic Colors:**

- Success Green: #4CAF50 (approval, positive)
- Danger Red: #F44336 (rejection, critical)
- Warning Yellow: #FFC107 (caution, attention)
- Info Blue: #2196F3 (information, helpful)

### States & Interactions

All icons support 4 visual states:

1. **Default** - Primary gray (#333333), normal opacity
2. **Hover** - Same color, visual feedback in UI layer (CSS)
3. **Active** - Brand orange (#FF6B35), highlighted state
4. **Disabled** - Light gray (#CCCCCC), 40% opacity

## Usage Standards

### Do's ✓

- Use icons alongside text labels for clarity
- Combine icons with text for clarity (especially in navigation)
- Use semantic colors for status (green=success, red=danger, yellow=warning, blue=info)
- Keep icons consistent with wireframe aesthetic
- Use appropriate sizes for context (sm for inline, lg for buttons)
- Test icons at multiple sizes to ensure legibility
- Provide alt text for accessibility
- Use icons to support local context (boda for delivery, MoMo for payment)

### Don'ts ✗

- Don't use icons as the sole communication method (always pair with text)
- Don't change stroke weight or corner radius
- Don't use sharp angles or harsh lines
- Don't create new icons that don't match our style
- Don't scale icons non-proportionally
- Don't mix filled and outline styles
- Don't use generic icons (use custom icons that feel local)
- Don't override our color palette
- Don't ignore accessibility (always provide alt text for semantic icons)
- Don't ignore the cultural context of Uganda

## Category-Specific Guidelines

### Payment Icons

Represent local payment methods prominently:

- MoMo and Airtel Money should be immediately recognizable (Ugandan payment preference)
- Bank Transfer icon should feel modern but warm
- Cash on Delivery should feel friendly and approachable
- Use in payment selection flows with clear labeling

### Delivery Icons

Celebrate local delivery culture:

- Boda-boda icon should feel authentic and culturally grounded
- Pickup icon should feel inviting, not corporate
- Delivery time and status icons should feel helpful and clear
- Pair with text to explain delivery options

### Product Icons

Make bakery items feel real and inviting:

- Bread icon should be iconic and distinctive
- Cake icon should show layering and decoration
- All product icons should make items look delicious and appealing
- Use in product filters and category navigation

### Navigation Icons

Keep primary navigation clear and consistent:

- Navigation icons should be instantly recognizable
- Home icon should feel welcoming
- Cart icon should be obvious (wheeled basket, not corporate)
- Use only in primary navigation bars

### Admin Icons

Make dashboards feel approachable, not intimidating:

- Status icons (approved, pending, rejected, suspended) should be crystal clear
- Admin action icons should feel helpful, not scary
- Charts and metrics should look inviting and informative
- Use consistent icon patterns for similar functions

## Typography Pairing

Icons work best alongside typography that matches our style:

**Recommended:** Handwritten, warm, approachable fonts

- Examples: Caveat, Fredoka One, Indie Flower, Quicksand

**Avoid:** Cold, corporate, geometric fonts

- Examples: Helvetica, Gotham, Montserrat (too corporate)

## Color Combinations

**Recommended pairings:**

- Icon + brand orange: Accents, highlights, call-to-action
- Icon + dark gray: Default, neutral, primary content
- Icon + semantic color: Status indication, alerts

**Avoid:**

- Icon + pure black (too harsh, use dark gray)
- Icon + pure white (no contrast, use light backgrounds)
- Multiple colors in one icon (keep monochromatic)

## Animation Guidelines

Icons should support light, friendly animations:

**Recommended animations:**

- Fade in/out (opacity 0-1)
- Scale (1-1.1x on hover, smooth timing)
- Rotate (spin 360° for loading states)
- Slide (subtle movement with easing)

**Timing:** 200-300ms (feels responsive, not laggy)

**Easing:** ease-in-out (natural feel)

**Avoid:**

- Complex multi-step animations (keep it simple)
- Animations > 500ms (feels sluggish)
- Rapid flashing (accessibility issue)
- Rotation > 360° per cycle (disorienting)

## Integration Points

### In Buttons

```jsx
<button className="btn btn-primary">
  <IconCart size="md" />
  Add to Cart
</button>
```

### In Navigation

```jsx
<nav className="primary-nav">
  <NavItem icon={IconHome} label="Home" />
  <NavItem icon={IconSearch} label="Search" />
  <NavItem icon={IconCart} label="Cart" />
</nav>
```

### In Status Badges

```jsx
<span className="badge badge-success">
  <IconApproved size="sm" />
  Approved
</span>
```

### In Cards

```jsx
<article className="product-card">
  <IconCake size="lg" />
  <h3>Custom Cake</h3>
  <p>Beautiful layered cake...</p>
</article>
```

## Consistency Checklist

Before shipping icon usage:

- [ ] All icons match our visual language
- [ ] Corner radius is 3-4px minimum
- [ ] Stroke weight is proportional to size
- [ ] Colors use our palette (not custom hex)
- [ ] States are visually distinguishable
- [ ] Sizes are appropriate for context
- [ ] Alt text is provided for accessibility
- [ ] Icons feel warm and approachable, not corporate
- [ ] Cultural context is respected (local references)
- [ ] Testing done at 24px, 32px, 48px sizes

## Common Mistakes to Avoid

1. **Using generic icons instead of custom** - Always use Eat Good Uganda icons
2. **Changing stroke weight** - Keep it proportional (2px → 2.67px → 4px)
3. **Adding sharp corners** - Maintain 3-4px corner radius
4. **Ignoring accessibility** - Always provide alt text
5. **Using too many colors** - Stick to one stroke color per icon
6. **Scaling non-proportionally** - Always scale uniformly
7. **Filling icons** - Keep them outline-based
8. **Over-animating** - Light, simple animations only
9. **Ignoring cultural context** - Celebrate Ugandan context
10. **Poor contrast** - Ensure readability on all backgrounds

## Questions & Feedback

For questions about icon usage or to propose new icons:

- Contact: design@eatgooduganda.local
- Slack: #design-system
- GitHub: Create issue with 'icon-system' label
