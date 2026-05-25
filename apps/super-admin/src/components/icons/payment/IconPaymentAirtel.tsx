import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconPaymentAirtel
 * payment icon component
 * @example
 * <IconPaymentAirtel size="md" />
 * <IconPaymentAirtel size="lg" color="accent" />
 */
export const IconPaymentAirtel: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'airtel',
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
      <circle
        cx="12"
        cy="12"
        r="11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 10.5 13 Q 10.5 11 12 11 Q 13.5 11 13.5 13"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 9 14.5 Q 9 11 12 11 Q 15 11 15 14.5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 8 16 Q 8 10.5 12 10.5 Q 16 10.5 16 16"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="12" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
    </Icon>
  )
}

IconPaymentAirtel.displayName = 'IconPaymentAirtel'
