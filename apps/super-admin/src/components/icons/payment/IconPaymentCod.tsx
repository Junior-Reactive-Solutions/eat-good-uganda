import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconPaymentCod
 * payment icon component
 * @example
 * <IconPaymentCod size="md" />
 * <IconPaymentCod size="lg" color="accent" />
 */
export const IconPaymentCod: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'cod',
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
        x="6"
        y="9"
        width="12"
        height="3"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="6"
        y="12.5"
        width="12"
        height="3"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 7 17 Q 7 19 9 19 Q 11 19 12 18 Q 13 19 15 19 Q 17 19 17 17"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <line
        x1="8"
        y1="17"
        x2="8"
        y2="19.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="11"
        y1="17"
        x2="11"
        y2="19.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="17"
        x2="14"
        y2="19.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="17"
        y1="17"
        x2="17"
        y2="19.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <rect
        x="9"
        y="9.5"
        width="6"
        height="2"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

IconPaymentCod.displayName = 'IconPaymentCod'
