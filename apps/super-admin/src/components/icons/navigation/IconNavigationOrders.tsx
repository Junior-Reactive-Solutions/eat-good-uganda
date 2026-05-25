import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconNavigationOrders
 * navigation icon component
 * @example
 * <IconNavigationOrders size="md" />
 * <IconNavigationOrders size="lg" color="accent" />
 */
export const IconNavigationOrders: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'orders',
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
      <g>
        <rect
          x="5"
          y="15"
          width="8"
          height="6"
          rx="0.5"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <rect
          x="5"
          y="10"
          width="8"
          height="5"
          rx="0.5"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <rect
          x="5"
          y="5"
          width="8"
          height="5"
          rx="0.5"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <line
          x1="14"
          y1="6"
          x2="18"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="14"
          y1="9"
          x2="18"
          y2="9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="14"
          y1="12"
          x2="18"
          y2="12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </Icon>
  )
}

IconNavigationOrders.displayName = 'IconNavigationOrders'
