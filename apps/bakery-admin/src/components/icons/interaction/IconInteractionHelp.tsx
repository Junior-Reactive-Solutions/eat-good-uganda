import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconInteractionHelp
 * Help/Question mark icon for support and FAQ
 * @example
 * <IconInteractionHelp size="md" />
 * <IconInteractionHelp color="info" />
 */
export const IconInteractionHelp: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'Help',
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
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M 12 16.01 H 12.01"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 9 9 C 9 7.67 10.12 6.5 11.5 6.5 C 12.88 6.5 14 7.67 14 9 C 14 10.33 13 11 12.5 11.5 V 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

IconInteractionHelp.displayName = 'IconInteractionHelp'
