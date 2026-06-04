<script setup lang="ts">
/**
 * PWAInstallBanner — sticky-баннер «Откройте WOODLED как приложение»,
 * по образцу avito.ru/apps.
 *
 * Показывается ВСЕМ кроме:
 *   • уже установленных PWA (standalone-режим — на iOS это и есть
 *     запуск с домашнего экрана; если пользователь уже там — баннер
 *     ему не нужен)
 *   • in-app браузеров (Telegram, Instagram, FB, WhatsApp и др.) —
 *     там добавить на домашний экран физически нельзя.
 *
 * Закрытие крестиком — только в текущем рендере. Перезагрузка страницы
 * показывает баннер заново. Это намеренно: пользователь должен иметь
 * шанс заметить и принять решение в каждой сессии.
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
const BANNER_H = 64 // px — высота банера, передаётся в CSS-переменную

const visible = ref(false)
const mounted = ref(false)

/**
 * Расширенный детект «приложение / не браузер»:
 *   1. Apple-специфичный navigator.standalone (iOS Safari с iOS 2+)
 *   2. Все «не-браузерные» display-mode media queries
 *      (standalone / minimal-ui / fullscreen / window-controls-overlay)
 *   3. Android TWA — referrer вида `android-app://...`
 *   4. In-app браузеры соцсетей по UA (Telegram, Instagram, FB,
 *      WhatsApp, VK, Twitter/X, LINE, WeChat). Там «добавить на
 *      домашний экран» недоступно физически — баннер бесполезен.
 */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  if (nav.standalone) return true
  if (window.matchMedia) {
    const modes = ['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay']
    if (modes.some((m) => window.matchMedia('(display-mode: ' + m + ')').matches)) return true
  }
  if (typeof document !== 'undefined' && /^android-app:\/\//.test(document.referrer)) return true
  return false
}

/**
 * In-app браузеры (соцсети, мессенджеры). Внутри них «Поделиться →
 * На экран Домой» в Safari/Chrome недоступно — баннер ввёл бы юзера
 * в тупик. Лучше его не показывать.
 */
function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  return /Instagram|FBAN|FBAV|FB_IAB|Twitter|TwitterAndroid|Line\/|MicroMessenger|Snapchat|WhatsApp|TelegramBot|YaApp|VKAndroidApp|VKWebView|Pinterest|TikTok|musical_ly/i.test(ua)
}

function setBannerVar(h: number) {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--wl-banner-h', h + 'px')
}

function dismiss(e: Event) {
  e.stopPropagation()
  e.preventDefault()
  // Ничего не сохраняем — при перезагрузке баннер появится снова
  visible.value = false
  setBannerVar(0)
  setTimeout(() => { mounted.value = false }, 360)
}

onMounted(() => {
  if (typeof window === 'undefined') return
  if (isStandalone()) return     // уже PWA — баннер не нужен
  if (isInAppBrowser()) return   // Telegram/Instagram/etc — добавить нельзя

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
      <!-- «Подробнее» — тёмная пилюля для контрастного акцента к медному
           фону. Выглядит как primary call-to-action: куда нажимать. -->
      <div
        :style="{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '4px',
          padding: '3px 10px',
          borderRadius: '999px',
          background: '#1A1410',
          color: '#F5EBE0',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.01em',
        }"
      >
        Подробнее <span :style="{ fontWeight: 600 }">↓</span>
      </div>
    </div>

    <!-- Крестик закрытия — намеренно бледный. Светлый полупрозрачный
         фон, мягкая иконка. Не хочется, чтобы он визуально перетягивал
         внимание с CTA «Подробнее» — он там для тех, кому реально
         мешает баннер, а не как первичное действие. -->
    <button
      type="button"
      aria-label="Закрыть"
      @click="dismiss"
      :style="{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(255, 250, 240, 0.28)',
        color: 'rgba(26, 20, 16, 0.55)',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
      }"
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </button>
  </a>
</template>
