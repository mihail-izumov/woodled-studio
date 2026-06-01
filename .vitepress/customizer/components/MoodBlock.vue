<script setup lang="ts">
/**
 * MoodBlock.vue — Блок настроения с MoodArc (Canvas 2D).
 *
 * batch9 #6 — Canvas 2D вместо SVG:
 *   - Полная совместимость с iOS Safari
 *   - Retina-ready (devicePixelRatio)
 *   - Responsive через padding-bottom hack (без aspectRatio)
 *   - Glow через radialGradient (без CSS filter / shadowBlur)
 *   - Иконка — HTML overlay поверх canvas
 *   - Прогресс-дуга: clockwise left→top→right
 *
 * batch9 #7 — динамический desc (9 фаз внутри 3 mood):
 *   - moodDesc(ratio) из data/moods.ts
 *   - empty-state (ratio <= 0) → fallback на статический mood.desc из MOOD_EMPTY
 *   - реально MoodBlock не рендерится без светильников (см. RoomDetail.vue
 *     v-if="props.room.fixtures.length > 0"), но fallback оставлен на всякий
 */

import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { T } from '../theme/tokens'
import type { Mood } from '../data/moods'
import { moodDesc } from '../data/moods'
import { ratioToAngle } from '../engine/brightness'
import Icon, { type IconName } from './ui/Icons.vue'

interface Props {
  mood: Mood
  ratio: number
  roomPrepName: string
}
const props = defineProps<Props>()
const emit = defineEmits<{ showDetail: [] }>()

/* ──────────── Динамический desc по 9 фазам ──────────── */
const desc = computed(() =>
  props.mood.id === 'empty' ? props.mood.desc : moodDesc(props.ratio),
)

/* ──────────── Геометрия (логические координаты) ──────────── */
const LW = 280
const CX = 140
const CY = 140
const R = 120
const STROKE = 10
const LH = CY + 4  // 144

/** Позиция иконки — визуальный центр полукруга */
const ICON_CY = CY - 56

/** padding-bottom в % для responsive контейнера */
const PB_PCT = ((LH / LW) * 100).toFixed(2) + '%'

/** Позиция иконки в % от контейнера (для HTML overlay) */
const iconTopPct = ((ICON_CY - 14) / LH * 100).toFixed(1) + '%'
const iconLeftPct = ((CX - 14) / LW * 100).toFixed(1) + '%'
const iconSizePct = (28 / LW * 100).toFixed(1) + '%'

/* ──────────── Canvas refs ──────────── */
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

/* ──────────── Утилиты ──────────── */

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Мягкий радиальный glow без shadowBlur — через radialGradient */
function drawSoftGlow(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, rx: number, ry: number,
  color: string, opacity: number,
) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry))
  grad.addColorStop(0, hexToRgba(color, opacity))
  grad.addColorStop(0.5, hexToRgba(color, opacity * 0.4))
  grad.addColorStop(1, hexToRgba(color, 0))
  ctx.save()
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/*
 * Canvas arc angles (Y-axis down):
 *   0 = right (3 o'clock)
 *   π/2 = bottom (6 o'clock)
 *   π = left (9 o'clock)
 *   3π/2 = top (12 o'clock)
 *
 * Track: clockwise from π (left) → 3π/2 (top) → 2π (right)
 * Mood angle 0° = left (canvas π), 180° = right (canvas 2π)
 * Formula: canvasAngle = π + (moodAngle × π / 180)
 */

/* ──────────── Отрисовка ──────────── */

function draw() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const rect = container.getBoundingClientRect()
  const cssW = rect.width
  const cssH = rect.height
  if (cssW === 0 || cssH === 0) return
  const dpr = window.devicePixelRatio || 1

  canvas.width = cssW * dpr
  canvas.height = cssH * dpr

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const scale = (cssW / LW) * dpr
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.clearRect(0, 0, LW, LH)

  const color = props.mood.color
  const moodAngle = Math.min(Math.max(ratioToAngle(props.ratio), 0.5), 179.5)

  // ── Glow: radial gradient, clipped to top half ──
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, LW, CY)
  ctx.clip()
  drawSoftGlow(ctx, CX, CY - 10, 140, 110, color, 0.07)
  drawSoftGlow(ctx, CX, CY - 30, 100, 80, color, 0.09)
  ctx.restore()

  // ── Track: full semicircle left→top→right ──
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
  ctx.lineWidth = STROKE
  ctx.lineCap = 'butt'
  ctx.beginPath()
  ctx.arc(CX, CY, R, Math.PI, Math.PI * 2, false)
  ctx.stroke()
  ctx.restore()

  // ── Progress: partial arc left→toward right ──
  if (moodAngle > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, LW, CY)
    ctx.clip()

    const grad = ctx.createLinearGradient(CX - R, CY, CX + R, CY)
    grad.addColorStop(0, hexToRgba(color, 0.05))
    grad.addColorStop(1, hexToRgba(color, 1.0))
    ctx.strokeStyle = grad
    ctx.lineWidth = STROKE
    ctx.lineCap = 'round'

    const canvasEnd = Math.PI + (moodAngle * Math.PI / 180)
    ctx.beginPath()
    ctx.arc(CX, CY, R, Math.PI, canvasEnd, false)
    ctx.stroke()
    ctx.restore()
  }

  // ── Icon circle ──
  ctx.save()
  ctx.strokeStyle = hexToRgba(color, 0.2)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(CX, ICON_CY, 26, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.fillStyle = hexToRgba(color, 0.03)
  ctx.beginPath()
  ctx.arc(CX, ICON_CY, 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/* ──────────── Lifecycle ──────────── */

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => draw())
  if (containerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => draw())
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(() => [props.ratio, props.mood.color], () => {
  nextTick(() => draw())
})
</script>

<template>
  <div
    class="mood-block"
    :style="{
      background: mood.color + '06',
      border: `1px solid ${mood.color}33`,
      borderRadius: '16px',
    }"
  >
    <div class="mood-header" :style="{ color: mood.color + 'bb' }">
      Настроение {{ roomPrepName }}
    </div>

    <!-- Canvas контейнер — responsive через padding-bottom -->
    <div :style="{ maxWidth: LW + 'px', margin: '4px auto' }">
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
        <!-- Иконка — HTML overlay поверх canvas -->
        <div
          :style="{
            position: 'absolute',
            top: iconTopPct,
            left: iconLeftPct,
            width: iconSizePct,
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }"
        >
          <Icon :name="(mood.iconKey ?? 'sun') as IconName" :color="mood.color" :size="28" />
        </div>
      </div>
    </div>

    <div class="mood-name">{{ mood.name }}</div>
    <div class="mood-desc">{{ desc }}</div>

    <button
      class="mood-detail-btn"
      :style="{ background: mood.color, color: T.bg }"
      @click="emit('showDetail')"
    >
      Больше о настроении
    </button>
  </div>
</template>

<style scoped>
.mood-block {
  padding: 16px 20px 20px;
  margin-bottom: 16px;
  text-align: center;
}
.mood-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  margin-bottom: 4px;
}
.mood-name {
  font-size: 18px;
  font-weight: 700;
  color: v-bind('T.text');
  margin-top: 8px;
}
.mood-desc {
  font-size: 12px;
  color: v-bind('T.textSec');
  line-height: 1.5;
  margin-top: 4px;
  max-width: 280px;
  margin-left: auto;
  margin-right: auto;
}
.mood-detail-btn {
  margin-top: 16px;
  padding: 9px 22px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
}
</style>
