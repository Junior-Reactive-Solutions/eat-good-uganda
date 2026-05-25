import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconPaymentShield
 * payment icon component
 * @example
 * <IconPaymentShield size="md" />
 * <IconPaymentShield size="lg" color="accent" />
 */
export const IconPaymentShield: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'shield',
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
        d="M 12 3 L 19 6 L 19 12.5 C 19 17 12 21 12 21 C 12 21 5 17 5 12.5 L 5 6 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        rx="2"
      />

      <path
        d="M 12 5.5 L 17.5 7.5 L 17.5 12.5 C 17.5 16 12 19.5 12 19.5 C 12 19.5 6.5 16 6.5 12.5 L 6.5 7.5 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />

      <path
        d="M 10 13 L 11.5 14.5 L 14.5 10"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

IconPaymentShield.displayName = 'IconPaymentShield'
