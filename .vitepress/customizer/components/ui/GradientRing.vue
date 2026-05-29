<script setup lang="ts">
/**
 * GradientRing.vue — Анимированное цветное свечение по периметру блока.
 *
 * batch10 #5: Используется в StickyBar (кнопка «Мой лес», pill 999px)
 *             и BuyModal (блок «Посмотрите на свой лес», card 12px).
 *
 * Алгоритм:
 *   1. Внешний контейнер с overflow:hidden и borderRadius клипает форму.
 *   2. Внутри — большой квадрат с conic-gradient.
 *   3. Квадрат вращается через transform: rotate() — colors идут по часовой.
 *   4. Слот-контент сидит сверху на zIndex 1, открывая 3px рамки из ring-а.
 *
 * Палитра:
 *   - 0 цветов  → mood palette (dawn → noon → clearing → oak → walnut)
 *   - 1 цвет    → этот цвет + жемчужный T.text + замыкаем циклом
 *   - 2+ цветов → закольцовываем (первый повторяется в конце)
 *
 * Параметры зашиты дефолтами: 14s скорость, 3px толщина — финал batch10 #5.
 */

import { computed } from 'vue'
import { T } from '../../theme/tokens'

interface Props {
  /** Цвета комнат или mood-palette. Empty/single fallback внутри. */
  colors: string[]
  /** Border-radius внутреннего контента (pill = 999, card = 12). */
  borderRadius: number
  /** Толщина свечения px, default 3. */
  ring?: number
  /** Длительность одного оборота в секундах, default 14. */
  speed?: number
}
const props = withDefaults(defineProps<Props>(), {
  ring: 3,
  speed: 14,
})

const PEARL = T.text  // #E8E0D4 — жемчужный fallback для одного цвета
const MOOD_PALETTE = [T.dawn, T.noon, T.clearing, T.oak, T.walnut]

const conicStops = computed(() => {
  const cs = props.colors
  if (cs.length === 0) return [...MOOD_PALETTE, MOOD_PALETTE[0]].join(', ')
  if (cs.length === 1) return `${cs[0]}, ${PEARL}, ${cs[0]}`
  return [...cs, cs[0]].join(', ')
})
</script>

<template>
  <div :style="{ position: 'relative' }">
    <!-- Контейнер свечения: клипает квадрат к форме контента -->
    <div :style="{
      position: 'absolute',
      inset: `-${props.ring}px`,
      borderRadius: (props.borderRadius + props.ring) + 'px',
      overflow: 'hidden',
      zIndex: 0,
      pointerEvents: 'none',
    }">
      <div
        class="ring-spin"
        :style="{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '200%',
          paddingBottom: '200%',
          background: `conic-gradient(from 0deg, ${conicStops})`,
          animationDuration: props.speed + 's',
        }"
      />
    </div>
    <!-- Слот-контент сверху -->
    <div :style="{ position: 'relative', zIndex: 1 }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ring-spin {
  animation-name: ringSpin;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
@keyframes ringSpin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}
</style>
