import { useCallback, useEffect, useRef, useState } from 'react'
import type { DependencyList } from 'react'
import { THEME_KEY } from '../constants'

export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    loaderRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((caught: Error) => {
        if (!cancelled) setError(caught.message || 'Something went wrong')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((value) => value + 1), [])
  return { data, setData, loading, error, reload }
}

export function useCountdown(expiresAt: string | null | undefined): number {
  const compute = () => (expiresAt ? Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0)
  const [seconds, setSeconds] = useState(compute)
  useEffect(() => {
    setSeconds(compute())
    if (!expiresAt) return undefined
    const timer = window.setInterval(() => setSeconds(compute()), 1000)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt])
  return seconds
}

export function useDocumentMeta(title: string, description?: string, jsonLd?: object) {
  useEffect(() => {
    document.title = `${title} | MediBook`
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    if (description) meta.setAttribute('content', description)
    let script: HTMLScriptElement | null = null
    if (jsonLd) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }
    return () => {
      if (script) script.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, JSON.stringify(jsonLd)])
}

export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return undefined
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])
}

export function useVisibilityRefresh(callback: () => void) {
  const ref = useRef(callback)
  ref.current = callback
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') ref.current()
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])
}

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
  }, [dark])
  return { dark, toggle: () => setDark((value) => !value) }
}

export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}
