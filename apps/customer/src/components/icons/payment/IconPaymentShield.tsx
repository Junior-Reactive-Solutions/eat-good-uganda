import { ShieldCheckIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconPaymentShield
 * payment icon — Phosphor `ShieldCheck`
 * @example
 * <IconPaymentShield size="md" />
 * <IconPaymentShield size="lg" color="accent" />
 */
export const IconPaymentShield = adaptIcon(ShieldCheckIcon, 'secure payment')

IconPaymentShield.displayName = 'IconPaymentShield'
