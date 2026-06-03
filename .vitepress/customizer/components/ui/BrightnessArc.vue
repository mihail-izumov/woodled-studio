<script setup lang="ts">
/**
 * BrightnessArc.vue — Полукруг яркости с «закатом за горизонт».
 *
 * Адаптация Canvas-дуги из MoodBlock.vue (Canvas 2D, iOS-safe, retina, ResizeObserver),
 * но угол прогресса считается линейно от ratio (а не через mood-фазы):
 *   angle = min(ratio, 1) × 180°   → 50% = ровно половина дуги, 100% = полная.
 *
 * Состав слоёв (снизу вверх):
 *   1. Outer ambient glow — два мягких эллипса (как в MoodBlock)
 *   2. Horizon strip — 1.5px полоска у самой хорды: тинт-зона сужена (стопы 0.15/0.85)
 *   3. Фоновое свечение — заливает интерьер полукруга, ШКАЛИРУЕТСЯ по уровням BRIGHT
 *   4. «Солнце за горизонтом» — диск с центром НА хорде, верхняя половина видна,
 *      нижняя клипается → закат/восход. Тоже шкалируется по BRIGHT.
 *   5. Track (трэк-полукруг, round-caps)
 *   6. Progress (прогресс, round-caps)
 *   7. HTML/SVG overlay: curved «X из Y лм», большой %, статус BRIGHT caps
 *
 * Шкалирование по BRIGHT (sync с тем же текстом, что под %):
 *   Мало света → тусклое тонкое солнце; Больше, чем надо → яркое и крупное.
 *
 * Размеры текста и абсолютные позиции масштабируются пропорционально ширине контейнера.
 */

import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { T } from '../../theme/tokens'
import { BRIGHT, getBright } from '../../data/moods'

interface Props {
  ratio: number
  color: string
  actual: number
  plan: number
}
const props = defineProps<Props>()

/* ──────────── Геометрия (логические координаты) ──────────── */
const LW = 280
const CX = 140
const CY = 140
const R = 120
const STROKE = 10
const LH = CY + 8 // 148 — место под round-caps ниже хорды (STROKE/2 = 5)
const PB_PCT = ((LH / LW) * 100).toFixed(2) + '%'

/* Путь для curved caption «X из Y лм» — дуга внутри прогресс-кольца. */
const TEXT_R = 100
const TEXT_PATH_D = `M ${CX - TEXT_R} ${CY} A ${TEXT_R} ${TEXT_R} 0 0 1 ${CX + TEXT_R} ${CY}`

/* Уникальный id пути для нескольких инстансов на странице. */
let _arcInstance = 0
const ARC_PATH_ID = `brArc-${++_arcInstance}`

/* ──────────── Refs ──────────── */
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

/* Текущая ширина контейнера в CSS-пикселях — для пропорционального масштабирования
 * HTML-текста (SVG-текст масштабируется автоматически через viewBox). */
const containerWidth = ref(LW)
const scale = computed(() => containerWidth.value / LW)
const sPx = (n: number) => (n * scale.value) + 'px'

/* ──────────── Деривативы ──────────── */
const pct = computed(() => Math.round(props.ratio * 100))
const bright = computed(() => getBright(props.ratio))
const caption = computed(() =>
  `${Math.round(props.actual).toLocaleString('ru-RU')} из ${Math.round(props.plan).toLocaleString('ru-RU')} лм`,
)

/* ──────────── Утилиты ──────────── */
function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/* Линейный маппинг ratio → угол (0–180°), кап на 1.0.
 * Бывший баг: в MoodBlock использовался ratioToAngle (фазы mood) — он
 * не показывал чистый %. Для дашборда яркости здесь честный линейный. */
function ratioToAnglePct(ratio: number): number {
  if (ratio <= 0) return 0
  return Math.min(ratio, 1) * 180
}

