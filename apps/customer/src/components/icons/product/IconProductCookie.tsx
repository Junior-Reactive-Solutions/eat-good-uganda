import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconProductCookie
 * product icon component
 * @example
 * <IconProductCookie size="md" />
 * <IconProductCookie size="lg" color="accent" />
 */
export const IconProductCookie: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'cookie',
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
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none" />

      <circle cx="9" cy="10" r="1.2" fill="currentColor" />
      <circle cx="13" cy="9" r="1" fill="currentColor" />
      <circle cx="11" cy="13" r="1.2" fill="currentColor" />
      <circle cx="14" cy="12" r="1" fill="currentColor" />
      <circle cx="10" cy="14" r="0.9" fill="currentColor" />

      <path
        d="M 19.5 12 Q 20.5 9 17.5 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      <path
        d="M 5.5 12 Q 6 10 7.5 9"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
    </Icon>
  )
}

IconProductCookie.displayName = 'IconProductCookie'
