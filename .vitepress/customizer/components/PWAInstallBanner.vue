<script setup lang="ts">
/**
 * PWAInstallBanner — sticky-баннер «Откройте WOODLED как приложение»,
 * по образцу avito.ru/apps.
 *
 * Показывается ВСЕМ кроме:
 *   • уже установленных PWA (standalone-режим — на iOS это и есть
 *     запуск с домашнего экрана; если пользователь уже там — баннер
 *     ему не нужен)
 *   • тех, кто закрыл баннер крестиком в ТЕКУЩЕЙ вкладке (sessionStorage).
 *     При новой загрузке страницы — баннер появляется снова.
 *
 * Условие «только на главной с комнатами» гарантирует РОДИТЕЛЬ
 * (`customizer/components/App.vue`) — рендерит компонент только в
 * блоке home (v-else: не открыт светильник, не активна комната,
 * приветствие пройдено).
 *
 * Позиционирование:
 *   • `position: sticky; top: 0` — в нормальном потоке над home-контейнером.
 *   • z-index: 100 — выше всех домашних кнопок. Сам банер «толкает»
 *     SoundButton и ReloadButton вниз через CSS-переменную --wl-banner-h:
 *     эти кнопки имеют `top: calc(6px + var(--wl-banner-h, 0px))` и
 *     уезжают синхронно с появлением/скрытием банера (transition).
 *   • Крестик закрытия сидит в правом краю — место под SoundButton
 *     больше не резервируем (звук теперь ПОД банером).
 *
 * Цвет:
 *   • Тёплый медный градиент в стиле WOODLED-CTA — нарядный, ярче
 *     чем тёмный фон сайта (#13110E). Текст тёмный для контраста.
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

const ICON_URL = '/woodled-studio/apple-touch-icon.png'
const APP_URL = '/woodled-studio/app'
const SESSION_KEY = 'wl_pwa_banner_dismissed'
const BANNER_H = 64 // px — высота банера, передаётся в CSS-переменную

const visible = ref(false)
const mounted = ref(false)

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  if (nav.standalone) return true
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true
  return false
}

function wasDismissedThisSession(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY) === '1' } catch { return false }
}

function setBannerVar(h: number) {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--wl-banner-h', h + 'px')
}

function dismiss(e: Event) {
  e.stopPropagation()
  e.preventDefault()
  try { sessionStorage.setItem(SESSION_KEY, '1') } catch {}
  visible.value = false
  setBannerVar(0)
  // удалить из DOM после анимации
  setTimeout(() => { mounted.value = false }, 360)
}

onMounted(() => {
  if (typeof window === 'undefined') return
  if (isStandalone()) return
  if (wasDismissedThisSession()) return

  mounted.value = true
  setBannerVar(BANNER_H)
  requestAnimationFrame(() => {
    setTimeout(() => { visible.value = true }, 200)
  })
})

onBeforeUnmount(() => {
  // если v-else блок сменился (зашли в комнату) — снимаем var,
  // чтобы SoundButton вернулся в обычное положение.
  setBannerVar(0)
})
</script>

<template>
  <a
    v-if="mounted"
    :href="APP_URL"
    :style="{
      position: 'sticky',
      top: 0,
      // z-index 100 — выше SoundButton (90); сам банер «толкает» его
      // вниз через --wl-banner-h, поэтому пересечения нет.
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      paddingLeft: '14px',
      paddingRight: '14px',
      paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
      paddingBottom: '10px',
      // Тёплый медный градиент в стиле WOODLED-CTA — нарядно и
      // контрастно к тёмному фону сайта.
      background: 'linear-gradient(135deg, #C9A47A 0%, #E4C99A 50%, #B58C5C 100%)',
      color: '#1A1410',
      textDecoration: 'none',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
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
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
      }"
    />

    <!-- Текст: заголовок + подсказка -->
    <div :style="{ flex: '1 1 auto', minWidth: 0, lineHeight: 1.25 }">
      <div
        :style="{
          fontSize: '15px',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: '#1A1410',
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
          fontWeight: 600,
          color: 'rgba(26, 20, 16, 0.72)',
          marginTop: '2px',
        }"
      >
        Подробнее ↓
      </div>
    </div>

    <!-- Крестик в правом краю — SoundButton теперь ПОД банером, место
         справа свободно. -->
    <button
      type="button"
      aria-label="Закрыть"
      @click="dismiss"
      :style="{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(26, 20, 16, 0.14)',
        color: '#1A1410',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
      }"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </a>
</template>
