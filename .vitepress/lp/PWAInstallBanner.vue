<script setup lang="ts">
/**
 * PWAInstallBanner — sticky-баннер для iOS Safari, по образцу avito.ru/apps.
 *
 * Показывается только когда:
 *   • устройство iOS (iPhone / iPad / iPod)
 *   • это Safari (не Chrome/Firefox iOS — у них свой UI, в них Add to Home недоступен)
 *   • НЕ запущено в standalone (т.е. уже не PWA на спрингборде)
 *   • пользователь его не закрывал (localStorage)
 *
 * Закрытие сохраняется на 14 дней — потом баннер появится снова. Тап по
 * «Подробнее» / по карточке — ведёт на /app со скрин-инструкцией.
 *
 * Спецификация анимации: после mount ждём 300мс и плавно «приезжаем»
 * сверху (translateY от -100% к 0). Так избегаем «вспышки» баннера на
 * первой отрисовке и даём странице успеть отрисовать первый кадр.
 */
import { ref, onMounted } from 'vue'
import { PAGE } from './tokens'

const ICON_URL = '/woodled-studio/apple-touch-icon.png'
const APP_URL = '/woodled-studio/app'
const STORAGE_KEY = 'wl_pwa_banner_dismissed_at'
const SUPPRESS_DAYS = 14

const visible = ref(false)
const mounted = ref(false)

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // iOS Safari вешает navigator.standalone, modern PWA-движки — display-mode matchMedia
  const nav = window.navigator as Navigator & { standalone?: boolean }
  if (nav.standalone) return true
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true
  return false
}

function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  // iPad на iPadOS 13+ маскируется под Mac → проверяем maxTouchPoints
  const isIpadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  const isIos = /iPad|iPhone|iPod/.test(ua) || isIpadOS
  if (!isIos) return false
  // Safari: НЕ Chrome (CriOS), НЕ Firefox (FxiOS), НЕ Edge (EdgiOS), НЕ Opera (OPiOS), НЕ Yandex (YaBrowser)
  const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|DuckDuckGo/.test(ua)
  return !isOtherBrowser
}

function wasRecentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const ts = Number(raw)
    if (!Number.isFinite(ts)) return false
    const daysPassed = (Date.now() - ts) / (1000 * 60 * 60 * 24)
    return daysPassed < SUPPRESS_DAYS
  } catch {
    return false
  }
}

function dismiss(e: Event) {
  e.stopPropagation()
  e.preventDefault()
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
  visible.value = false
  // полностью удалить из DOM после анимации
  setTimeout(() => { mounted.value = false }, 320)
}

onMounted(() => {
  if (typeof window === 'undefined') return
  if (isStandalone()) return
  if (!isIosSafari()) return
  if (wasRecentlyDismissed()) return

  mounted.value = true
  // следующий кадр — плавный slide-in
  requestAnimationFrame(() => {
    setTimeout(() => { visible.value = true }, 200)
  })
})
</script>

<template>
  <a
    v-if="mounted"
    :href="APP_URL"
    :style="{
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px calc(10px + env(safe-area-inset-top, 0px))',
      paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
      background: 'rgba(15, 13, 11, 0.96)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      color: '#F5EBE0',
      textDecoration: 'none',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)',
      transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      transition: 'transform 360ms cubic-bezier(0.4, 0, 0.2, 1)',
      boxSizing: 'border-box',
      width: '100%',
    }"
  >
    <!-- Иконка приложения -->
    <img
      :src="ICON_URL"
      alt=""
      :style="{
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
      }"
    />

    <!-- Текст: заголовок + ссылка-подсказка -->
    <div :style="{ flex: '1 1 auto', minWidth: 0, lineHeight: 1.25 }">
      <div
        :style="{
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: '#F5EBE0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }"
      >
        Добавьте WOODLED на айфон
      </div>
      <div
        :style="{
          fontSize: '13px',
          fontWeight: 500,
          color: PAGE.roseGlow,
          marginTop: '2px',
        }"
      >
        Подробнее ↓
      </div>
    </div>

    <!-- Кнопка закрытия -->
    <button
      type="button"
      aria-label="Закрыть"
      @click="dismiss"
      :style="{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(255, 255, 255, 0.08)',
        color: '#F5EBE0',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
      }"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </button>
  </a>
</template>
