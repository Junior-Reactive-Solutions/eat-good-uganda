import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconProductCake
 * product icon component
 * @example
 * <IconProductCake size="md" />
 * <IconProductCake size="lg" color="accent" />
 */
export const IconProductCake: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'cake',
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
        d="M 5 10 L 5 19 Q 5 21 7 21 L 17 21 Q 19 21 19 19 L 19 10 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 6 15.5 Q 7 15 12 15 Q 17 15 18 15.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 6 18 Q 7 17.5 12 17.5 Q 17 17.5 18 18"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 9 8 Q 12 5 15 8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="12" cy="4" r="1.5" fill="currentColor" />
    </Icon>
  )
}

IconProductCake.displayName = 'IconProductCake'
