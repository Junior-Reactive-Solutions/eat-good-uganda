import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconDeliveryTime
 * delivery icon component
 * @example
 * <IconDeliveryTime size="md" />
 * <IconDeliveryTime size="lg" color="accent" />
 */
export const IconDeliveryTime: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'time',
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
        d="M 7 3 L 17 3 Q 18 3 18 4 L 18 7 L 6 7 L 6 4 Q 6 3 7 3 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 6 17 L 6 20 Q 6 21 7 21 L 17 21 Q 18 21 18 20 L 18 17 L 6 17 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <line
        x1="12"
        y1="7"
        x2="12"
        y2="17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <path d="M 8 4 L 16 4 L 14 7 L 10 7 Z" fill="currentColor" stroke="none" opacity="0.8" />

      <path
        d="M 11.5 9 Q 12 10 12.5 11"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 11 10 Q 11.5 11 12 12"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />

      <path d="M 10 17 L 14 17 L 16 20 L 8 20 Z" fill="currentColor" stroke="none" opacity="0.6" />
    </Icon>
  )
}

IconDeliveryTime.displayName = 'IconDeliveryTime'
