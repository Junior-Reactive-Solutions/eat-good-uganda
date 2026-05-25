import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconPaymentMomo
 * payment icon component
 * @example
 * <IconPaymentMomo size="md" />
 * <IconPaymentMomo size="lg" color="accent" />
 */
export const IconPaymentMomo: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'momo',
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

      <rect
        x="9"
        y="7"
        width="6"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="9.5"
        y="7.5"
        width="5"
        height="8"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />

      <text
        x="12"
        y="14.5"
        fontFamily="Arial, sans-serif"
        fontSize="6"
        fontWeight="bold"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
      >
        ₦
      </text>

      <circle cx="12" cy="7.8" r="0.8" fill="currentColor" stroke="none" />
    </Icon>
  )
}

IconPaymentMomo.displayName = 'IconPaymentMomo'
