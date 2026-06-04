/**
 * pwa-push.ts — клиентский слой Web Push для WOODLED.
 *
 * Что умеет:
 *  • getPushState() — текущее состояние (поддержка, разрешение, подписка)
 *  • enablePush(vapidPublicKey?) — запросить разрешение и подписаться
 *  • disablePush() — отписаться (отозвать subscription)
 *
 * iOS 16.4+:
 *  • Notification.requestPermission() работает ТОЛЬКО в standalone-режиме
 *    (когда сайт открыт с домашнего экрана). В обычной вкладке Safari
 *    запрос игнорируется молча.
 *  • Поэтому функция `enablePush` сначала проверяет, что мы в standalone,
 *    и возвращает `'needs-install'` если нет.
 *
 * VAPID-ключ:
 *  • Без него `pushManager.subscribe()` падает с TypeError.
 *  • Если ключ не передан и не задан в env — функция возвращает
 *    `'no-vapid-key'`: фронт остаётся работоспособным, но реальная
 *    рассылка push'ей будет невозможна.
 *  • Чтобы получить ключ: `npx web-push generate-vapid-keys`.
 *
 * Subscription:
 *  • После успешной подписки JSON `subscription` сохраняется в localStorage
 *    (`wl_push_subscription`) и возвращается caller'у — его нужно отправить
 *    на ваш бэк, чтобы потом слать пуши.
 *  • Без бэка можно использовать для отладки: скопировать subscription и
 *    вручную пушнуть через утилиту `web-push` (https://github.com/web-push-libs/web-push-cli).
 */

const SUBSCRIPTION_KEY = 'wl_push_subscription'

// Пустая строка = ключ не задан. Заполните после генерации VAPID-пары.
const DEFAULT_VAPID_PUBLIC_KEY = ''

export type PushPermission = 'default' | 'granted' | 'denied'

export type PushState =
  | { kind: 'unsupported' }              // нет SW / нет Notification API
  | { kind: 'needs-install' }            // iOS вне standalone — добавьте на дом. экран
  | { kind: 'permission-denied' }
  | { kind: 'no-vapid-key' }
  | { kind: 'subscribed', endpoint: string }
  | { kind: 'permission-default' }       // готов спросить разрешение

/**
 * Расширенный детект «приложение / не браузер». Повторяет логику
 * PWAInstallBanner.vue. Покрывает: iOS standalone, все display-mode
 * варианты (standalone/minimal-ui/fullscreen/wco), Android TWA через
 * referrer. В пушах не учитываем в-app браузеры отдельно — там
 * Notification API всё равно недоступен в большинстве случаев.
 */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  if (nav.standalone) return true
  if (window.matchMedia) {
    const modes = ['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay']
    if (modes.some((m) => window.matchMedia('(display-mode: ' + m + ')').matches)) return true
  }
  if (typeof document !== 'undefined' && /^android-app:\/\//.test(document.referrer)) return true
  return false
}

function isIos(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIpadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /iPad|iPhone|iPod/.test(ua) || isIpadOS
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const out = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i)
  return out
}

export async function getPushState(vapidPublicKey?: string): Promise<PushState> {
  if (typeof window === 'undefined') return { kind: 'unsupported' }
  if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) {
    return { kind: 'unsupported' }
  }
  if (isIos() && !isStandalone()) return { kind: 'needs-install' }

  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return { kind: 'subscribed', endpoint: existing.endpoint }

  const perm = Notification.permission as PushPermission
  if (perm === 'denied') return { kind: 'permission-denied' }

  const key = vapidPublicKey || DEFAULT_VAPID_PUBLIC_KEY
  if (!key) return { kind: 'no-vapid-key' }

  return { kind: 'permission-default' }
}

export async function enablePush(vapidPublicKey?: string): Promise<PushState> {
  const initial = await getPushState(vapidPublicKey)
  // Если уже подписаны / неподдерживаемая среда — возвращаем как есть
  if (initial.kind !== 'permission-default') return initial

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') {
    return perm === 'denied' ? { kind: 'permission-denied' } : { kind: 'permission-default' }
  }

  const key = vapidPublicKey || DEFAULT_VAPID_PUBLIC_KEY
  if (!key) return { kind: 'no-vapid-key' }

  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  })

  try {
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(sub.toJSON()))
  } catch {}

  // TODO: отправить sub на ваш бэк — fetch('/api/push/subscribe', { ... })
  return { kind: 'subscribed', endpoint: sub.endpoint }
}

export async function disablePush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) await sub.unsubscribe()
  try { localStorage.removeItem(SUBSCRIPTION_KEY) } catch {}
}
