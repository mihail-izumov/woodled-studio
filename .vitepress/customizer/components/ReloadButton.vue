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
 *   • при скролле — заливка T.neutral, иконка T.bg
 */

import { computed, ref, onMounted, onUnmounted } from 'vue'
import { T } from '../theme/tokens'

const isScrolled = ref(false)
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

function onScroll() {
  isScrolled.value = window.scrollY > 0
}

function onReload() {
  window.location.reload()
}

const btnStyle = computed(() => {
  if (isScrolled.value) {
    return {
      background: T.neutral,
      border: '1px solid transparent',
      borderRadius: '8px',
      padding: '6px 8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: T.bg,
      transition: 'all .3s',
    }
  }
  return {
    background: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: '8px',
    padding: '6px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: T.textDim,
    transition: 'all .3s',
  }
})

onMounted(() => {
  isStandalone.value = detectStandalone()
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <button
    v-if="isStandalone"
    :style="btnStyle"
    aria-label="Обновить страницу"
    @click="onReload"
  >
    <!-- refresh-cw, тот же visual weight что и volume-x -->
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/>
      <path d="M3 21v-5h5"/>
    </svg>
  </button>
</template>
