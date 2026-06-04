/**
 * WOODLED Studio — Service Worker.
 *
 * Что делает:
 *  • push — принимает Web Push, показывает уведомление
 *  • notificationclick — фокусирует/открывает PWA на нужном URL
 *  • install/activate — без офлайн-кэша (его легко добавить позже),
 *    просто берёт контроль над страницами сразу (`clients.claim`).
 *
 * Этого минимума достаточно, чтобы:
 *  1. Safari на iOS 16.4+ согласился показать промпт `Notification.requestPermission()`
 *  2. iOS-устройство приняло push после `pushManager.subscribe(...)`
 *
 * Бэк-инфраструктура (VAPID-ключи + рассылка) — отдельная задача,
 * пока что фронт умеет только подписаться и сохранить subscription.
 */

const BASE = '/woodled-studio/'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    if (event.data) data = event.data.json()
  } catch (e) {
    try { data = { title: 'WOODLED', body: event.data && event.data.text() } } catch (_) {}
  }

  const title = data.title || 'WOODLED Студия'
  const options = {
    body: data.body || '',
    icon: data.icon || BASE + 'apple-touch-icon.png',
    badge: data.badge || BASE + 'apple-touch-icon.png',
    data: { url: data.url || BASE },
    tag: data.tag || 'woodled',
    renotify: !!data.renotify,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || BASE

  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    // Если PWA уже открыто — переключаемся туда и навигируем
    for (const client of all) {
      if ('focus' in client) {
        try { await client.navigate(targetUrl) } catch (_) {}
        return client.focus()
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
  })())
})
