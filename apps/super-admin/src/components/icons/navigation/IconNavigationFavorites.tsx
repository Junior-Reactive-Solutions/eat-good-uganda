import { HeartIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconNavigationFavorites
 * navigation icon — Phosphor `Heart`
 * @example
 * <IconNavigationFavorites size="md" />
 * <IconNavigationFavorites size="lg" color="accent" />
 */
export const IconNavigationFavorites = adaptIcon(HeartIcon, 'favourites')

IconNavigationFavorites.displayName = 'IconNavigationFavorites'
