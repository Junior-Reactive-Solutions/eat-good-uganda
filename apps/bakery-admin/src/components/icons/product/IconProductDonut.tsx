import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconProductDonut
 * product icon component
 * @example
 * <IconProductDonut size="md" />
 * <IconProductDonut size="lg" color="accent" />
 */
export const IconProductDonut: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'donut',
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
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />

      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="2" fill="none" />

      <path
        d="M 4 12 Q 4 6 12 4 Q 20 6 20 12"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      <line
        x1="7"
        y1="8"
        x2="7"
        y2="4.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="5"
        x2="12"
        y2="1.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="17"
        y1="8"
        x2="17"
        y2="4.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />

      <line
        x1="9.5"
        y1="6.5"
        x2="9.5"
        y2="3"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="14.5"
        y1="6.5"
        x2="14.5"
        y2="3"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.7"
      />
    </Icon>
  )
}

IconProductDonut.displayName = 'IconProductDonut'
