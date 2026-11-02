import { MoneyIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconAdminRevenue
 * admin icon — Phosphor `Money`
 * @example
 * <IconAdminRevenue size="md" />
 * <IconAdminRevenue size="lg" color="accent" />
 */
export const IconAdminRevenue = adaptIcon(MoneyIcon, 'revenue')

IconAdminRevenue.displayName = 'IconAdminRevenue'
