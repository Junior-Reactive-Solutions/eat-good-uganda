import { MapPin } from '@phosphor-icons/react'

import { adaptIcon } from '../adapt'

/**
 * IconDeliveryLocation
 * delivery icon — Phosphor `MapPin`
 * @example
 * <IconDeliveryLocation size="md" />
 * <IconDeliveryLocation size="lg" color="accent" />
 */
export const IconDeliveryLocation = adaptIcon(MapPin, 'location')

IconDeliveryLocation.displayName = 'IconDeliveryLocation'
