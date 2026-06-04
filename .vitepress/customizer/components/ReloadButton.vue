<script setup lang="ts">
/**
 * ReloadButton.vue — Кнопка перезагрузки страницы.
 *
 * Показывается только когда приложение запущено как iOS web app
 * (standalone PWA) — в обычном Safari есть нативный «обновить»,
 * а в standalone-режиме адресной строки нет.
 *
 * ВАЖНО — это HARD reload, не location.reload().
 *
 * location.reload() — soft: берёт ресурсы из кэша (browser cache +
 * Service Worker). На iOS Safari в standalone-режиме это очень
 * агрессивно — страница «обновляется» за 100мс, но фактически из
 * памяти. Пользователь не видит свежий контент после деплоя и не
 * видит обратной связи про медленный VPN, потому что reload идёт
 * мимо сети.
 *
 * Здесь делаем настоящее обновление в три шага:
 *   1. Чистим Service Worker регистрации и Cache Storage.
 *   2. Делаем location.replace(currentUrl + ?_t=now). Cache-bust в
 *      query заставляет браузер сходить за HTML на сервер.
 *   3. App.vue после монтирования стирает _t из URL через
 *      history.replaceState — пользователь не видит мусор в адресе.
 *
 * Очистка кешей в Promise.race с таймаутом 800мс — если на iOS
 * getRegistrations или caches API подвисает (бывает), не блокируем
 * навигацию навсегда. Лучше частично почистить и пойти дальше.
 *
 * Параллельно — мгновенный фидбэк через __wlBoot оверлей и
 * вращение иконки.
 */

import { ref, onMounted } from 'vue'
import { T } from '../theme/tokens'

const isStandalone = ref(false)
const isReloading = ref(false)

function detectStandalone() {
  if (typeof window === 'undefined') return false
  const navStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone
  if (navStandalone === true) return true
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true
  return false
}

type WlBoot = {
  show: (text: string, hints?: Array<{ at: number; text: string }>) => void
  setText: (text: string) => void
  clear: () => void
}

/** Снять все Service Worker регистрации (если есть). Никогда не throw. */
async function unregisterServiceWorkers(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) return
    const regs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(regs.map((r) => r.unregister().catch(() => null)))
  } catch { /* iOS иногда выбрасывает — игнорируем */ }
}

/** Очистить всё, что лежит в Cache Storage API. Никогда не throw. */
async function clearCacheStorage(): Promise<void> {
  try {
    if (!('caches' in window)) return
    const keys = await caches.keys()
    await Promise.all(keys.map((k) => caches.delete(k).catch(() => null)))
  } catch { /* noop */ }
}

/** Прелоад HTML с сервера. Возвращает Promise, который резолвится
 *  когда ответ пришёл (или упал) — НО ВАЖНО: текущая страница в этот
 *  момент ещё активна, её таймеры подсказок продолжают тикать.
 *  Это и решает проблему «спиннер залипает после Перезагружаем…»: пока
 *  fetch идёт, оверлей живёт; когда fetch резолвится — навигация почти
 *  моментальная (HTML уже в browser cache).
 *  cache: 'reload' — браузер обязан сходить на сервер, но сохранит
 *  ответ в кэше, чтобы следующее location.replace взяло из памяти. */
function prefetchHtml(url: string, signal: AbortSignal): Promise<void> {
  return fetch(url, { cache: 'reload', credentials: 'same-origin', signal })
    .then((res) => { void res.text() })
    .catch(() => { /* падение — fail-fast, переходим к navigation */ })
}

async function onReload() {
  if (isReloading.value) return
  isReloading.value = true

  // 1) МГНОВЕННЫЙ фидбэк — оверлей и спиннер появляются в тот же тик.
  const boot = (window as unknown as { __wlBoot?: WlBoot }).__wlBoot
  boot?.show('Перезагружаем…', [
    { at: 4000,  text: 'Долго не отвечает. С VPN такое бывает — подождите.' },
    { at: 10000, text: 'Не получается? Закройте и откройте приложение, проверьте интернет.' },
  ])

  // 2) Параллельная очистка кэшей. Race с таймаутом 800мс.
  const cleanup = Promise.all([unregisterServiceWorkers(), clearCacheStorage()])
  await Promise.race([cleanup, new Promise<void>((r) => setTimeout(r, 800))])

  // 3) Готовим target URL с cache-bust + _reload=1 (на случай, если
  //    fetch упадёт и навигация всё-таки начнётся — новая страница
  //    подхватит контекст «Перезагружаем…»).
  let target = window.location.href
  try {
    const url = new URL(window.location.href)
    url.searchParams.set('_t', Date.now().toString(36))
    url.searchParams.set('_reload', '1')
    target = url.toString()
  } catch { /* noop */ }

  // 4) Прелоад. Пока fetch идёт, таймеры подсказок ЖИВЫ. Hard timeout
  //    25с — если сервер вообще не отвечает, всё равно переходим к
  //    навигации, дальше уже новая страница покажет свой спиннер.
  const ctrl = new AbortController()
  const hardTimeout = setTimeout(() => ctrl.abort(), 25000)
  await prefetchHtml(target, ctrl.signal)
  clearTimeout(hardTimeout)

  // 5) Навигация. К этому моменту либо HTML уже в browser memory cache
  //    (резолв был успешным) и переход моментальный, либо мы исчерпали
  //    25с — тогда новая страница покажет свой «Перезагружаем…» с уже
  //    нулевыми таймерами (см. config.mts inline-script + _reload=1).
  try {
    window.location.replace(target)
  } catch {
    try { window.location.reload() } catch { /* noop */ }
  }
}

onMounted(() => {
  isStandalone.value = detectStandalone()
})
</script>

<template>
  <button
    v-if="isStandalone"
    :style="{
      background: 'none',
      border: 'none',
      padding: '6px 8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: T.textDim,
      opacity: isReloading ? 0.6 : 1,
      transition: 'opacity .2s ease',
    }"
    :disabled="isReloading"
    aria-label="Обновить страницу"
    @click="onReload"
  >
    <!-- Иконка sync (Alice Design, Noun Project · noun-sync-1940246).
         При isReloading крутится — даём визуальный feedback даже если
         оверлей __wlBoot не успел появиться. -->
    <svg width="18" height="18" viewBox="0 0 100 100"
      fill="currentColor" xmlns="http://www.w3.org/2000/svg"
      :class="{ 'rb-spin': isReloading }">
      <path d="M35.4,97.5h29.1c15.2,0,27.5-12.3,27.5-27.5V46c0-2.2-1.8-4-4-4s-4,1.8-4,4v24c0,10.7-8.7,19.4-19.4,19.4H35.4 C24.7,89.4,16,80.7,16,70V49c0-10.7,8.7-19.4,19.4-19.4h36.1L59.4,41.7c-1.6,1.6-1.6,4.1,0,5.7c1.6,1.6,4.1,1.6,5.7,0l19-19 c1.6-1.6,1.6-4.1,0-5.7l-19-19c-0.8-0.8-1.8-1.2-2.9-1.2c-1,0-2.1,0.4-2.9,1.2c-1.6,1.6-1.6,4.1,0,5.7l12.1,12.1H35.4 C20.3,21.5,7.9,33.9,7.9,49v21C7.9,85.2,20.3,97.5,35.4,97.5z"/>
    </svg>
  </button>
</template>

<style scoped>
.rb-spin {
  animation: rbSpin 0.9s linear infinite;
  transform-origin: 50% 50%;
}
@keyframes rbSpin {
  to { transform: rotate(360deg); }
}
</style>
