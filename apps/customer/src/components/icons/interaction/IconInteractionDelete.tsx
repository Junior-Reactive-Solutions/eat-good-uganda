import { TrashIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconInteractionDelete
 * interaction icon — Phosphor `Trash`
 * @example
 * <IconInteractionDelete size="md" />
 * <IconInteractionDelete size="lg" color="accent" />
 */
export const IconInteractionDelete = adaptIcon(TrashIcon, 'delete')

IconInteractionDelete.displayName = 'IconInteractionDelete'
