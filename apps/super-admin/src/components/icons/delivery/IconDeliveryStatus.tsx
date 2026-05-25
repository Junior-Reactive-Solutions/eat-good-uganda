import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconDeliveryStatus
 * delivery icon component
 * @example
 * <IconDeliveryStatus size="md" />
 * <IconDeliveryStatus size="lg" color="accent" />
 */
export const IconDeliveryStatus: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'status',
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
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />

      <path
        d="M 7 8 Q 10 7 13 9 Q 16 11 16 15"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="7" cy="8" r="1.8" fill="currentColor" stroke="none" />

      <circle
        cx="13"
        cy="9"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="16"
        cy="15"
        r="1.8"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="10" cy="7.5" r="0.5" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="15" cy="12.5" r="0.5" fill="currentColor" stroke="none" opacity="0.6" />

      <path
        d="M 16 15 L 18 17 M 16 15 L 17.5 14"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </Icon>
  )
}

IconDeliveryStatus.displayName = 'IconDeliveryStatus'
