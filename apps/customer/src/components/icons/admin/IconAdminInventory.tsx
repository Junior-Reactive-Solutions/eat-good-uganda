import { PackageIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconAdminInventory
 * admin icon — Phosphor `Package`
 * @example
 * <IconAdminInventory size="md" />
 * <IconAdminInventory size="lg" color="accent" />
 */
export const IconAdminInventory = adaptIcon(PackageIcon, 'inventory')

IconAdminInventory.displayName = 'IconAdminInventory'
