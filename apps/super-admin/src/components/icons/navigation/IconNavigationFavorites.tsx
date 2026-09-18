import { Heart } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconNavigationFavorites
 * navigation icon — Phosphor `Heart`
 * @example
 * <IconNavigationFavorites size="md" />
 * <IconNavigationFavorites size="lg" color="accent" />
 */
export const IconNavigationFavorites = adaptIcon(Heart, 'favourites')

IconNavigationFavorites.displayName = 'IconNavigationFavorites'
