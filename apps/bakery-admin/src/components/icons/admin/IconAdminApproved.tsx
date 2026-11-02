import { CheckCircleIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconAdminApproved
 * admin icon — Phosphor `CheckCircle`
 * @example
 * <IconAdminApproved size="md" />
 * <IconAdminApproved size="lg" color="accent" />
 */
export const IconAdminApproved = adaptIcon(CheckCircleIcon, 'approved')

IconAdminApproved.displayName = 'IconAdminApproved'
