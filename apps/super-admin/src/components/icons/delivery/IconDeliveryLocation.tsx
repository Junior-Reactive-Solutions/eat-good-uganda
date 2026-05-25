import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconDeliveryLocation
 * delivery icon component
 * @example
 * <IconDeliveryLocation size="md" />
 * <IconDeliveryLocation size="lg" color="accent" />
 */
export const IconDeliveryLocation: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'location',
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
        d="M 12 3 C 14.8 3 17 5.2 17 8 C 17 11.5 12 19 12 19 C 12 19 7 11.5 7 8 C 7 5.2 9.2 3 12 3 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="8"
        r="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />

      <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />

      <line
        x1="12"
        y1="5.5"
        x2="12"
        y2="4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="14.3"
        y1="5.7"
        x2="15.5"
        y2="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <line
        x1="9.7"
        y1="5.7"
        x2="8.5"
        y2="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </Icon>
  )
}

IconDeliveryLocation.displayName = 'IconDeliveryLocation'
