# Task 9: Icon Integration Into Application Surfaces

**Status:** IN PROGRESS  
**Date Started:** 2026-05-21  
**Objective:** Replace Lucide icons with custom Eat Good Uganda icon system across 4 key application surfaces

---

## Phase 1: Analysis & Mapping

### Surface 1: Customer App Storefront (apps/customer/src)

**Key Pages:**

- HomePage.tsx - Hero, search, bakery list
- BakeryMenuPage.tsx - Product category/filter
- ProductDetailPage.tsx - Product display
- CheckoutPage.tsx - Checkout flow
- CartPage.tsx - Shopping cart
- OrderHistoryPage.tsx - Order list
- CustomerProfilePage.tsx - User profile

**Current Lucide Icons in Use:**

- Search (HomePage)
- MapPin (HomePage, location-based)
- Loader2 (loading states)
- X (close/dismiss)
- AlertCircle (error states)
- CheckCircle2 (success states, CheckoutPage)
- XCircle (error states, CheckoutPage)
- Plus/Minus (quantity controls - implied)

**Icons to Replace With Custom System:**

- Navigation: IconNavigationHome, IconNavigationSearch, IconNavigationCart, IconNavigationProfile, IconNavigationFavorites, IconNavigationMenu
- Product Categories: IconProductBreadLoaf, IconProductCake, IconProductPastry, IconProductCupcake, IconProductCookie, IconProductDonut
- Product Info: IconProductStarRating, IconProductTrending
- Delivery: IconDeliveryPickup, IconDeliveryBoda, IconDeliveryTime, IconDeliveryLocation
- Payment: IconPaymentMomo, IconPaymentAirtel, IconPaymentBank, IconPaymentCod, IconPaymentShield
- Interaction: IconInteractionEdit, IconInteractionDelete, IconInteractionDownload
- Approval/Status: IconAdminApproved, IconAdminPending, IconAdminRejected

---

### Surface 2: Bakery Vendor Dashboard (apps/bakery-admin/src)

**Key Pages:**

- DashboardPage.tsx - Dashboard overview
- OrdersPage.tsx - Order list/management
- OrderDetailPage.tsx - Order details
- MenuPage.tsx - Product menu
- ProductFormPage.tsx - Product form
- BakerySettingsPage.tsx - Settings

**Current Lucide Icons in Use:**

- DollarSign (revenue metric)
- Package (inventory/orders)
- ShoppingCart (orders)
- TrendingUp (growth/trends)
- Edit2 (edit action)
- Trash2 (delete action)
- Plus/Minus (form controls)
- AlertCircle (error/warnings)

**Icons to Replace With Custom System:**

- Navigation: IconNavigationHome, IconNavigationOrders, IconNavigationSettings, IconNavigationProfile
- Dashboard Metrics: IconAdminRevenue, IconAdminCustomers, IconAdminAnalytics, IconAdminInventory
- Status: IconAdminApproved, IconAdminPending, IconAdminRejected
- Management: IconAdminStaff
- Interaction: IconInteractionEdit, IconInteractionDelete, IconInteractionBellNotification
- Delivery Status: IconDeliveryStatus (for order tracking)

---

### Surface 3: Platform Admin Console (apps/super-admin/src)

**Key Pages:**

- AdminDashboardPage.tsx - Dashboard
- BakeriesPage.tsx - Bakery list
- BakeryDetailPage.tsx - Bakery details
- BakeryStaffPage.tsx - Staff management
- DataExportPage.tsx - Data export
- UserManagementPage.tsx - User management
- AuditLogsPage.tsx - Audit logs
- SupportPage.tsx - Support tickets

**Current Lucide Icons in Use:**

- DollarSign, Users, Store (dashboard metrics)
- AlertCircle (warnings/status)
- Search (search functionality)
- ChevronLeft/Right (pagination)
- Edit2, Trash2 (actions)
- Download (data export)
- Mail, Phone (contact)
- MessageSquare, Send (messaging)
- Eye (view/visibility)
- AlertTriangle (alerts)
- ArrowLeft (navigation)

**Icons to Replace With Custom System:**

- Navigation: IconNavigationHome, IconNavigationSearch, IconNavigationSettings
- Dashboard Metrics: IconAdminRevenue, IconAdminAnalytics, IconAdminCustomers, IconAdminInventory
- Status: IconAdminApproved, IconAdminPending, IconAdminRejected, IconAdminSuspended
- Management: IconAdminStaff, IconAdminAuditLog
- Interaction: IconInteractionEdit, IconInteractionDelete, IconInteractionDownload, IconInteractionBellNotification
- Keep some Lucide: ChevronLeft/Right (pagination), ArrowLeft (back), Mail, Phone (contact info), MessageSquare (chat)

---

### Surface 4: Checkout Flow (apps/customer/src/pages/CheckoutPage.tsx)

**Current Lucide Icons:**

- CheckCircle2 (success/approval)
- XCircle (error/rejection)
- Loader2 (loading)

**Icons to Replace:**

- Payment Methods: IconPaymentMomo, IconPaymentAirtel, IconPaymentBank, IconPaymentCod, IconPaymentShield
- Delivery Options: IconDeliveryPickup, IconDeliveryBoda, IconDeliveryTime, IconDeliveryLocation
- Status: IconAdminApproved (success), IconAdminRejected (error)
- Interaction: IconInteractionEdit, IconInteractionDelete (cart modifications)

---

## Phase 2: Implementation Strategy

