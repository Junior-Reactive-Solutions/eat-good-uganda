import { ClipboardTextIcon } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconAdminAuditLog
 * admin icon — Phosphor `ClipboardText`
 * @example
 * <IconAdminAuditLog size="md" />
 * <IconAdminAuditLog size="lg" color="accent" />
 */
export const IconAdminAuditLog = adaptIcon(ClipboardTextIcon, 'audit log')

IconAdminAuditLog.displayName = 'IconAdminAuditLog'
