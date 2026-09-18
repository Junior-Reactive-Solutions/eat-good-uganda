import { Gear } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconNavigationSettings
 * navigation icon — Phosphor `Gear`
 * @example
 * <IconNavigationSettings size="md" />
 * <IconNavigationSettings size="lg" color="accent" />
 */
export const IconNavigationSettings = adaptIcon(Gear, 'settings')

IconNavigationSettings.displayName = 'IconNavigationSettings'
