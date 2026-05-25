import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconPaymentGeneric
 * payment icon component
 * @example
 * <IconPaymentGeneric size="md" />
 * <IconPaymentGeneric size="lg" color="accent" />
 */
export const IconPaymentGeneric: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'generic',
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
      <rect
        x="8.5"
        y="5"
        width="7"
        height="14"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="9"
        y="5.5"
        width="6"
        height="12"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />

      <path
        d="M 7 12 Q 7 9 10 9"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 5.5 12 Q 5.5 8 10 8"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M 17 12 Q 17 9 14 9"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 18.5 12 Q 18.5 8 14 8"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />

      <circle cx="14" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </Icon>
  )
}

IconPaymentGeneric.displayName = 'IconPaymentGeneric'
