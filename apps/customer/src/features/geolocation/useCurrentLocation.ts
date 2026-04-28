import { useState, useCallback } from 'react'

type LocationState =
  | { status: 'idle' }
  | { status: 'prompting' }
  | { status: 'granted'; lat: number; lng: number; accuracy: number }
  | { status: 'denied' }
  | { status: 'error'; message: string }

export function useCurrentLocation(): LocationState & { request: () => void } {
  const [state, setState] = useState<LocationState>({ status: 'idle' })

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', message: 'Geolocation not supported.' })
      return
    }
    setState({ status: 'prompting' })
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: 'granted',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) =>
        setState(
          err.code === err.PERMISSION_DENIED
            ? { status: 'denied' }
            : { status: 'error', message: err.message },
        ),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    )
  }, [])

  return { ...state, request }
}
