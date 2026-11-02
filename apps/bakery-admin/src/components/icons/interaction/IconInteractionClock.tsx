import { ClockIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconInteractionClock
 * interaction icon — Phosphor `Clock`
 * @example
 * <IconInteractionClock size="md" />
 * <IconInteractionClock size="lg" color="accent" />
 */
export const IconInteractionClock = adaptIcon(ClockIcon, 'time')

IconInteractionClock.displayName = 'IconInteractionClock'
