import axios from 'axios'

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000',
  withCredentials: true,
})

let _onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn
}

api.interceptors.request.use((config) => {
  const csrf = document.cookie
    .split('; ')
    .find((row) => row.startsWith('eg_csrf='))
    ?.split('=')[1]
  if (csrf && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers['x-csrf-token'] = csrf
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      _onUnauthorized?.()
    }
    return Promise.reject(error instanceof Error ? error : new Error(String(error)))
  },
)
