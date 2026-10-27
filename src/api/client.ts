import axios from 'axios'
import toast from 'react-hot-toast'
import { AUTH_KEY } from '../constants'
import type { ApiErrorShape } from '../types'

/** Error thrown by the mock branch so components handle mock and real failures identically. */
export class ApiError extends Error {
  code: string
  status: number
  details?: ApiErrorShape['details']

  constructor(code: string, message: string, status = 400, details?: ApiErrorShape['details']) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem(AUTH_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { token?: string }
      if (parsed.token) config.headers.Authorization = `Bearer ${parsed.token}`
    } catch {
      // ignore malformed token
    }
  }
  return config
})

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you were looking for.',
  409: 'That slot was just taken. Slots have been refreshed - please pick another.',
  500: 'Something went wrong on our side. Please retry.',
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number = error.response?.status ?? 0
    const body = error.response?.data?.error as ApiErrorShape | undefined
    const message = body?.message || STATUS_MESSAGES[status] || 'Network error. Check your connection and retry.'
    toast.error(message, { id: `api-${status}-${message}` })
    if (status === 401) localStorage.removeItem(AUTH_KEY)
    return Promise.reject(new ApiError(body?.code ?? 'NETWORK_ERROR', message, status, body?.details))
  },
)

export async function remote<T>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  body?: unknown,
  params?: Record<string, unknown>,
): Promise<T> {
  const response = await apiClient.request({ method, url: `/api/v1${url}`, data: body, params })
  return response.data.data as T
}

export async function remoteList<T>(url: string, params?: Record<string, unknown>) {
  const response = await apiClient.get(`/api/v1${url}`, { params })
  return { data: response.data.data as T, meta: response.data.meta as { page: number; pageSize: number; total: number; facets?: unknown } }
}
