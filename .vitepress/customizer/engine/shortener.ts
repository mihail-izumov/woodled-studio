/**
 * shortener.ts — Клиент шортнера ссылок через Google Apps Script Web App.
 *
 * Архитектура (GET-only):
 *   GET /exec?save=<payload>&type=<s|fx>  → {id, type}
 *   GET /exec?id=<id>                     → {id, type, payload}
 *
 * Почему GET, а не POST: Apps Script на POST даёт 302-редирект, и наличие
 * CORS-заголовков на конечном googleusercontent.com URL непредсказуемо
 * (зависит от Content-Type, версии деплоя, инстанса). GET идёт напрямую
 * с CORS-заголовками всегда, надёжно.
 *
 * Все функции с таймаутом и не бросают исключений — возвращают null при
 * любой ошибке. Это позволяет вызывающему коду делать fallback на длинную
 * ссылку через простой `result ?? longUrl` без try/catch обвязки.
 */

const WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbxjtBMSKSPADp9YVE4GKhPIPW5XaP4rShzMnDCTgDMH6O6CX7_eOlSPLMPcuq_yVbj8/exec'

const TIMEOUT_MS = 25000 // Apps Script cold start + возможный VPN: даём 25 сек

export type ShareType = 's' | 'fx'

export interface ShortenResult {
  id: string
  type: ShareType
}

export interface ExpandResult {
  id: string
  type: ShareType
  payload: string
}

async function fetchWithTimeout(url: string, ms = TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

/**
 * Сохранить payload, получить короткий ID.
 * null при любой ошибке — вызывающий код должен сделать fallback.
 */
export async function shortenPayload(
  payload: string,
  type: ShareType,
): Promise<ShortenResult | null> {
  if (!payload) return null
  try {
    const url =
      WEBAPP_URL +
      '?save=' +
      encodeURIComponent(payload) +
      '&type=' +
      encodeURIComponent(type)
    const r = await fetchWithTimeout(url)
    if (!r.ok) return null
    const data = await r.json()
    if (!data || data.error || !data.id) return null
    return {
      id: String(data.id),
      type: data.type === 'fx' ? 'fx' : 's',
    }
  } catch {
    return null
  }
}

/**
 * Получить payload по короткому ID.
 * Используется приёмной страницей /share/?id=xxxxxx.
 */
export async function expandShortId(id: string): Promise<ExpandResult | null> {
  if (!id || !/^[A-Za-z0-9]{1,12}$/.test(id)) return null
  try {
    const url = WEBAPP_URL + '?id=' + encodeURIComponent(id)
    const r = await fetchWithTimeout(url)
    if (!r.ok) return null
    const data = await r.json()
    if (!data || data.error || !data.payload) return null
    return {
      id: String(data.id || id),
      type: data.type === 'fx' ? 'fx' : 's',
      payload: String(data.payload),
    }
  } catch {
    return null
  }
}

/** URL короткой ссылки: <origin><base>share/?id=xxxxxx
 *
 *  Base определяется из текущего URL: берём pathname и отрезаем последний
 *  сегмент (имя текущей страницы — обычно "customizer"). Это надёжнее
 *  чем import.meta.env.BASE_URL, который VitePress не всегда пробрасывает
 *  в файлы вне components/ (наблюдалось: возвращал '/' вместо '/').
 *
 *  Примеры:
 *    /customizer  → /
 *    /customizer/ → /
 *    /lighting/customizer → /lighting/
 */
export function buildShortUrl(id: string): string {
  if (typeof window === 'undefined') return ''
  const base = window.location.pathname.replace(/\/[^/]*\/?$/, '/')
  return `${window.location.origin}${base}share/?id=${encodeURIComponent(id)}`
}

/**
 * Пытается превратить длинную ссылку конфигуратора в короткую через шортнер.
 *
 * Парсит hash длинной ссылки (#s=2.... или #fx=2....), отправляет payload
 * на сервер, при успехе возвращает короткий URL (~50 символов).
 * При любой ошибке/таймауте возвращает исходную длинную ссылку — вызывающий
 * код может смело копировать результат без проверок состояния сервера.
 */
export async function shortenLongUrl(longUrl: string): Promise<string> {
  const hashIdx = longUrl.indexOf('#')
  if (hashIdx < 0) return longUrl
  const hash = longUrl.slice(hashIdx + 1)

  let type: ShareType
  let payload: string
  if (hash.startsWith('s=2.')) {
    type = 's'
    payload = hash.slice('s=2.'.length)
  } else if (hash.startsWith('fx=2.')) {
    type = 'fx'
    payload = hash.slice('fx=2.'.length)
  } else {
    // Старый формат без префикса 2. (legacy base64) — шортнить не пытаемся,
    // отдадим длинную ссылку как есть. Старые ссылки и так редкость.
    return longUrl
  }

  const r = await shortenPayload(payload, type)
  if (!r) return longUrl
  return buildShortUrl(r.id)
}

/**
 * warmupShortener — лёгкий ping к Apps Script для прогрева инстанса.
 *
 * Apps Script бесплатного тира «остывает» через 5-10 минут простоя — первый
 * запрос после этого занимает 10-25 секунд (cold start). Если вызвать
 * warmupShortener() при mount конфигуратора, к моменту когда юзер откроет
 * ShareModal сервер уже прогрет и шортнер ответит за 1-2 секунды.
 *
 * Вызов идемпотентный (срабатывает только один раз за сессию) и работает
 * fire-and-forget — ошибки игнорируются, response не используется.
 *
 * Подключить например в App.vue:
 *   import { warmupShortener } from './engine/shortener'
 *   onMounted(() => warmupShortener())
 */
let warmupDone = false
export function warmupShortener(): void {
  if (warmupDone) return
  warmupDone = true
  /* Ping endpoint: GET без параметров → {ok: true, service: '...'}.
     Используем короткий таймаут — нам не нужен ответ, нужно только разбудить
     инстанс. Если не получится — не страшно, шортнер сам потом разбудит. */
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 10000)
  fetch(WEBAPP_URL, { signal: ctrl.signal })
    .catch(() => { /* fire-and-forget */ })
    .finally(() => clearTimeout(t))
}
