import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconInteractionPhone
 * Phone icon for phone contact and support
 * @example
 * <IconInteractionPhone size="md" />
 * <IconInteractionPhone color="accent" />
 */
export const IconInteractionPhone: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'Phone',
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
        d="M 22 16.92 V 19.92 C 22 20.48 21.56 20.98 20.91 21.06 C 10.5 22.85 3.15 15.5 1.94 5.09 C 1.86 4.44 2.36 4 2.92 4 H 5.92 C 6.4 4 6.82 4.36 6.9 4.84 C 7.23 6.67 7.78 8.47 8.51 10.18 C 8.66 10.56 8.54 10.99 8.18 11.24 L 5.73 13.69 C 7.88 17.87 11.13 21.12 15.31 23.27 L 17.76 20.82 C 18.01 20.46 18.44 20.34 18.82 20.49 C 20.53 21.22 22.33 21.77 24.16 22.1 C 24.64 22.18 25 22.6 25 23.08 V 26.08"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

IconInteractionPhone.displayName = 'IconInteractionPhone'
