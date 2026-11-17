import axios from 'axios'

export const api = axios.create({ baseURL: '/' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const fileUrl = (url?: string | null) =>
  url ? (url.startsWith('http') ? url : url) : undefined

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { detail?: string } | undefined
    if (typeof d?.detail === 'string') return d.detail
    if (typeof d === 'string') return d
    return err.message
  }
  return err instanceof Error ? err.message : 'Something went wrong.'
}
