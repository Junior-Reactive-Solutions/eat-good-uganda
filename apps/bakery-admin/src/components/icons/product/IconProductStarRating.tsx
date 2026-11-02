import { StarIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconProductStarRating
 * product icon — Phosphor `Star`
 * @example
 * <IconProductStarRating size="md" />
 * <IconProductStarRating size="lg" color="accent" />
 */
export const IconProductStarRating = adaptIcon(StarIcon, 'rating')

IconProductStarRating.displayName = 'IconProductStarRating'
