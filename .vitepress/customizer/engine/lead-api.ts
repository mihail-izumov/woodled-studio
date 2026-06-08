/**
 * lead-api.ts — Клиент GAS-эндпоинта приёма лидов.
 *
 * Архитектура:
 *   Frontend → GET ?data=<json> на GAS Web App → GAS пишет в Sheet
 *   и шлёт уведомление менеджеру в Telegram-группу. Бот делает второй шаг —
 *   на /start <leadId> присылает юзеру первое сообщение со ссылкой.
 *
 * Почему GET, а не POST:
 *   GAS Web App при POST даёт 302-редирект, при котором браузер теряет тело.
 *   Тот же паттерн используется в shortener.ts. См. TELEGRAM-BOT-SETUP.md.
 *
 * Почему URL в base64:
 *   GAS Web App URL — не секрет (токен бота живёт внутри скрипта), но прятать
 *   его от автоматических сканеров и любопытных глаз полезно. Это обфускация,
 *   не шифрование. Подменить токен через знание URL нельзя — для этого нужен
 *   доступ к Apps Script проекту.
 *
 * `mode: 'no-cors'`:
 *   GAS не всегда возвращает Access-Control-Allow-Origin. С no-cors запрос
 *   уходит и обрабатывается, ответ непрозрачный — нам не нужен. Это fire-and-
 *   forget: подтверждение получает сам юзер через бота.
 */

/**
 * Web App exec URL в base64. Декодируется через atob() в браузере.
 *
 * Как закодировать после деплоя GAS:
 *   echo -n 'https://script.google.com/macros/s/.../exec' | base64
 *
 * Вставить результат (одной строкой) в значение константы ниже.
 *
 * Пока не задеплоен — пустая строка, submitLead тихо вернёт false.
 */
const WEBAPP_URL_B64 = 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J5NGtLRFpQY2NvUWZQTU03LWZYYnhQejBYelZvLUJIbnh6TmFQcm9YSHZvUkk5WkVQN1dVcjUySnA0R2lOamQtWmEvZXhlYw=='

function getWebAppUrl(): string {
  if (!WEBAPP_URL_B64) return ''
  if (typeof atob === 'undefined') return ''
  try {
    return atob(WEBAPP_URL_B64)
  } catch {
    return ''
  }
}

/* ──────────── Типы payload ──────────── */

export type LeadSource = 'fixture' | 'forest' | 'consult'

export interface LeadPayload {
  /** Короткий уникальный ID лида (генерируется на фронте). */
  leadId: string
  /** Откуда пришёл клиент — определяет заголовок сообщения менеджеру. */
  source: LeadSource
  /** Имя клиента (обязательное поле формы). */
  name: string
  /** Телефон (обязательное поле формы). */
  phone: string
  /** Telegram username (опционально, без @). */
  tgUsername?: string
  /** Полный текст комплектации для менеджера (от engine/lead-text.ts). */
  summary: string
  /** Share-URL (короткий, через shortener — заранее сгенерированный). */
  shareUrl: string
  /** Сводные метрики для Sheet. */
  roomCount: number
  fixtureCount: number
}

/* ──────────── Генерация leadId ──────────── */

/**
 * Короткий ID лида: 8 символов hex, безопасных для `?start=<id>` payload TG
 * (макс 64 символа). Используем crypto.randomUUID если доступен, иначе
 * fallback на Date+Math.random.
 */
export function newLeadId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  }
  return (
    Date.now().toString(36).slice(-4) +
    Math.random().toString(36).slice(2, 6)
  ).toUpperCase()
}

/* ──────────── Отправка лида ──────────── */

/**
 * Шлёт лид на GAS через GET + no-cors. Fire-and-forget — ответ непрозрачный,
 * мы не ждём json. Возвращает true если запрос ушёл, false если URL не
 * сконфигурирован (или ошибка сети до отправки).
 *
 * После успешной отправки фронт показывает confirmation и предлагает открыть
 * чат с ботом: `t.me/woodled_studio_bot?start=<leadId>`.
 */
export async function submitLead(payload: LeadPayload): Promise<boolean> {
  const url = getWebAppUrl()
  if (!url) {
    // В dev / до деплоя — лог в консоль, чтобы видеть что улетело бы.
    if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('[lead-api] WEBAPP_URL_B64 пуст — отправка пропущена', payload)
    }
    return false
  }
  try {
    const data = encodeURIComponent(JSON.stringify(payload))
    // no-cors — браузер не блокирует, ответ opaque.
    await fetch(url + '?data=' + data, { mode: 'no-cors' })
    return true
  } catch {
    return false
  }
}

/* ──────────── Deep-link на бота ──────────── */

const BOT_USERNAME = 'woodled_studio_bot'

/** Ссылка на запуск бота с привязкой к лиду — бот ответит юзеру первым сообщением. */
export function botStartUrl(leadId: string): string {
  const safe = encodeURIComponent(leadId)
  return `https://t.me/${BOT_USERNAME}?start=${safe}`
}

/* ──────────── Persist контакта в localStorage ──────────── */

const CONTACT_KEY = 'woodled.leadContact'

export interface PersistedContact {
  name: string
  phone: string
  tgUsername: string
}

/** Подтянуть последний контакт, чтобы повторные заявки не требовали ввода. */
export function loadPersistedContact(): PersistedContact {
  const empty: PersistedContact = { name: '', phone: '', tgUsername: '' }
  if (typeof window === 'undefined') return empty
  try {
    const raw = localStorage.getItem(CONTACT_KEY)
    if (!raw) return empty
    const data = JSON.parse(raw)
    return {
      name: String(data.name ?? ''),
      phone: String(data.phone ?? ''),
      tgUsername: String(data.tgUsername ?? ''),
    }
  } catch {
    return empty
  }
}

/** Запомнить контакт после успешной отправки. */
export function savePersistedContact(c: PersistedContact): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CONTACT_KEY, JSON.stringify(c))
  } catch {
    /* quota — игнорируем */
  }
}
