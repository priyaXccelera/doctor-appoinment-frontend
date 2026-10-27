// Tiny localStorage-backed collection helpers used by the mock branch of every store module.

export function loadList<T>(key: string, seed: () => T[]): T[] {
  const raw = localStorage.getItem(key)
  if (raw) {
    try {
      return JSON.parse(raw) as T[]
    } catch {
      // fall through to re-seed corrupted data
    }
  }
  const initial = seed()
  localStorage.setItem(key, JSON.stringify(initial))
  return initial
}

export function saveList<T>(key: string, list: T[]): void {
  localStorage.setItem(key, JSON.stringify(list))
}

export function loadObject<T>(key: string, seed: () => T): T {
  const raw = localStorage.getItem(key)
  if (raw) {
    try {
      return JSON.parse(raw) as T
    } catch {
      // fall through to re-seed corrupted data
    }
  }
  const initial = seed()
  localStorage.setItem(key, JSON.stringify(initial))
  return initial
}

export function saveObject<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false'
