import React from 'react'

import { Icon } from '@/components/Icon'
import type { IconProps } from '@/types/icon'

/**
 * IconInteractionEdit
 * Edit/Pencil icon for editing forms and content
 * @example
 * <IconInteractionEdit size="md" />
 * <IconInteractionEdit size="lg" color="accent" />
 */
export const IconInteractionEdit: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = 'Edit',
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
        d="M 3 17.25 V 21 H 6.75 L 17.81 9.94 L 14.06 6.19 Z M 20.71 7.04 C 20.71 6.63 20.4 6.32 20.04 6.32 L 17.68 3.96 C 17.32 3.6 16.79 3.6 16.43 3.96 L 15.12 5.27 L 18.87 9.02 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

IconInteractionEdit.displayName = 'IconInteractionEdit'
