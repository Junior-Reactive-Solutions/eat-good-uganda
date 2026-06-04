import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

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
      {/* Head */}
      <circle cx="12" cy="7.5" r="3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
      {/* Body arc */}
      <path
        d="M5.5 20.5 C5.5 15 8 13 12 13 C16 13 18.5 15 18.5 20.5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Role badge - diamond on shoulder */}
      <path
        d="M17.5 10 L19.5 12 L17.5 14 L15.5 12 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

IconAdminStaff.displayName = 'IconAdminStaff'
