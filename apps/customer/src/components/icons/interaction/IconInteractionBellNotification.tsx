import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconInteractionBellNotification
 * Bell icon for notifications and alerts
 * @example
 * <IconInteractionBellNotification size="md" />
 * <IconInteractionBellNotification color="warning" />
 */
export const IconInteractionBellNotification: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'Notifications',
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
        d="M 12 22 C 13.1 22 14 21.1 14 20 H 10 C 10 21.1 10.89 22 12 22 Z M 18 16 V 11 C 18 7.93 16.36 5.36 13.5 4.68 V 4 C 13.5 3.22 12.88 2.5 12 2.5 C 11.12 2.5 10.5 3.22 10.5 4 V 4.68 C 7.63 5.36 6 7.92 6 11 V 16 L 4 18 V 19 H 20 V 18 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

IconInteractionBellNotification.displayName = 'IconInteractionBellNotification'
