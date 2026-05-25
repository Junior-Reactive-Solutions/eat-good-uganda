import React from 'react'

import type { IconProps } from '@/types/icon'
import { ICON_SIZES } from '@/types/icon'

/**
 * Base Icon wrapper component
 *
 * Provides a common wrapper for all icon components with consistent sizing,
 * color, and state management. Individual icon components render SVG content
 * as children within this wrapper.
 *
 * @example
 * <Icon size="lg" color="primary">
 *   <circle cx="12" cy="12" r="10" fill="currentColor" />
 * </Icon>
 */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  (
    {
      size = 'md',
      color = 'default',
      state = 'default',
      className = '',
      alt = 'icon',
      'data-testid': dataTestId,
      children,
      style = {},
      ...props
    },
    ref,
  ) => {
    const sizePixels = ICON_SIZES[size]
    const sizeClass = `icon-${size}`
    const colorClass = `icon-color-${color}`
    const stateClass = `icon-state-${state}`

    // Combine all classes
    const combinedClassName = [sizeClass, colorClass, stateClass, className]
      .filter(Boolean)
      .join(' ')

    // Prepare SVG attributes
    const svgStyle: React.CSSProperties = {
      width: sizePixels,
      height: sizePixels,
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style,
    }

    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        width={sizePixels}
        height={sizePixels}
        role="img"
        aria-label={alt}
        className={combinedClassName}
        style={svgStyle}
        data-testid={dataTestId}
        {...props}
      >
        {children}
      </svg>
    )
  },
)

Icon.displayName = 'Icon'
