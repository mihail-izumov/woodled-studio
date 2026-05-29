// Обёртка над localStorage с защитой от SSR (VitePress рендерит часть страниц на сервере)
// и от приватного режима, где доступ к storage может бросать.
//
// Все методы синхронные. При недоступности localStorage возвращают null/no-op.

const PREFIX = 'gallery:'

const isAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

export const storageGet = (key: string): string | null => {
  if (!isAvailable()) return null
  try { return window.localStorage.getItem(PREFIX + key) }
  catch { return null }
}

export const storageSet = (key: string, value: string): void => {
  if (!isAvailable()) return
  try { window.localStorage.setItem(PREFIX + key, value) }
  catch { /* quota / private mode */ }
}

export const storageDel = (key: string): void => {
  if (!isAvailable()) return
  try { window.localStorage.removeItem(PREFIX + key) }
  catch { /* ignore */ }
}

// Имена ключей. Префикс gallery: добавляется автоматически, тут указываем суффикс.
export const SK = {
  baseUrl:   'base_url',
  entries:   'entries',
  filenames: 'filenames',
} as const
