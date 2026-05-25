import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconAdminCustomers
 * admin icon component
 * @example
 * <IconAdminCustomers size="md" />
 * <IconAdminCustomers size="lg" color="accent" />
 */
export const IconAdminCustomers: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'customers',
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
      <circle cx="8" cy="6" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="6" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="3.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M 5.5 10 Q 5.5 9 7.5 9 L 8.5 9 Q 10.5 9 10.5 11 L 10.5 17 Q 10.5 18 9.5 18 L 6.5 18 Q 5.5 18 5.5 17 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M 13.5 10 Q 13.5 9 15.5 9 L 16.5 9 Q 18.5 9 18.5 11 L 18.5 17 Q 18.5 18 17.5 18 L 14.5 18 Q 13.5 18 13.5 17 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

IconAdminCustomers.displayName = 'IconAdminCustomers'
