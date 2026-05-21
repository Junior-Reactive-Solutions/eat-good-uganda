# Icon Accessibility Guide

## Overview

This document provides accessibility labels, ARIA attributes, and guidelines for using icons inclusively across the Eat Good Uganda platform.

## Accessibility Standards

All custom icons follow WCAG 2.1 Level AA standards:

- Semantic HTML (SVG with role="img")
- ARIA labels for context
- Color contrast (stroke color meets 4.5:1 ratio)
- Keyboard accessible by design
- Screen reader compatible

## Icon Labels by Category

### Payment Icons

Semantic labels for payment method selection and billing contexts.

```typescript
IconPaymentMomo: 'MTN Mobile Money'
IconPaymentAirtel: 'Airtel Money'
IconPaymentBank: 'Bank Transfer'
IconPaymentCod: 'Cash on Delivery'
IconPaymentShield: 'Secure Payment'
IconPaymentGeneric: 'Mobile Payment'
```

### Delivery Icons

Labels for fulfillment and delivery information.

```typescript
IconDeliveryPickup: 'Pick up from store'
IconDeliveryBoda: 'Delivery by motorcycle'
IconDeliveryTime: 'Estimated delivery time'
IconDeliveryLocation: 'Location and distance'
IconDeliveryStatus: 'Delivery status tracking'
```

### Navigation Icons

Labels for primary and secondary navigation.

```typescript
IconHome: 'Home'
IconSearch: 'Search'
IconCart: 'Shopping cart'
IconOrders: 'My orders'
IconProfile: 'My profile'
IconFavorites: 'Favorites'
IconMenu: 'Menu'
IconSettings: 'Settings'
```

### Product Icons

Labels for product categories and product information.

```typescript
IconBread: 'Bread and loaves'
IconCake: 'Cakes'
IconPastry: 'Pastries'
IconCupcake: 'Cupcakes'
IconCookie: 'Cookies and biscuits'
IconDonut: 'Donuts'
IconStarRating: 'Rating'
IconTrending: 'Trending'
```

### Admin Icons

Labels for status, management, and administrative interfaces.

```typescript
IconApproved: 'Approved'
IconPending: 'Pending approval'
IconRejected: 'Rejected'
IconSuspended: 'Suspended'
IconAnalytics: 'Analytics'
IconCustomers: 'Customers'
IconRevenue: 'Revenue'
IconInventory: 'Inventory'
IconStaff: 'Staff'
IconAuditLog: 'Activity log'
```

### Interaction Icons

Labels for form actions and user interactions.

```typescript
IconEdit: 'Edit'
IconDelete: 'Delete'
IconDownload: 'Download'
IconShare: 'Share'
IconBellNotification: 'Notifications'
IconClock: 'Time'
IconPhone: 'Call'
IconHelp: 'Help'
```

## Usage Guidelines

### Decorative vs. Semantic Icons

**Decorative Icons** (can omit alt text if accompanied by text):

```jsx
// Icon next to text - decorative
<button>
  <IconEdit /> Edit Profile
</button>

// Alt text can be omitted because text label provides context
<IconEdit alt="" aria-hidden="true" />
```

**Semantic Icons** (always include alt text):

```jsx
// Icon as the only representation
<button aria-label="Edit profile">
  <IconEdit />
</button>

// Or
<IconEdit alt="Edit profile" />

// Or
<IconEdit title="Edit profile" />
```

### ARIA Attributes

Recommended ARIA patterns for different use cases:

```jsx
// Icon button with aria-label
<button aria-label="Open menu">
  <IconMenu />
</button>

// Icon with role and aria-label
<IconApproved alt="Application approved" role="img" />

// Icon in a badge (aria-hidden if text provides context)
<span className="badge">
  <IconApproved aria-hidden="true" />
  Approved
</span>

// Icon with aria-describedby for additional context
<div>
  <IconWarning aria-describedby="warning-text" />
  <span id="warning-text">Order could not be processed</span>
</div>
```

### Color and Contrast

All icons meet WCAG AA contrast standards:

- Default (dark gray #333333): 5:1 contrast on white background
- Accent orange (#FF6B35): 4.5:1 contrast on white background
- Success green (#4CAF50): 4.5:1 contrast on white background
- Danger red (#F44336): 4.5:1 contrast on white background
- Warning yellow (#FFC107): 3.2:1 contrast (note: lower than AA, consider text alternative)

**Best practice:** Don't rely on color alone to convey meaning. Combine with icons, text labels, or patterns.

### Screen Reader Testing

Test icons with screen readers:

- NVDA (Windows): Free
- JAWS (Windows): Commercial
- VoiceOver (Mac/iOS): Built-in
- TalkBack (Android): Built-in

**Test checklist:**

- [ ] Icon purpose is clear
- [ ] Alt text is concise (< 125 characters)
- [ ] No repetition (e.g., don't say "icon" in label)
- [ ] Contextual meaning is preserved

## Internationalization

Icon labels should be translated for multi-language support. Provide translations for all 45 icons:

```typescript
const iconLabels = {
  en: {
    home: 'Home',
    cart: 'Shopping cart',
    ...
  },
  sw: {
    home: 'Nyumbani',
    cart: 'Karata ya ununuzi',
    ...
  },
};
```

## Keyboard Navigation

Icons are keyboard accessible by design (when used in buttons or links):

- Tab: Focus on icon element
- Enter/Space: Activate if interactive
- No custom keyboard handlers required

## Mobile & Touch Accessibility

Icons resize responsively and work well on touch devices:

- Minimum touch target: 48px × 48px (use size="lg" for touch buttons)
- Icons scale with font size when using em or rem units
- Works with pinch-to-zoom

## Accessibility Checklist

Before using icons in your application:

- [ ] Icon has appropriate alt text or aria-label
- [ ] Icon colors meet 4.5:1 contrast minimum
- [ ] Icon is not the only way to convey information
- [ ] Color is not the only differentiator
- [ ] Icon has been tested with screen reader
- [ ] Touch targets are at least 48px × 48px
- [ ] Icons scale well at different sizes
- [ ] Keyboard navigation works as expected

## Resources

- [WCAG 2.1 Icon Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content)
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive SVG Icons](https://www.sitepoint.com/accessible-svg-icons/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
