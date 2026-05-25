import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconPaymentBank
 * payment icon component
 * @example
 * <IconPaymentBank size="md" />
 * <IconPaymentBank size="lg" color="accent" />
 */
export const IconPaymentBank: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'bank',
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
        d="M 5 18 L 5 10 L 12 6 L 19 10 L 19 18"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <line
        x1="5"
        y1="18"
        x2="19"
        y2="18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="6.5"
        y="11"
        width="2"
        height="7"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="11"
        y="10"
        width="2"
        height="8"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="15.5"
        y="11"
        width="2"
        height="7"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 8 9.5 Q 12 7.5 16 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

IconPaymentBank.displayName = 'IconPaymentBank'
