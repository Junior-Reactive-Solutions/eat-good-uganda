import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconDeliveryPickup
 * delivery icon component
 * @example
 * <IconDeliveryPickup size="md" />
 * <IconDeliveryPickup size="lg" color="accent" />
 */
export const IconDeliveryPickup: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'pickup',
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
        d="M 5 18 L 6 10 L 18 10 L 19 18"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="10"
        y="12"
        width="4"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="13.5" cy="15" r="0.8" fill="currentColor" stroke="none" />

      <path
        d="M 6 10 L 12 6 L 18 10"
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
      />

      <rect
        x="7.5"
        y="11.5"
        width="2.5"
        height="2.5"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="14"
        y="11.5"
        width="2.5"
        height="2.5"
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

IconDeliveryPickup.displayName = 'IconDeliveryPickup'
