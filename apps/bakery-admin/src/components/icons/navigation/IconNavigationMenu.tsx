import { ListIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconNavigationMenu
 * navigation icon — Phosphor `List`
 * @example
 * <IconNavigationMenu size="md" />
 * <IconNavigationMenu size="lg" color="accent" />
 */
export const IconNavigationMenu = adaptIcon(ListIcon, 'menu')

IconNavigationMenu.displayName = 'IconNavigationMenu'
