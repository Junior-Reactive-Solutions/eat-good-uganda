import { ProhibitIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconAdminSuspended
 * admin icon — Phosphor `Prohibit`
 * @example
 * <IconAdminSuspended size="md" />
 * <IconAdminSuspended size="lg" color="accent" />
 */
export const IconAdminSuspended = adaptIcon(ProhibitIcon, 'suspended')

IconAdminSuspended.displayName = 'IconAdminSuspended'
