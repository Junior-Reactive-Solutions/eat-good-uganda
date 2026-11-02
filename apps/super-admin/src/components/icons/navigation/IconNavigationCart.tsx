import { BasketIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconNavigationCart
 * navigation icon — Phosphor `Basket`
 * @example
 * <IconNavigationCart size="md" />
 * <IconNavigationCart size="lg" color="accent" />
 */
export const IconNavigationCart = adaptIcon(BasketIcon, 'basket')

IconNavigationCart.displayName = 'IconNavigationCart'