### Step 1: Update Icon Exports to Match Convenient Names

Custom icons use fully-qualified names (e.g., IconNavigationHome, IconAdminRevenue).
Will create convenient aliases in the index.ts if needed to support simpler import paths.

### Step 2: Replace Icons by Surface (In Order)

1. **Customer Storefront** - Highest visibility, most icon usage
2. **Bakery Admin Dashboard** - Medium icon usage
3. **Super Admin Console** - Medium icon usage
4. **Checkout Flow** - Focused, specific icon set

### Step 3: Maintain Accessibility

- All icons have aria-hidden="true" where appropriate
- Use semantic color props: color="success" for approval, "danger" for rejection, etc.
- Ensure icons maintain current size and spacing relationships

### Step 4: Preserve Functionality

- Keep loading, error, and empty states functional
- Maintain all existing interactive behaviors
- Preserve responsive design

---

## Phase 3: Sizing & Color Guidelines

### Navigation Icons

- Size: md (32px)
- Color: default
- Context: Top nav, bottom nav, menu items
- Examples: Home, Search, Cart, Profile, Orders, Settings

### Status/Approval Icons

- Size: sm (24px) in badges, md (32px) in cards
- Color Mapping:
  - Approved/Success: color="success" (green)
  - Pending: color="warning" (amber/yellow)
  - Rejected/Failed: color="danger" (red)
  - Suspended: color="default" (gray)
- Context: Order status, bakery status, approval indicators

### Dashboard/Metric Icons

- Size: lg (48px) in large cards, md (32px) in smaller cards
- Color: accent or semantic
- Context: Revenue cards, customer count, analytics
- Examples: Revenue, Customers, Analytics, Inventory

### Action Icons (Edit, Delete, Download)

- Size: sm (24px)
- Color: default (or danger for delete)
- Context: In tables, card actions, forms
- Examples: Edit, Delete, Download, Share

### Category Icons (Product)

- Size: md (32px)
- Color: default
- Context: Product filters, category navigation
- Examples: Bread, Cake, Pastry, Cupcake, Cookie, Donut

### Payment Method Icons

- Size: lg (48px) in selection UI, md (32px) in badges
- Color: accent when selected, default when not
- Context: Payment method selector in checkout
- Examples: MoMo, Airtel Money, Bank, COD, Shield

### Delivery Option Icons

- Size: lg (48px) in selection UI, md (32px) in badges
- Color: accent when selected, default when not
- Context: Delivery method selector in checkout
- Examples: Pickup, Boda, Time, Location

---

## Deliverables Checklist

### Phase 1 Analysis

- [x] Document current icon usage across 4 surfaces
- [x] Map Lucide icons to custom icon components
- [x] Identify sizing and color requirements
- [x] Create implementation plan

### Phase 2 Implementation - PRIORITY ORDER

- [x] Update apps/customer checkout components (PaymentMethodSection, FulfillmentSection)
- [ ] Create reusable icon wrapper components for bakery-admin and super-admin
- [ ] Update apps/bakery-admin DashboardPage with custom icons
- [ ] Update apps/super-admin admin dashboard pages
- [ ] Update remaining customer app pages (navigation, product cards)
- [ ] Verify sizing and spacing consistency
- [ ] Test accessibility (keyboard, screen readers, color contrast)

### Phase 3 Verification

- [ ] Run full test suite (customer app tests)
- [ ] Verify visual consistency across surfaces
- [ ] Check responsive design (mobile, tablet, desktop)
- [ ] Validate semantic color usage
- [ ] Accessibility audit

### Phase 4 Documentation

- [ ] Create icon usage map (which icon used where)
- [ ] Document sizing conventions
- [ ] Document color conventions
- [ ] Update component documentation

## Implementation Notes

**Apps Structure:**

- apps/customer: Has custom icon components in `/apps/customer/src/components/icons/`
- apps/bakery-admin: Uses Lucide directly, would need icon components created or imported
- apps/super-admin: Uses Lucide directly, would need icon components created or imported

**Strategy:**

- Phase 1: Complete custom icon integration in apps/customer (highest priority, highest visibility)
- Phase 2: Extract icon components to shared package for reuse across apps
- Phase 3: Update bakery-admin and super-admin to use shared icon components

---

## Success Criteria

1. **All 4 surfaces updated** with custom icons
2. **Zero Lucide icon usage** (except where appropriate: pagination chevrons, contact icons)
3. **100% test pass rate** across all 4 apps
4. **Accessibility standards met** (WCAG AA+)
5. **Responsive design verified** (mobile 375px, tablet 768px, desktop 1280px)
6. **Visual consistency confirmed** across all surfaces
7. **Icon sizing consistent** within contexts
8. **Color semantics applied correctly** (status colors, accent vs default)

---

## Risk Mitigation

- **Backup**: All changes will be committed incrementally with passing tests
- **Testing**: Run full test suite after each surface update
- **Rollback**: Git history available if needed
- **Documentation**: Keep icon mapping updated as changes are made

---

## Progress Tracking

### Completed

- [x] Icon component library (45+ components)
- [x] Icon system documentation
- [x] Icon accessibility guidelines
- [x] Analysis of current icon usage

### In Progress

- [ ] Phase 2: Icon integration across 4 surfaces

### Next Steps

1. Create icon import/export convenience layer
2. Update Customer App (storefront) - highest priority
3. Update Bakery Admin Dashboard
4. Update Super Admin Console
5. Run full verification
6. Documentation and handoff
