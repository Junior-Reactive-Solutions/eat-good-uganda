import { BellIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconInteractionBellNotification
 * interaction icon — Phosphor `Bell`
 * @example
 * <IconInteractionBellNotification size="md" />
 * <IconInteractionBellNotification size="lg" color="accent" />
 */
export const IconInteractionBellNotification = adaptIcon(BellIcon, 'notifications')

IconInteractionBellNotification.displayName = 'IconInteractionBellNotification'
