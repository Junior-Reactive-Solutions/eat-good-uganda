import { MagnifyingGlassIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconNavigationSearch
 * navigation icon — Phosphor `MagnifyingGlass`
 * @example
 * <IconNavigationSearch size="md" />
 * <IconNavigationSearch size="lg" color="accent" />
 */
export const IconNavigationSearch = adaptIcon(MagnifyingGlassIcon, 'search')

IconNavigationSearch.displayName = 'IconNavigationSearch'
