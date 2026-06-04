import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

export const IconNavigationHome: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'home',
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
      {/* Roof + walls in one clean path */}
      <path
        d="M12 3 L21 10 L21 21 C21 21.55 20.55 22 20 22
           L15 22 L15 16 Q15 15 14 15 L10 15 Q9 15 9 16
           L9 22 L4 22 C3.45 22 3 21.55 3 21 L3 10 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Chimney — small but visible at all sizes */}
      <path
        d="M16 3 L16 5 L18 5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

IconNavigationHome.displayName = 'IconNavigationHome'
