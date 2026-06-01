<script setup lang="ts">
/**
 * Footer.vue — Дабл-бренд внизу страниц кастомайзера.
 *
 * Раньше: одно лого WOODLED (mask → T.neutral).
 * Теперь: блок WOODLED × МОДУЛЬ РОСТА, как в футере лендинга,
 * но перекрашенный под тёмную тему — оба лого тонируются в T.neutral
 * (#A89878, тот самый «приглушённый woodled») одним фильтром.
 *
 * Почему filter, а не mask: лого МОДУЛЬ РОСТА лежит на runscale.ru
 * (кросс-домен), а CSS mask-image для кросс-доменной картинки
 * блокируется CORS. filter на <img> работает без CORS и красит оба
 * лого в один и тот же цвет.
 *
 * Цепочка filter точно переводит чёрный силуэт (brightness(0)) в
 * #A89878 = T.neutral (подобрана солвером, Δ < 1 по каждому каналу).
 */

import { T } from '../theme/tokens'

const WOODLED_LOGO_URL = '/woodled-studio/customizer/woodled-logo.svg'
const RUNSCALE_LOGO_URL = 'https://runscale.ru/runscale_logo_2026_2.svg'

// brightness(0) → чёрный силуэт, далее точная тонировка в T.neutral (#A89878)
const TINT =
  'brightness(0) invert(60%) sepia(5%) saturate(1506%) hue-rotate(2deg) brightness(100%) contrast(97%)'
</script>

<template>
  <div
    class="cust-footer"
    :style="{
      marginTop: '60px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'clamp(12px, 3vw, 18px)',
      /* приглушённо — не отвлекает от кастомайзера */
      opacity: 0.5,
      transition: 'opacity 240ms ease',
    }"
  >
    <a
      href="https://woodled.ru"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WOODLED"
      :style="{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }"
    >
      <img
        :src="WOODLED_LOGO_URL"
        alt="WOODLED"
        :style="{
          height: 'clamp(20px, 4vw, 26px)',
          width: 'auto',
          display: 'block',
          filter: TINT,
        }"
      />
    </a>

    <!-- × в том же приглушённом цвете, тоньше лого -->
    <span
      aria-hidden="true"
      :style="{
        color: T.neutral,
        opacity: 0.7,
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
      }"
    >
      <svg
        viewBox="0 0 32 32"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="0.9"
        stroke-linecap="square"
        :style="{ display: 'block' }"
      >
        <line x1="5" y1="5" x2="27" y2="27" />
        <line x1="27" y1="5" x2="5" y2="27" />
      </svg>
    </span>

    <a
      href="https://runscale.ru"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Модуль Роста"
      :style="{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }"
    >
      <img
        :src="RUNSCALE_LOGO_URL"
        alt="Модуль Роста"
        :style="{
          height: 'clamp(20px, 4vw, 26px)',
          width: 'auto',
          display: 'block',
          filter: TINT,
        }"
      />
    </a>
  </div>
</template>

<style scoped>
/* лёгкий ховер — чуть ярче, как affordance, но всё ещё спокойно */
.cust-footer:hover {
  opacity: 0.72;
}
</style>
