import type React from 'react'

/**
 * Size options for icons
 * - sm: 16px (small UI elements, inline text)
 * - md: 24px (default, general purpose)
 * - lg: 32px (larger UI components)
 * - xl: 48px (hero elements, featured sections)
 */
export type IconSize = 'sm' | 'md' | 'lg' | 'xl'

/**
 * Color options for icons
 * - default: use current text color or inherit from parent
 * - primary: primary brand color
 * - accent: accent color for emphasis
 * - success: green for positive/approved states
 * - error: red for errors/critical states
 * - warning: orange for warnings
 * - info: blue for informational content
 * - neutral: gray for disabled/inactive states
 */
export type IconColor =
  | 'default'
  | 'primary'
  | 'accent'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'neutral'

/**
 * State variants for icons
 * - default: normal/enabled state
 * - hover: mouse hover state
 * - active: pressed/selected state
 * - disabled: disabled/inactive state
 */
export type IconState = 'default' | 'hover' | 'active' | 'disabled'

/**
 * Props for all icon components
 */
export interface IconProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'children'> {
  /**
   * Size of the icon
   * @default 'md'
   */
  size?: IconSize | undefined

  /**
   * Color variant
   * @default 'default'
   */
  color?: IconColor | undefined

  /**
   * Visual state variant
   * @default 'default'
   */
  state?: IconState | undefined

  /**
   * Alternative text for accessibility
   */
  alt?: string | undefined

  /**
   * CSS class name for additional styling
   */
  className?: string | undefined

  /**
   * Test ID for testing
   */
  'data-testid'?: string | undefined

  /**
   * Children SVG content (internal use)
   */
  children?: React.ReactNode
}

/**
 * Size values in pixels for rendering
 */
export const ICON_SIZES: Record<IconSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
}

/**
 * CSS variables for icon colors
 */
export const ICON_COLOR_VARS: Record<IconColor, string> = {
  default: 'currentColor',
  primary: 'var(--color-primary)',
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
  neutral: 'var(--color-neutral)',
}
