import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconAdminRevenue
 * admin icon component
 * @example
 * <IconAdminRevenue size="md" />
 * <IconAdminRevenue size="lg" color="accent" />
 */
export const IconAdminRevenue: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'revenue',
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
      <ellipse cx="12" cy="7" rx="6" ry="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M 6 7 L 6 13 Q 6 15.5 12 16.5 Q 18 15.5 18 13 L 18 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <ellipse
        cx="12"
        cy="13"
        rx="6"
        ry="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <ellipse
        cx="12"
        cy="17"
        rx="6"
        ry="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
    </Icon>
  )
}

IconAdminRevenue.displayName = 'IconAdminRevenue'
