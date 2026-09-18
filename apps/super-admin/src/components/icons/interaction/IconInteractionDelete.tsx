import { Trash } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconInteractionDelete
 * interaction icon — Phosphor `Trash`
 * @example
 * <IconInteractionDelete size="md" />
 * <IconInteractionDelete size="lg" color="accent" />
 */
export const IconInteractionDelete = adaptIcon(Trash, 'delete')

IconInteractionDelete.displayName = 'IconInteractionDelete'
