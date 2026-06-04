<script setup lang="ts">
/**
 * ReloadButton.vue — Кнопка перезагрузки страницы.
 *
 * Показывается только когда приложение запущено как iOS web app
 * (standalone PWA) — в обычном Safari есть нативный «обновить»,
 * а в standalone-режиме адресной строки нет.
 *
 * Поведение по тапу — критически важно для iOS PWA:
 *   1. МГНОВЕННЫЙ фидбэк. Запускаем оверлей __wlBoot.show() с текстом
 *      «Перезагружаем…» в тот же тик, в котором поймали клик. Юзер
 *      видит, что нажатие сработало, и не тыкает кнопку второй раз.
 *   2. Сразу зовём location.reload(). Если страница успеет — отлично.
 *   3. Через 1.5с — если ещё здесь — fallback на location.assign(href).
 *      На iOS PWA с VPN reload иногда «глохнет», assign идёт мимо.
 *   4. Оверлей показывает подсказки про VPN на 5с и 12с — пользователь
 *      понимает, почему долго, и не считает что приложение зависло.
 *   5. Иконка кнопки крутится с момента тапа — ещё один слой обратной
 *      связи, на случай если оверлей не успел построиться.
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

function onReload() {
  if (isReloading.value) return
  isReloading.value = true

  // 1) МГНОВЕННЫЙ оверлей — пользователь видит реакцию в тот же кадр.
  const boot = (window as unknown as { __wlBoot?: WlBoot }).__wlBoot
  boot?.show('Перезагружаем…', [
    { at: 5000,  text: 'Долго не отвечает. С VPN такое бывает — подождите.' },
    { at: 12000, text: 'Не получается? Закройте и откройте приложение, проверьте интернет.' },
  ])

  // 2) Запускаем перезагрузку сразу.
  try { window.location.reload() } catch { /* noop */ }

  // 3) Fallback через 1.5с — если страница ещё не ушла, пробуем assign.
  //    На iOS PWA reload() иногда «глохнет» (особенно при медленном VPN),
  //    а assign гарантированно стартует навигацию.
  setTimeout(() => {
    try { window.location.assign(window.location.href) } catch { /* noop */ }
  }, 1500)
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
