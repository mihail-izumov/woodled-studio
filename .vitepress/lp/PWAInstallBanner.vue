<script setup lang="ts">
/**
 * PWAInstallBanner — sticky-баннер «Откройте WOODLED как приложение»,
 * по образцу avito.ru/apps.
 *
 * Показывается ВСЕМ кроме:
 *   • уже установленных PWA (standalone-режим)
 *   • тех, кто закрывал баннер недавно (localStorage, 14 дней)
 *   • когда пользователь уже на странице /app (некуда вести)
 *
 * Положение — `position: fixed` сверху. Раньше было `sticky`, но `.lp-root`
 * имеет `overflow: hidden` → sticky прилипает к нему, а не к viewport,
 * и фактически не виден. Fixed работает независимо от родителей.
 *
 * Анимация — slide-in сверху на ~300мс после mount.
 *
 * iOS-инструкции (Поделиться → На экран Домой) — у нас УНИВЕРСАЛЬНЫЙ
 * текст «Откройте как приложение», потому что:
 *   • на iOS Safari это PWA через Add to Home
 *   • на Android Chrome — нативный prompt (мы его не перехватываем, но
 *     пользователь может через меню браузера тоже добавить)
 *   • на десктопе — Chrome/Edge показывает иконку Install в адресной строке
 * Конкретные инструкции лежат на /app.
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
  const nav = window.navigator as Navigator & { standalone?: boolean }
  if (nav.standalone) return true
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true
  return false
}

function isAppPage(): boolean {
  if (typeof window === 'undefined') return false
  return /\/app\/?$/.test(window.location.pathname)
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
  setTimeout(() => { mounted.value = false }, 320)
}

onMounted(() => {
  if (typeof window === 'undefined') return
  if (isStandalone()) return     // PWA уже добавлено — не отвлекаем
  if (isAppPage()) return        // мы и так на странице инструкции
  if (wasRecentlyDismissed()) return

  mounted.value = true
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
      // ВАЖНО: fixed, не sticky. Sticky внутри .lp-root (overflow:hidden)
      // не работает корректно — прилипает к контейнеру, а не к viewport.
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 300,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      paddingLeft: '14px',
      paddingRight: '14px',
      paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
      paddingBottom: '10px',
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

    <!-- Текст: заголовок + подсказка -->
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
        Откройте WOODLED как приложение
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