/* ──────────── Отрисовка ──────────── */
function draw() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return
  const rect = container.getBoundingClientRect()
  const cssW = rect.width
  const cssH = rect.height
  if (cssW === 0 || cssH === 0) return

  containerWidth.value = cssW

  const dpr = window.devicePixelRatio || 1
  canvas.width = cssW * dpr
  canvas.height = cssH * dpr
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const sc = (cssW / LW) * dpr
  ctx.setTransform(sc, 0, 0, sc, 0, 0)
  ctx.clearRect(0, 0, LW, LH)

  const color = props.color
  const angle = Math.min(Math.max(ratioToAnglePct(props.ratio), 0.5), 179.5)
  const BOTTOM_LINE = CY + STROKE / 2 // 145 — низ круглых концов = «горизонт»

  /* 1. Outer ambient glow — clip до низа дуги (один горизонт со скруглениями) */
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, LW, BOTTOM_LINE); ctx.clip()
  const g1 = ctx.createRadialGradient(CX, CY - 10, 0, CX, CY - 10, 140)
  g1.addColorStop(0, hexToRgba(color, 0.07))
  g1.addColorStop(0.5, hexToRgba(color, 0.028))
  g1.addColorStop(1, hexToRgba(color, 0))
  ctx.fillStyle = g1
  ctx.beginPath(); ctx.ellipse(CX, CY - 10, 140, 110, 0, 0, Math.PI * 2); ctx.fill()
  const g2 = ctx.createRadialGradient(CX, CY - 30, 0, CX, CY - 30, 100)
  g2.addColorStop(0, hexToRgba(color, 0.09))
  g2.addColorStop(0.5, hexToRgba(color, 0.036))
  g2.addColorStop(1, hexToRgba(color, 0))
  ctx.fillStyle = g2
  ctx.beginPath(); ctx.ellipse(CX, CY - 30, 100, 80, 0, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  /* 2. Horizon strip — 1.5px у самой хорды, тинт-зона сужена на 30% */
  ctx.save()
  const horizonGrad = ctx.createLinearGradient(0, 0, LW, 0)
  horizonGrad.addColorStop(0, hexToRgba(color, 0))
  horizonGrad.addColorStop(0.15, hexToRgba(color, 0))
  horizonGrad.addColorStop(0.5, hexToRgba(color, 0.50))
  horizonGrad.addColorStop(0.85, hexToRgba(color, 0))
  horizonGrad.addColorStop(1, hexToRgba(color, 0))
  ctx.fillStyle = horizonGrad
  ctx.fillRect(0, BOTTOM_LINE - 1.5, LW, 1.5)
  ctx.restore()

  /* 3+4. Sync со статусом BRIGHT — 5 уровней яркости для bg-bloom и «солнца». */
  const brightIdx = Math.max(0, BRIGHT.findIndex((b) => props.ratio <= b.max))
  const lvl = [
    { sun: 0.15, sunM: 0.04, sR: 22, bg: 0.10, bgM: 0.03 }, // 0 — Мало света
    { sun: 0.32, sunM: 0.10, sR: 28, bg: 0.18, bgM: 0.06 }, // 1 — Почти хватает
    { sun: 0.60, sunM: 0.22, sR: 34, bg: 0.30, bgM: 0.10 }, // 2 — В самый раз
    { sun: 0.82, sunM: 0.32, sR: 40, bg: 0.42, bgM: 0.14 }, // 3 — С запасом
    { sun: 1.00, sunM: 0.40, sR: 46, bg: 0.55, bgM: 0.18 }, // 4 — Больше, чем надо
  ][brightIdx]

  /* 3. Фоновое свечение — заливает интерьер полукруга */
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, LW, BOTTOM_LINE); ctx.clip()
  const bgR = 118
  const bgBloom = ctx.createRadialGradient(CX, BOTTOM_LINE, 0, CX, BOTTOM_LINE, bgR)
  bgBloom.addColorStop(0, hexToRgba(color, lvl.bg))
  bgBloom.addColorStop(0.45, hexToRgba(color, lvl.bgM))
  bgBloom.addColorStop(1, hexToRgba(color, 0))
  ctx.fillStyle = bgBloom
  ctx.beginPath(); ctx.arc(CX, BOTTOM_LINE, bgR, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  /* 4. «Солнце за горизонтом» — диск с центром НА хорде, видна верхняя половина */
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, LW, BOTTOM_LINE); ctx.clip()
  const sunR = lvl.sR
  const sun = ctx.createRadialGradient(CX, BOTTOM_LINE, 0, CX, BOTTOM_LINE, sunR)
  sun.addColorStop(0, hexToRgba(color, lvl.sun))
  sun.addColorStop(0.5, hexToRgba(color, lvl.sunM))
  sun.addColorStop(1, hexToRgba(color, 0))
  ctx.fillStyle = sun
  ctx.beginPath(); ctx.arc(CX, BOTTOM_LINE, sunR, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  /* 5. Track — round-caps */
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'
  ctx.lineWidth = STROKE
  ctx.lineCap = 'round'
  ctx.beginPath(); ctx.arc(CX, CY, R, Math.PI, Math.PI * 2, false); ctx.stroke()
  ctx.restore()

  /* 6. Progress — линейный угол от ratio (50% = половина дуги) */
  ctx.save()
  const grad = ctx.createLinearGradient(CX - R, CY, CX + R, CY)
  grad.addColorStop(0, hexToRgba(color, 0.05))
  grad.addColorStop(1, hexToRgba(color, 1.0))
  ctx.strokeStyle = grad
  ctx.lineWidth = STROKE
  ctx.lineCap = 'round'
  const endAng = Math.PI + (angle * Math.PI / 180)
  ctx.beginPath(); ctx.arc(CX, CY, R, Math.PI, endAng, false); ctx.stroke()
  ctx.restore()
}

