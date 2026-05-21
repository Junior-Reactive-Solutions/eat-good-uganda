import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconNavigationFavorites
 * navigation icon component
 * @example
 * <IconNavigationFavorites size="md" />
 * <IconNavigationFavorites size="lg" color="accent" />
 */
export const IconNavigationFavorites: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'favorites',
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
        d="M12 21C12 21 4 15 4 10C4 7.5 5.5 6 8 6C9.5 6 11 7 12 8.5C13 7 14.5 6 16 6C18.5 6 20 7.5 20 10C20 15 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M12 19C12 19 6 14.5 6 10.5C6 8.5 7 7.5 8.5 7.5C9.5 7.5 10.5 8 11.5 9C11.83 8.5 12 7.75 12 7.75"
        fill="currentColor"
        opacity="0.4"
      />
    </Icon>
  )
}

IconNavigationFavorites.displayName = 'IconNavigationFavorites'
