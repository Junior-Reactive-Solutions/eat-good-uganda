import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconProductBreadLoaf
 * product icon component
 * @example
 * <IconProductBreadLoaf size="md" />
 * <IconProductBreadLoaf size="lg" color="accent" />
 */
export const IconProductBreadLoaf: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'bread-loaf',
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
        d="M 6.5 16 Q 6.5 10 12 7 Q 17.5 10 17.5 16"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <line
        x1="6.5"
        y1="16"
        x2="17.5"
        y2="16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M 8 13 L 9.5 10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 12 10 L 13.5 13"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 15 13 L 16.5 10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 7.5 12 Q 8.5 11 9.5 12"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M 14.5 12 Q 15.5 11 16.5 12"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
    </Icon>
  )
}

IconProductBreadLoaf.displayName = 'IconProductBreadLoaf'
