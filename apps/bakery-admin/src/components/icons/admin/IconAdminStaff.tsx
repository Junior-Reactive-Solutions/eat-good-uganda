import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconAdminStaff
 * admin icon component
 * @example
 * <IconAdminStaff size="md" />
 * <IconAdminStaff size="lg" color="accent" />
 */
export const IconAdminStaff: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'staff',
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
      <circle cx="12" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M 8 11 Q 8 10 10 10 L 14 10 Q 16 10 16 12 L 16 18 Q 16 18 12 19 Q 8 18 8 18 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle
        cx="17"
        cy="5.5"
        r="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.8"
      />
    </Icon>
  )
}

IconAdminStaff.displayName = 'IconAdminStaff'
