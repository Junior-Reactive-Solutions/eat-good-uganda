# Icon Usage Guide

## Overview

This guide explains how to use the Eat Good Uganda custom icon system in your React applications. It covers when to use which icon, how to import them, and best practices for implementation.

## Quick Start

### Installation & Import

All icons are available from the customer app component library:

```typescript
import { IconHome, IconCart, IconApproved } from '@/components/icons'
```

### Basic Usage

```jsx
import { IconHome } from '@/components/icons'

export function Header() {
  return <IconHome size="md" />
}
```

### Sizing

Icons support three standard sizes plus custom pixel values:

```jsx
<IconHome size="sm" />    // 24px
<IconHome size="md" />    // 32px (default)
<IconHome size="lg" />    // 48px
<IconHome size={64} />    // Custom size
```

### Colors & States

Icons support semantic colors and interactive states:

```jsx
// Colors
<IconApproved color="success" />    // Green
<IconRejected color="danger" />     // Red
<IconPending color="warning" />     // Yellow
<IconAnalytics color="info" />      // Blue
<IconHome color="accent" />         // Orange (brand color)

// States
<IconHome state="default" />        // Normal
<IconHome state="active" />         // Highlighted/active
<IconHome state="disabled" />       // Grayed out
```

### Accessibility

All icons include alt text for screen readers:

```jsx
<IconHome alt="Go to home page" />
<IconCart alt="Shopping cart" />
```

## Icon Categories & Usage

### Payment Icons (6 icons)

Use in checkout flows, payment method selection, and billing pages.

| Icon                   | Use Cases                         | Example                 |
| ---------------------- | --------------------------------- | ----------------------- |
| **IconPaymentMomo**    | MTN Mobile Money method selection | "Pay with MTN MoMo"     |
| **IconPaymentAirtel**  | Airtel Money method selection     | "Pay with Airtel Money" |
| **IconPaymentBank**    | Bank transfer method              | "Pay via Bank Transfer" |
| **IconPaymentCod**     | Cash on delivery method           | "Pay on Delivery"       |
| **IconPaymentShield**  | Payment security indicator        | "Secure payment"        |
| **IconPaymentGeneric** | Generic mobile payment            | "Mobile payment"        |

**Best practice:** Use alongside text labels in payment flows. Payment icons should always be accompanied by the payment method name.

### Delivery Icons (5 icons)

Use for fulfillment options, order tracking, and logistics information.

| Icon                     | Use Cases              | Example                  |
| ------------------------ | ---------------------- | ------------------------ |
| **IconDeliveryPickup**   | Store pickup option    | "Pick up from store"     |
| **IconDeliveryBoda**     | Boda-boda delivery     | "Delivery by motorcycle" |
| **IconDeliveryTime**     | Delivery time estimate | "30-45 minute delivery"  |
| **IconDeliveryLocation** | Location/distance      | "3km away"               |
| **IconDeliveryStatus**   | Delivery tracking      | "Delivery in progress"   |

**Best practice:** Use in fulfillment selection and order tracking. Pair with relevant text describing the delivery option or status.

### Navigation Icons (8 icons)

Use in primary and secondary navigation, tab bars, and mobile menu.

| Icon              | Use Cases                | Example                       |
| ----------------- | ------------------------ | ----------------------------- |
| **IconHome**      | Home/dashboard link      | Primary nav                   |
| **IconSearch**    | Search functionality     | Search bar, product discovery |
| **IconCart**      | Shopping cart            | Checkout, cart page           |
| **IconOrders**    | Order history            | My orders, order list         |
| **IconProfile**   | User profile/account     | Account menu, profile page    |
| **IconFavorites** | Favorites/wishlist       | Save bakeries or products     |
| **IconMenu**      | Mobile navigation toggle | Hamburger menu                |
| **IconSettings**  | Settings/preferences     | Account settings              |

**Best practice:** Use only in primary navigation bars. Navigation icons should remain consistent throughout the app.

### Product Icons (8 icons)

Use for product categories, filtering, and bakery product types.

| Icon               | Use Cases                | Example                          |
| ------------------ | ------------------------ | -------------------------------- |
| **IconBread**      | Bread products           | Bread category filter            |
| **IconCake**       | Cakes and custom cakes   | Cake category                    |
| **IconPastry**     | Pastries and croissants  | Pastry category                  |
| **IconCupcake**    | Cupcakes                 | Cupcake category                 |
| **IconCookie**     | Cookies and biscuits     | Cookies category                 |
| **IconDonut**      | Donuts                   | Donuts category                  |
| **IconStarRating** | Star ratings and reviews | Product ratings, reviews         |
| **IconTrending**   | Trending/popular badge   | Popular badges, trending section |

**Best practice:** Use product icons in category navigation and product cards. The star-rating icon should appear next to numerical ratings.

### Admin Icons (10 icons)

Use in admin dashboards, status indicators, and management interfaces.

