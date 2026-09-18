import { CreditCard } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconPaymentGeneric
 * payment icon — Phosphor `CreditCard`
 * @example
 * <IconPaymentGeneric size="md" />
 * <IconPaymentGeneric size="lg" color="accent" />
 */
export const IconPaymentGeneric = adaptIcon(CreditCard, 'payment method')

IconPaymentGeneric.displayName = 'IconPaymentGeneric'
