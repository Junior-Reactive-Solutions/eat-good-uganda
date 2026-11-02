import { ShareNetworkIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconInteractionShare
 * interaction icon — Phosphor `ShareNetwork`
 * @example
 * <IconInteractionShare size="md" />
 * <IconInteractionShare size="lg" color="accent" />
 */
export const IconInteractionShare = adaptIcon(ShareNetworkIcon, 'share')

IconInteractionShare.displayName = 'IconInteractionShare'
