import { WarningCircleIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconInteractionWarning
 * interaction icon — Phosphor `WarningCircle`
 * @example
 * <IconInteractionWarning size="md" />
 * <IconInteractionWarning size="lg" color="error" />
 */
export const IconInteractionWarning = adaptIcon(WarningCircleIcon, 'warning')

IconInteractionWarning.displayName = 'IconInteractionWarning'
