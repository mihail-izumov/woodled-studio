<script setup lang="ts">
/**
 * PWAInstallBanner — sticky-баннер «Откройте WOODLED как приложение»,
 * по образцу avito.ru/apps.
 *
 * Показывается ВСЕМ кроме:
 *   • уже установленных PWA (standalone-режим)
 *   • тех, кто закрывал баннер недавно (localStorage, 14 дней)
 *
 * Условие «только на главной с комнатами» гарантирует РОДИТЕЛЬ
 * (`customizer/components/App.vue`) — рендерит компонент только в
 * блоке home (v-else: не открыт светильник, не активна комната,
 * приветствие пройдено).
 *
 * Положение:
 *   • `position: sticky; top: 0` — баннер живёт в нормальном потоке
 *     над home-контейнером. Home-контейнер сдвигается естественно
 *     ниже на высоту банера; ReloadButton (absolute внутри home)
 *     тоже уезжает вниз.
 *   • z-index: 80 — ниже SoundButton (z 90), чтобы кнопка звука осталась
 *     видимой в правом верхнем углу поверх банера.
 *   • Текст banner'а получает `padding-right: 68px`, чтобы не наезжать
 *     на SoundButton. Кнопка закрытия — слева от SoundButton (right:60).
 *
 * Текст универсальный — «Откройте как приложение», без упоминания
 * iOS, потому что баннер показывается на всех платформах. Конкретные
 * инструкции лежат на странице /app.
 */
import { ref, onMounted } from 'vue'

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
  if (isStandalone()) return     // PWA уже добавлено
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
      position: 'sticky',
      top: 0,
      // z-index 80 — ниже SoundButton (90), чтобы он остался видим поверх
      // банера в правом верхнем углу.
      zIndex: 80,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      // Справа доп. отступ под SoundButton (44px + 16px край + запас)
      paddingLeft: '14px',
      paddingRight: '68px',
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
          color: '#EFCEB0',
          marginTop: '2px',
        }"
      >
        Подробнее ↓
      </div>
    </div>

    <!-- Крестик закрытия. Абсолютно позиционирован слева от SoundButton.
         right:60px = 16px край + 44px кнопка звука — чтобы не накладываться. -->
    <button
      type="button"
      aria-label="Закрыть"
      @click="dismiss"
      :style="{
        position: 'absolute',
        right: '60px',
        top: 'calc(50% + env(safe-area-inset-top, 0px) / 2)',
        transform: 'translateY(-50%)',
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
