# Prompt 22 — Accessibility & Final Polish

## Context

The application needs WCAG 2.1 AA compliance and final polish before MVP launch.

Read before starting:
- `instructions/10-accessibility-rules.md` (create this first if missing)
- `docs/15-ROADMAP.md` (post-MVP items)

## Goal

Implement accessibility features, create accessibility rules documentation, and perform MVP readiness checklist.

## Deliverables

### Accessibility rules

`instructions/10-accessibility-rules.md`:
- WCAG 2.1 AA compliance requirements
- Color contrast requirements (4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation requirements
- Screen reader compatibility rules
- Focus management requirements
- ARIA usage guidelines
- Form accessibility requirements
- Error message accessibility

### Accessibility implementation

- Add `aria-labels`, `role` attributes where needed
- Ensure all interactive elements are keyboard accessible
- Focus indicators visible on all focusable elements
- Form errors announced to screen readers
- Skip-to-content links on all pages
- Alt text required on all images

### Color contrast validation

`packages/shared/src/accessibility/contrast.ts`:
- Validate bakery theme colors meet WCAG contrast ratios
- Reject themes that don't meet 4.5:1 for primary text colors
- Warn but allow 3:1 for large/decorative text

### Keyboard navigation testing

- All menus navigable by keyboard
- Modal dialogs trap focus correctly
- Escape key closes modals/dropdowns
- Tab order is logical

### MVP readiness checklist

`docs/MVP-READY.md`:
- [ ] All 21 prompts completed
- [ ] Five bakeries onboarded on staging
- [ ] End-to-end sandbox flow works (MoMo + Airtel + Bank + COD)
- [ ] 10 critical E2E tests pass
- [ ] Security audit complete
- [ ] Performance acceptable (Lighthouse > 70)
- [ ] Mobile responsive (320px - 1920px)
- [ ] All error states handled gracefully
- [ ] Logging and observability in place

### Final review

- Audit against `docs/14-SECURITY.md` checklist
- Verify no secrets in code or logs
- Check all tenant-scoped endpoints have isolation tests
- Verify rate limiting on all auth endpoints

## Acceptance checklist

- [ ] Accessibility rules documented
- [ ] All pages keyboard navigable
- [ ] Screen reader compatible
- [ ] Color contrast validation in theming
- [ ] MVP readiness checklist complete
- [ ] Security review passed
- [ ] Ready for production launch