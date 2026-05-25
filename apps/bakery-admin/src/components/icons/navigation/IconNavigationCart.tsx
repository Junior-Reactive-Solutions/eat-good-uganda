import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconNavigationCart
 * navigation icon component
 * @example
 * <IconNavigationCart size="md" />
 * <IconNavigationCart size="lg" color="accent" />
 */
export const IconNavigationCart: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'cart',
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
        d="M4 8H20L19 19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19L4 8Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M7 8C7 6.34315 8.34315 5 10 5H14C15.6569 5 17 6.34315 17 8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="8" cy="21" r="0.8" fill="currentColor" stroke="none" />

      <circle cx="16" cy="21" r="0.8" fill="currentColor" stroke="none" />
    </Icon>
  )
}

IconNavigationCart.displayName = 'IconNavigationCart'
