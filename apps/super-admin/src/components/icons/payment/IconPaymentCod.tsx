import { Money } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconPaymentCod
 * payment icon — Phosphor `Money`
 * @example
 * <IconPaymentCod size="md" />
 * <IconPaymentCod size="lg" color="accent" />
 */
export const IconPaymentCod = adaptIcon(Money, 'cash on delivery')

IconPaymentCod.displayName = 'IconPaymentCod'
