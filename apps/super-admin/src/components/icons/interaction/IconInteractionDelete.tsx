import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconInteractionDelete
 * Delete/Trash icon for removing items
 * @example
 * <IconInteractionDelete size="md" />
 * <IconInteractionDelete color="danger" />
 */
export const IconInteractionDelete: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'Delete',
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
        d="M 6 19 C 6 20.1 6.9 21 8 21 H 16 C 17.1 21 18 20.1 18 19 V 7 H 6 Z M 8 9 H 16 V 19 H 8 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 15.5 4 L 14.5 3 H 9.5 L 8.5 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

IconInteractionDelete.displayName = 'IconInteractionDelete'
