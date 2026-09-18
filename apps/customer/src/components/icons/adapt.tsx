import type { Icon as PhosphorGlyph } from '@phosphor-icons/react'
import React from 'react'

import type { IconProps } from '@/types/icon'
import { ICON_SIZES } from '@/types/icon'

/**
 * Wraps a Phosphor glyph in the platform's IconProps contract.
 *
 * Keeps every existing call site working unchanged — `size`, `color`, `state`,
 * `className` and `data-testid` behave exactly as they did with the hand-drawn
 * icons, and the same `icon-*` CSS classes are emitted.
 *
 * Accessibility: an icon with no `alt` (or `alt=""`) is decorative and is hidden
 * from assistive technology. Only an icon with real alt text is exposed as an
 * image. This fixes the previous behaviour, where every icon rendered
 * `role="img"` with a default label of "icon".
 *
 * @example
 * export const IconNavigationHome = adaptIcon(House, 'home')
 */
export function adaptIcon(
  Glyph: PhosphorGlyph,
  defaultAlt: string,
): React.FC<IconProps> {
  const Adapted: React.FC<IconProps> = ({
    size = 'md',
    color = 'default',
    state = 'default',
    className = '',
    alt,
    'data-testid': dataTestId,
    children: _children,
    ...rest
  }) => {
    const label = alt ?? defaultAlt
    const decorative = label === ''

    const combinedClassName = [
      `icon-${size}`,
      `icon-color-${color}`,
      `icon-state-${state}`,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const a11y = decorative
      ? ({ 'aria-hidden': true } as const)
      : ({ role: 'img', 'aria-label': label } as const)

    return (
      <Glyph
        size={ICON_SIZES[size]}
        weight="regular"
        className={combinedClassName}
        data-testid={dataTestId}
        {...a11y}
        {...rest}
      />
    )
  }

  return Adapted
}
