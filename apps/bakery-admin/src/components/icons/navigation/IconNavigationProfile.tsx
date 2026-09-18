import { User } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconNavigationProfile
 * navigation icon — Phosphor `User`
 * @example
 * <IconNavigationProfile size="md" />
 * <IconNavigationProfile size="lg" color="accent" />
 */
export const IconNavigationProfile = adaptIcon(User, 'profile')

IconNavigationProfile.displayName = 'IconNavigationProfile'
