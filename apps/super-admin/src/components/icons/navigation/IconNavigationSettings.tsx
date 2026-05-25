import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconNavigationSettings
 * navigation icon component
 * @example
 * <IconNavigationSettings size="md" />
 * <IconNavigationSettings size="lg" color="accent" />
 */
export const IconNavigationSettings: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'settings',
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
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <g
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect
          x="11"
          y="2"
          width="2"
          height="2.5"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />

        <rect
          x="16.5"
          y="4.5"
          width="2"
          height="2.5"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          transform="rotate(60 17.5 5.75)"
        />

        <rect
          x="16.5"
          y="17"
          width="2"
          height="2.5"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          transform="rotate(120 17.5 18.25)"
        />

        <rect
          x="11"
          y="19.5"
          width="2"
          height="2.5"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />

        <rect
          x="5.5"
          y="17"
          width="2"
          height="2.5"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          transform="rotate(-120 6.5 18.25)"
        />

        <rect
          x="5.5"
          y="4.5"
          width="2"
          height="2.5"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          transform="rotate(-60 6.5 5.75)"
        />
      </g>

      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </Icon>
  )
}

IconNavigationSettings.displayName = 'IconNavigationSettings'
