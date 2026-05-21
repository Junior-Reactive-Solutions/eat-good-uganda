import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconProductTrending
 * product icon component
 * @example
 * <IconProductTrending size="md" />
 * <IconProductTrending size="lg" color="accent" />
 */
export const IconProductTrending: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'trending',
  'data-testid': dataTestId,
}) => {
  return (
    <Icon
      size={size}
      color={color}
      state={state}
      className={className}
      alt={alt}
      data-testid={dataTestId}
    >
      <line
        x1="4"
        y1="20"
        x2="4"
        y2="3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <line
        x1="4"
        y1="20"
        x2="21"
        y2="20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M 5 15 L 8 12 L 11 13 L 14 8 L 17 9 L 20 4"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="5" cy="15" r="1" fill="currentColor" />
      <circle cx="8" cy="12" r="1" fill="currentColor" />
      <circle cx="11" cy="13" r="1" fill="currentColor" />
      <circle cx="14" cy="8" r="1" fill="currentColor" />
      <circle cx="17" cy="9" r="1" fill="currentColor" />
      <circle cx="20" cy="4" r="1" fill="currentColor" />

      <path
        d="M 20 4 L 19.5 2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </Icon>
  )
}

IconProductTrending.displayName = 'IconProductTrending'
