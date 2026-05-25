import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconNavigationHome
 * navigation icon component
 * @example
 * <IconNavigationHome size="md" />
 * <IconNavigationHome size="lg" color="accent" />
 */
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
      <path
        d="M12 3L4 9V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V9L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="10"
        y="14"
        width="4"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="13.5" cy="18" r="0.6" fill="currentColor" stroke="none" />

      <rect
        x="6.5"
        y="10.5"
        width="2.5"
        height="2.5"
        rx="0.5"
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
