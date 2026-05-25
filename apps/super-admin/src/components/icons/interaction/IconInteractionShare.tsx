import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconInteractionShare
 * Share icon for social sharing and referrals
 * @example
 * <IconInteractionShare size="md" />
 * <IconInteractionShare size="lg" />
 */
export const IconInteractionShare: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'Share',
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
      <circle cx="18" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="19" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <line
        x1="8.59"
        y1="13.51"
        x2="15.42"
        y2="17.49"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="15.41"
        y1="6.51"
        x2="8.59"
        y2="10.49"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Icon>
  )
}

IconInteractionShare.displayName = 'IconInteractionShare'
