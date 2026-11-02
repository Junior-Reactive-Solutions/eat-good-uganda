import { PencilSimpleIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconInteractionEdit
 * interaction icon — Phosphor `PencilSimple`
 * @example
 * <IconInteractionEdit size="md" />
 * <IconInteractionEdit size="lg" color="accent" />
 */
export const IconInteractionEdit = adaptIcon(PencilSimpleIcon, 'edit')

IconInteractionEdit.displayName = 'IconInteractionEdit'