/* ──────────── Lifecycle ──────────── */
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  /* Считываем ширину сразу, чтобы первый paint уже был с правильным sPx-масштабом. */
  if (containerRef.value) {
    const w = containerRef.value.getBoundingClientRect().width
    if (w > 0) containerWidth.value = w
  }
  nextTick(() => draw())
  if (containerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => draw())
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(
  () => [props.ratio, props.color, props.actual, props.plan],
  () => nextTick(() => draw()),
)
</script>

<template>
  <div :style="{ width: '100%' }">
    <div
      ref="containerRef"
      :style="{
        position: 'relative',
        width: '100%',
        paddingBottom: PB_PCT,
      }"
    >
      <canvas
        ref="canvasRef"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }"
      />

      <!-- Curved caption «X из Y лм» под прогресс-кольцом. SVG-текст
           масштабируется автоматически через viewBox. -->
      <svg
        :viewBox="`0 0 ${LW} ${LH}`"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
          pointerEvents: 'none',
        }"
        aria-hidden="true"
      >
        <defs>
          <path :id="ARC_PATH_ID" :d="TEXT_PATH_D" fill="none" />
        </defs>
        <text
          :fill="hexToRgba(props.color, 0.85)"
          font-weight="600"
          font-size="11"
          letter-spacing="0.4"
          :style="{ fontVariantNumeric: 'tabular-nums' }"
        >
          <textPath :href="`#${ARC_PATH_ID}`" startOffset="50%" text-anchor="middle">{{ caption }}</textPath>
        </text>
      </svg>

      <!-- Большой % — чуть выше визуального центра, знак % уменьшен и прижат к верху цифр -->
      <div
        :style="{
          position: 'absolute',
          left: 0,
          right: 0,
          top: ((86 / LH) * 100) + '%',
          transform: 'translateY(-50%)',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }"
      >
        <div :style="{ display: 'inline-flex', alignItems: 'flex-start', lineHeight: 1 }">
          <span
            :style="{
              fontSize: sPx(50),
              fontWeight: 500,
              color: T.text,
              letterSpacing: sPx(-1.4),
              fontVariantNumeric: 'tabular-nums',
            }"
          >{{ pct }}</span>
          <span
            :style="{
              fontSize: sPx(24),
              fontWeight: 500,
              color: T.text,
              marginLeft: sPx(2),
              marginTop: sPx(4),
              letterSpacing: sPx(-0.3),
            }"
          >%</span>
        </div>
      </div>

      <!-- Статус BRIGHT — caps в цвет комнаты, прижат к % внутри полукруга -->
      <div
        :style="{
          position: 'absolute',
          left: 0,
          right: 0,
          top: ((120 / LH) * 100) + '%',
          transform: 'translateY(-50%)',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }"
      >
        <span
          :style="{
            color: props.color,
            fontSize: sPx(10),
            fontWeight: 600,
            letterSpacing: sPx(0.3),
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }"
        >{{ bright.name }}</span>
      </div>
    </div>
  </div>
</template>
