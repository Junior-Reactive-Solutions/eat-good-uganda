import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconProductStarRating
 * product icon component
 * @example
 * <IconProductStarRating size="md" />
 * <IconProductStarRating size="lg" color="accent" />
 */
export const IconProductStarRating: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'star-rating',
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
      <path
        d="M 12 2 L 14.5 9 L 22 9 L 17 14 L 19.5 21 L 12 16.5 L 4.5 21 L 7 14 L 2 9 L 9.5 9 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      <path
        d="M 12 2 L 14.5 9"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
    </Icon>
  )
}

IconProductStarRating.displayName = 'IconProductStarRating'
