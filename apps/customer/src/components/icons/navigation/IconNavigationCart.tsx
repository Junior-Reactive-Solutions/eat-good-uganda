import { Basket } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconNavigationCart
 * navigation icon — Phosphor `Basket`
 * @example
 * <IconNavigationCart size="md" />
 * <IconNavigationCart size="lg" color="accent" />
 */
export const IconNavigationCart = adaptIcon(Basket, 'basket')

IconNavigationCart.displayName = 'IconNavigationCart'
