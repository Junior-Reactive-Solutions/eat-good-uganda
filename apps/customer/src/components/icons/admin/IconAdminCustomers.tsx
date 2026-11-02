import { UsersIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconAdminCustomers
 * admin icon — Phosphor `Users`
 * @example
 * <IconAdminCustomers size="md" />
 * <IconAdminCustomers size="lg" color="accent" />
 */
export const IconAdminCustomers = adaptIcon(UsersIcon, 'customers')

IconAdminCustomers.displayName = 'IconAdminCustomers'
