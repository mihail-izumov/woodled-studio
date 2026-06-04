<script setup lang="ts">
/**
 * ReloadButton.vue — Кнопка перезагрузки страницы.
 *
 * Показывается только когда приложение запущено как iOS web app
 * (standalone PWA) — в обычном Safari есть нативный «обновить»,
 * а в standalone-режиме адресной строки нет.
 *
 * Стиль ровно как у SoundButton (muted state):
 *   • рамка T.border, паддинг 6×8, радиус 8
 *   • SVG 18×18, stroke-width 2, цвет T.textDim
 *
 * НЕ fixed — встраивается родителем в нужное место (главная,
 * левый-верх). При прокрутке уезжает вместе с контентом.
 */

import { ref, onMounted } from 'vue'
import { T } from '../theme/tokens'

const isStandalone = ref(false)

function detectStandalone() {
  if (typeof window === 'undefined') return false
  // iOS Safari
  const navStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone
  if (navStandalone === true) return true
  // Android / другие PWA
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true
  return false
}

function onReload() {
  window.location.reload()
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
      border: `1px solid ${T.border}`,
      borderRadius: '8px',
      padding: '6px 8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: T.textDim,
    }"
    aria-label="Обновить страницу"
    @click="onReload"
  >
    <!-- Иконка sync (Alice Design, Noun Project · noun-sync-1940246).
         U-образная стрелка, возвращающаяся в верхнюю точку. Filled-стиль,
         цвет наследуется через fill=currentColor. -->
    <svg width="18" height="18" viewBox="0 0 100 100"
      fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M35.4,97.5h29.1c15.2,0,27.5-12.3,27.5-27.5V46c0-2.2-1.8-4-4-4s-4,1.8-4,4v24c0,10.7-8.7,19.4-19.4,19.4H35.4 C24.7,89.4,16,80.7,16,70V49c0-10.7,8.7-19.4,19.4-19.4h36.1L59.4,41.7c-1.6,1.6-1.6,4.1,0,5.7c1.6,1.6,4.1,1.6,5.7,0l19-19 c1.6-1.6,1.6-4.1,0-5.7l-19-19c-0.8-0.8-1.8-1.2-2.9-1.2c-1,0-2.1,0.4-2.9,1.2c-1.6,1.6-1.6,4.1,0,5.7l12.1,12.1H35.4 C20.3,21.5,7.9,33.9,7.9,49v21C7.9,85.2,20.3,97.5,35.4,97.5z"/>
    </svg>
  </button>
</template>
