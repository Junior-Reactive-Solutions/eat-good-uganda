# Icon Animation Guidelines

## Overview

This guide provides recommendations and best practices for animating Eat Good Uganda custom icons. Animations should enhance user experience without being distracting or overwhelming.

## Animation Principles

### Core Rules

1. **Purposeful** - Animation should have a reason (feedback, state change, guidance)
2. **Subtle** - Keep animations light and refined (200-300ms duration)
3. **Performant** - Use GPU-accelerated properties (transform, opacity)
4. **Accessible** - Respect prefers-reduced-motion preference
5. **Consistent** - Same animations used for same interactions across app

### Timing

- **Quick feedback**: 200ms (button hover, state change)
- **Transition**: 300ms (page navigation, modal open)
- **Slow reveal**: 400-500ms (important announcement, loading states)
- **Avoid**: Anything over 500ms (feels sluggish)

### Easing

- **ease-in-out** (default) - Natural, organic feel
- **ease-out** - Snappy response, good for user actions
- **ease-in** - Thoughtful reveal, good for system-initiated
- **Avoid**: linear (feels mechanical), cubic-bezier (over-complicated)

## Animation Types

### 1. Scale (Hover/Focus)

Icon grows slightly on interaction.

```css
.icon-btn:hover icon {
  animation: scaleUp 200ms ease-out forwards;
}

@keyframes scaleUp {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.1);
  }
}
```

**Good for:** Buttons, interactive elements
**Duration:** 200ms
**Avoid:** Navigation icons (too much motion)

### 2. Fade (Visibility)

Icon fades in/out on state change.

```css
.icon-entering {
  animation: fadeIn 300ms ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Good for:** Loading states, entering/exiting elements
**Duration:** 300ms
**Avoid:** Too many fade animations at once (distracting)

### 3. Rotate (Loading/Progress)

Icon spins for loading states.

```css
.icon-loading {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

**Good for:** Loading indicators, processing
**Duration:** 2s (full rotation, continuous)
**Avoid:** Using for non-loading states

### 4. Slide (Navigation)

Icon slides in/out during page transitions.

```css
.icon-enter {
  animation: slideIn 300ms ease-out forwards;
}

@keyframes slideIn {
  from {
    transform: translateX(-10px);
  }
  to {
    transform: translateX(0);
  }
}
```

**Good for:** Page navigation, drawer open/close
**Duration:** 300ms
**Avoid:** Excessive movement (10-20px max)

### 5. Pulse (Attention)

Icon gently pulses to draw attention.

```css
.icon-notification {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
```

**Good for:** Notification badges, alerts
**Duration:** 2s (continuous, subtle)
**Avoid:** Fast pulsing (200ms) - it's distracting

## Implementation Examples

### Animated Button with Icon

```jsx
import { IconCart } from '@/components/icons'
import './animated-button.css'

export function AnimatedCartButton() {
  return (
    <button className="btn btn-primary btn-animated">
      <IconCart size="md" className="icon" />
      <span>Add to Cart</span>
    </button>
  )
}
```

```css
.btn-animated:hover .icon {
  animation: scaleUp 200ms ease-out;
}

@keyframes scaleUp {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.15);
  }
}
```

### Loading Spinner with Icon

```jsx
import { IconAnalytics } from '@/components/icons'
import './loading-spinner.css'

export function LoadingSpinner() {
  return (
    <div className="spinner">
      <IconAnalytics size="lg" className="spinner-icon" />
      <span>Loading...</span>
    </div>
  )
}
```

```css
.spinner-icon {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

### Notification Badge with Pulse

```jsx
import { IconBellNotification } from '@/components/icons'
import './notification-badge.css'

export function NotificationIcon({ count }) {
  return (
    <div className="notification-wrapper">
      <IconBellNotification size="md" />
      {count > 0 && <span className="badge notification-pulse">{count}</span>}
    </div>
  )
}
```

```css
.notification-pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.7);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 0 10px rgba(255, 107, 53, 0);
  }
}
```

## Accessibility: prefers-reduced-motion

Always respect user accessibility preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Or with Tailwind:

```jsx
<IconCart
  className={
    motion-reduce:animate-none
    animate-bounce
  }
/>
```

## Performance Considerations

### Good (GPU-accelerated)

```css
/* Use transform and opacity */
@keyframes efficient {
  to {
    transform: scale(1.1);
    opacity: 0.8;
  }
}
```

### Bad (Causes repaints)

```css
/* Avoid width, height, left, top, etc. */
@keyframes inefficient {
  to {
    width: 50px;
    height: 50px;
  }
}
```

## Animation Checklist

Before shipping animated icons:

- [ ] Animation has a clear purpose
- [ ] Duration is 200-500ms
- [ ] Using ease-in-out or ease-out easing
- [ ] Using GPU-accelerated properties (transform, opacity)
- [ ] prefers-reduced-motion is respected
- [ ] Animation tested at 60fps
- [ ] No performance issues (janky animation)
- [ ] Accessible (not required for functionality)
- [ ] Consistent with other animations in app
- [ ] Doesn't distract from content

## Don'ts

- Don't animate every icon ✗
- Don't use complex, multi-step animations ✗
- Don't ignore prefers-reduced-motion ✗
- Don't create animations over 500ms ✗
- Don't use animations as the only feedback ✗
- Don't make animations mandatory (should degrade gracefully) ✗

## Questions?

For animation questions or to propose new animation patterns:

- Slack: #design-system
- GitHub: Create issue with 'icon-animation' label
