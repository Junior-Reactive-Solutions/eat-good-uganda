import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconProductCupcake
 * product icon component
 * @example
 * <IconProductCupcake size="md" />
 * <IconProductCupcake size="lg" color="accent" />
 */
export const IconProductCupcake: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'cupcake',
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
        d="M 8 13 L 7 20 Q 7 21 8.5 21.5 L 15.5 21.5 Q 17 21 17 20 L 16 13 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 10 11 Q 12 7 14 11 Q 12 8 10 11"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="12" cy="5" r="1.5" fill="currentColor" />

      <line
        x1="9"
        y1="15"
        x2="8.5"
        y2="20"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
      <line
        x1="15"
        y1="15"
        x2="15.5"
        y2="20"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
    </Icon>
  )
}

IconProductCupcake.displayName = 'IconProductCupcake'
