import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconAdminAnalytics
 * admin icon component
 * @example
 * <IconAdminAnalytics size="md" />
 * <IconAdminAnalytics size="lg" color="accent" />
 */
export const IconAdminAnalytics: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'analytics',
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
        y="10"
        width="2.5"
        height="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        rx="1"
      />
      <rect
        x="8.75"
        y="8"
        width="2.5"
        height="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        rx="1"
      />
      <rect
        x="13.5"
        y="6"
        width="2.5"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        rx="1"
      />
      <rect
        x="18.25"
        y="12"
        width="2.5"
        height="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        rx="1"
      />
      <line
        x1="4"
        y1="18"
        x2="20.75"
        y2="18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Icon>
  )
}

IconAdminAnalytics.displayName = 'IconAdminAnalytics'
