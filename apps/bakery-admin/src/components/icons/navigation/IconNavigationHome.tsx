import { HouseIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconNavigationHome
 * navigation icon — Phosphor `House`
 * @example
 * <IconNavigationHome size="md" />
 * <IconNavigationHome size="lg" color="accent" />
 */
export const IconNavigationHome = adaptIcon(HouseIcon, 'home')

IconNavigationHome.displayName = 'IconNavigationHome'
