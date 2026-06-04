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
    <!-- Lucide refresh-cw: круговая стрелка с двумя «возвратами». stroke 2,
         тот же визуальный вес что у volume-x в SoundButton. -->
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
      <path d="M16 16h5v5"/>
    </svg>
  </button>
</template>
