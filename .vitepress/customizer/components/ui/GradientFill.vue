<script setup lang="ts">
/**
 * GradientFill.vue — Анимированный аврора-фон для крупных панелей.
 *
 * batch10 #5 v3:
 *   Альтернатива GradientRing для случаев когда градиент должен быть
 *   ВНУТРИ панеля (а не обводкой вокруг). Блок «Посмотрите на свой лес»
 *   в BuyModal — единственный пример.
 *
 *   Несколько (минимум 5) огромных радиальных blob-ов сидят на разных
 *   позициях. Каждый медленно «дышит» — пульсирует scale + opacity со
 *   своей частотой. Перекрытия смешиваются в плавный аврора-фон без
 *   направления и швов.
 *
 *   Параметры (зашиты в @keyframes A–E):
 *     scale 0.55 ↔ 1.55, opacity 0.20 ↔ 0.95
 *     duration 10–14s (varied per position), delay -1.7s × i
 *
 *   Цикличность цветов: при ≥5 цветах все blob-ы уникальны;
 *   при <5 цвета повторяются с разными keyframe/delay для desync.
 */

import { computed } from 'vue'
import { T } from '../../theme/tokens'

interface Props {
  /** Цвета комнат. Empty/single fallback внутри. */
  colors: string[]
  /** Border-radius для клипа blob-ов к форме слот-контента. */
  borderRadius: number
  /** Базовый цвет панеля под blob-ами. По умолчанию кремовый. */
  baseColor?: string
}
const props = withDefaults(defineProps<Props>(), {
  baseColor: '#EAE0CA',
})

const PEARL = T.text  // #E8E0D4 — жемчужный fallback
const MOOD_PALETTE = [T.dawn, T.noon, T.clearing, T.oak, T.walnut]

/** 5 уникальных позиций × keyframes для blob-ов. */
const POSITIONS = [
  { left: 22, top: 35, dur: 11, kf: 'A' },
  { left: 55, top: 20, dur: 13, kf: 'B' },
  { left: 78, top: 55, dur: 10, kf: 'C' },
  { left: 35, top: 75, dur: 14, kf: 'D' },
  { left: 70, top: 80, dur: 12, kf: 'E' },
] as const

/** Минимум 5 blob-ов — цвета цикл, позиции/keyframes уникальны для разнообразия. */
const blobs = computed(() => {
  const cs = props.colors
  let palette: string[]
  if (cs.length === 0) palette = MOOD_PALETTE
  else if (cs.length === 1) palette = [cs[0], PEARL, cs[0]]
  else palette = cs

  const N = Math.max(5, palette.length)
  return Array.from({ length: N }, (_, i) => ({
    color: palette[i % palette.length],
    pos: POSITIONS[i % POSITIONS.length],
    delay: -(i * 1.7),
  }))
})
</script>

<template>
  <div :style="{ position: 'relative' }">
    <!-- Контейнер с base color + blob-ы (клипается к форме слота) -->
    <div :style="{
      position: 'absolute',
      inset: 0,
      borderRadius: props.borderRadius + 'px',
      overflow: 'hidden',
      background: props.baseColor,
      zIndex: 0,
      pointerEvents: 'none',
    }">
      <div
        v-for="(b, i) in blobs"
        :key="i"
        :class="`aurora-blob aurora-blob-${b.pos.kf}`"
        :style="{
          position: 'absolute',
          left: b.pos.left + '%',
          top: b.pos.top + '%',
          width: '140%',
          aspectRatio: '1',
          background: `radial-gradient(circle, ${b.color} 0%, transparent 78%)`,
          animationDuration: b.pos.dur + 's',
          animationDelay: b.delay + 's',
          willChange: 'transform, opacity',
        }"
      />
    </div>
    <!-- Слот сверху -->
    <div :style="{ position: 'relative', zIndex: 1 }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.aurora-blob {
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  animation-fill-mode: both;
}
.aurora-blob-A { animation-name: auroraBreatheA; }
.aurora-blob-B { animation-name: auroraBreatheB; }
.aurora-blob-C { animation-name: auroraBreatheC; }
.aurora-blob-D { animation-name: auroraBreatheD; }
.aurora-blob-E { animation-name: auroraBreatheE; }

@keyframes auroraBreatheA {
  0%, 100% { transform: translate(-50%, -50%) translate(0%, 0%)   scale(0.55); opacity: 0.20; }
  50%      { transform: translate(-50%, -50%) translate(10%, 6%)  scale(1.55); opacity: 0.95; }
}
@keyframes auroraBreatheB {
  0%, 100% { transform: translate(-50%, -50%) translate(0%, 0%)   scale(1.50); opacity: 0.90; }
  50%      { transform: translate(-50%, -50%) translate(-8%, 5%)  scale(0.60); opacity: 0.25; }
}
@keyframes auroraBreatheC {
  0%, 100% { transform: translate(-50%, -50%) translate(6%, -4%)  scale(0.70); opacity: 0.30; }
  50%      { transform: translate(-50%, -50%) translate(-6%, 4%)  scale(1.50); opacity: 0.90; }
}
@keyframes auroraBreatheD {
  0%, 100% { transform: translate(-50%, -50%) translate(0%, 0%)   scale(1.50); opacity: 0.85; }
  50%      { transform: translate(-50%, -50%) translate(7%, -5%)  scale(0.65); opacity: 0.25; }
}
@keyframes auroraBreatheE {
  0%, 100% { transform: translate(-50%, -50%) translate(-5%, 3%)  scale(0.75); opacity: 0.30; }
  50%      { transform: translate(-50%, -50%) translate(6%, -3%)  scale(1.50); opacity: 0.95; }
}
</style>