| Icon              | Use Cases                  | Example                          |
| ----------------- | -------------------------- | -------------------------------- |
| **IconApproved**  | Approved/confirmed status  | Bakery approved, order confirmed |
| **IconPending**   | Pending/waiting status     | Awaiting approval                |
| **IconRejected**  | Rejected/declined status   | Application rejected             |
| **IconSuspended** | Suspended/inactive status  | Account suspended                |
| **IconAnalytics** | Analytics/metrics view     | Dashboard, analytics page        |
| **IconCustomers** | Customer management        | Customers list, user management  |
| **IconRevenue**   | Revenue/financial metrics  | Revenue dashboard, sales         |
| **IconInventory** | Inventory/stock management | Stock levels, inventory          |
| **IconStaff**     | Staff/team management      | Staff list, team members         |
| **IconAuditLog**  | Activity/audit logs        | History, audit trail             |

**Best practice:** Status icons (approved, pending, rejected, suspended) should use semantic colors: green for approved, yellow for pending, red for rejected, gray for suspended.

### Interaction Icons (8 icons)

Use for form actions, common interactions, and user feedback.

| Icon                     | Use Cases              | Example                       |
| ------------------------ | ---------------------- | ----------------------------- |
| **IconEdit**             | Edit action            | Edit profile, edit order      |
| **IconDelete**           | Delete/remove action   | Delete item, remove from cart |
| **IconDownload**         | Download/export action | Export CSV, download receipt  |
| **IconShare**            | Share/social sharing   | Share bakery, referral        |
| **IconBellNotification** | Notifications/alerts   | Notification bell, alert      |
| **IconClock**            | Time/scheduling        | Opening hours, delivery time  |
| **IconPhone**            | Phone/contact          | Call support, contact         |
| **IconHelp**             | Help/FAQ/support       | Help icon, support link       |

**Best practice:** Action icons (edit, delete, download, share) should be paired with text labels in buttons or menus.

## Implementation Examples

### Payment Method Selection

```jsx
import {
  IconPaymentMomo,
  IconPaymentAirtel,
  IconPaymentBank,
  IconPaymentCod,
} from '@/components/icons'

export function PaymentMethodSelector() {
  return (
    <div className="payment-methods">
      <button className="payment-option">
        <IconPaymentMomo size="lg" />
        <span>MTN Mobile Money</span>
      </button>
      <button className="payment-option">
        <IconPaymentAirtel size="lg" />
        <span>Airtel Money</span>
      </button>
      <button className="payment-option">
        <IconPaymentBank size="lg" />
        <span>Bank Transfer</span>
      </button>
      <button className="payment-option">
        <IconPaymentCod size="lg" />
        <span>Cash on Delivery</span>
      </button>
    </div>
  )
}
```

### Product Category Filter

```jsx
import {
  IconBread,
  IconCake,
  IconPastry,
  IconCupcake,
  IconCookie,
  IconDonut,
} from '@/components/icons'

export function ProductCategories() {
  return (
    <div className="categories">
      <button>
        <IconBread size="md" /> Bread
      </button>
      <button>
        <IconCake size="md" /> Cakes
      </button>
      <button>
        <IconPastry size="md" /> Pastries
      </button>
      <button>
        <IconCupcake size="md" /> Cupcakes
      </button>
      <button>
        <IconCookie size="md" /> Cookies
      </button>
      <button>
        <IconDonut size="md" /> Donuts
      </button>
    </div>
  )
}
```

### Status Indicator

```jsx
import { IconApproved, IconPending, IconRejected, IconSuspended } from '@/components/icons'

export function StatusBadge({ status }) {
  const iconMap = {
    approved: { icon: IconApproved, color: 'success', label: 'Approved' },
    pending: { icon: IconPending, color: 'warning', label: 'Pending' },
    rejected: { icon: IconRejected, color: 'danger', label: 'Rejected' },
    suspended: { icon: IconSuspended, color: 'default', label: 'Suspended' },
  }

  const { icon: Icon, color, label } = iconMap[status]
  return (
    <span className={`status status-${color}`}>
      <Icon size="sm" color={color} />
      {label}
    </span>
  )
}
```

## Performance Tips

1. **Use appropriate sizes** - Don't use lg (48px) for inline icons; use sm (24px) instead
2. **Avoid color props in loops** - Pre-compute color values outside render
3. **Memoize icon components** - Use React.memo() if passing as props
4. **Lazy load if needed** - Icons are lightweight, but can be code-split if necessary

## Accessibility Tips

1. **Always provide alt text** for semantic icons (status, action icons)
2. **Decorative icons** can omit alt text if accompanied by text labels
3. **Color alone** should not convey meaning; use icons with text or combine with visual indicators
4. **Test with screen readers** - Verify icons work with NVDA, JAWS, VoiceOver

## Browser Support

All custom icons use SVG with inline content, supported by all modern browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Troubleshooting

### Icon not showing

- Verify import path: should be from '@/components/icons'
- Check component name: should be Icon{Category}{Name}
- Ensure icon is exported in barrel export

### Icon too large/small

- Use size prop: sm (24px), md (32px), lg (48px)
- Or specify custom size: size={64}

### Color not applying

- Verify color prop is a valid semantic color
- Check if state="disabled" overrides color (disabled is always gray)
- Ensure CSS doesn't override SVG stroke color

## Questions?

Refer to ICON_ACCESSIBILITY.md for accessibility details, ICON_BRAND_GUIDELINES.md for design standards, or ICON_DO_AND_DONT.md for best practices.
