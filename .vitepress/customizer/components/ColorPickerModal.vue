<script setup lang="ts">
/**
 * ColorPickerModal.vue — Hue-style color picker.
 *
 * batch11 #8 v3 (#3): Кнопки «Готово» и «Сбросить цвет» — выше,
 *   fontSize 16px, fontWeight 500, одинаковый размер текста.
 */

import { ref, computed, nextTick } from 'vue'
import { T, Z } from '../theme/tokens'
import NavHeader from './ui/NavHeader.vue'

interface Props {
  current: string | undefined
  roomName: string
}
const props = defineProps<Props>()
const emit = defineEmits<{
  pick: [color: string | undefined]
  close: []
}>()

const picked = ref<string | undefined>(props.current)
const tab = ref<'presets' | 'wheel'>('presets')
const wheelCanvas = ref<HTMLCanvasElement | null>(null)
const wheelSize = 280
const pickerPos = ref<{ x: number; y: number } | null>(null)

const PRESETS: { color: string; name: string }[] = [
  { color: '#D4956B', name: 'Закат' },
  { color: '#C9A84C', name: 'Янтарь' },
  { color: '#C4A46C', name: 'Песок' },
  { color: '#A89878', name: 'Лён' },
  { color: '#8BAA6B', name: 'Поляна' },
  { color: '#7BA05B', name: 'Лес' },
  { color: '#5B8BA0', name: 'Озеро' },
  { color: '#6B8DC4', name: 'Небо' },
  { color: '#8B6BA0', name: 'Лаванда' },
  { color: '#B85C6C', name: 'Рубин' },
  { color: '#B85C4C', name: 'Глина' },
  { color: '#8B6242', name: 'Орех' },
]

function drawWheel() {
  const cvs = wheelCanvas.value; if (!cvs) return
  const ctx = cvs.getContext('2d'); if (!ctx) return
  const cx = wheelSize / 2, cy = wheelSize / 2, radius = wheelSize / 2 - 1
  ctx.clearRect(0, 0, wheelSize, wheelSize)
  const steps = 100
  for (let ring = steps; ring >= 0; ring--) {
    const r = (ring / steps) * radius; const sat = 30 + (ring / steps) * 70; const lit = 85 - (ring / steps) * 35
    for (let deg = 0; deg < 360; deg++) {
      const startAngle = (deg - 0.5) * Math.PI / 180; const endAngle = (deg + 1) * Math.PI / 180
      const rgb = hslToRgb(deg, sat, lit)
      ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r + (radius / steps), startAngle, endAngle); ctx.closePath(); ctx.fill()
    }
  }
  ctx.globalCompositeOperation = 'destination-in'; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over'
  if (!pickerPos.value) { if (!picked.value) picked.value = T.neutral; const angle = 40 * Math.PI / 180; const dist = 0.65; pickerPos.value = { x: (50 + dist * 50 * Math.cos(angle)), y: (50 + dist * 50 * Math.sin(angle)) } }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100; const c = (1 - Math.abs(2 * l - 1)) * s; const x = c * (1 - Math.abs((h / 60) % 2 - 1)); const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c } else if (h < 180) { g = c; b = x } else if (h < 240) { g = x; b = c } else if (h < 300) { r = x; b = c } else { r = c; b = x }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

function rgbToHex(r: number, g: number, b: number): string { return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('') }

function pickFromWheel(e: MouseEvent | TouchEvent) {
  const cvs = wheelCanvas.value; if (!cvs) return; const rect = cvs.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX; const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const relX = (clientX - rect.left) / rect.width; const relY = (clientY - rect.top) / rect.height
  const dx = relX - 0.5, dy = relY - 0.5; if (Math.sqrt(dx * dx + dy * dy) > 0.49) return
  const px_x = Math.round(relX * wheelSize); const px_y = Math.round(relY * wheelSize)
  const ctx = cvs.getContext('2d'); if (!ctx) return; const px = ctx.getImageData(px_x, px_y, 1, 1).data; if (px[3] < 128) return
  picked.value = rgbToHex(px[0], px[1], px[2]); pickerPos.value = { x: relX * 100, y: relY * 100 }
}

let dragging = false
function onDown(e: MouseEvent | TouchEvent) { dragging = true; pickFromWheel(e) }
function onMove(e: MouseEvent | TouchEvent) { if (!dragging) return; e.preventDefault(); pickFromWheel(e) }
function onUp() { dragging = false }
function switchTab(t: 'presets' | 'wheel') { tab.value = t; if (t === 'wheel') nextTick(() => drawWheel()) }
function done() { emit('pick', picked.value); emit('close') }
function reset() { picked.value = undefined; pickerPos.value = null }
</script>

<template>
  <div :style="{ position: 'fixed', inset: 0, background: T.bg, zIndex: Z.fullscreenModal, display: 'flex', flexDirection: 'column', overflow: 'auto' }">
    <NavHeader title="Цвет комнаты" back="Назад" @back="emit('close')" />

    <div :style="{ padding: '16px 24px 0', flexShrink: 0 }">
      <div :style="{ width: '100%', maxWidth: '340px', margin: '0 auto', padding: '14px 20px', borderRadius: '14px', background: picked ? `linear-gradient(135deg, ${picked}55, ${picked}22)` : T.card, border: `1px solid ${picked ? picked + '66' : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px', transition: 'all .3s' }">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" :stroke="picked ?? T.textDim" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v5"/><path d="M14.829 15.998a3 3 0 1 1-5.658 0"/><path d="M20.92 14.606A1 1 0 0 1 20 16H4a1 1 0 0 1-.92-1.394l3-7A1 1 0 0 1 7 7h10a1 1 0 0 1 .92.606z"/></svg>
        <div :style="{ fontSize: '15px', fontWeight: 600, color: picked ?? T.textDim }">{{ props.roomName }}</div>
      </div>
      <div :style="{ display: 'flex', width: '100%', maxWidth: '340px', margin: '0 auto', background: T.card, borderRadius: '10px', padding: '3px', marginBottom: '20px', border: `1px solid ${T.border}` }">
        <button v-for="t in (['presets', 'wheel'] as const)" :key="t" :style="{ flex: 1, padding: '8px 0', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: tab === t ? T.neutral + '33' : 'transparent', color: tab === t ? T.text : T.textSec, transition: 'all .2s' }" @click="switchTab(t)">{{ t === 'presets' ? 'Готовые цвета' : 'Свой цвет' }}</button>
      </div>
    </div>

    <div :style="{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }">
      <template v-if="tab === 'presets'">
        <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', justifyItems: 'center', width: '100%', maxWidth: '340px' }">
          <button v-for="p in PRESETS" :key="p.color" :style="{ width: '42px', height: '42px', borderRadius: '50%', background: p.color, border: picked === p.color ? '3px solid #fff' : '2px solid transparent', boxSizing: 'border-box', cursor: 'pointer', boxShadow: picked === p.color ? `0 0 14px ${p.color}55` : 'none', transition: 'all .2s', padding: 0 }" :title="p.name" @click="picked = p.color" />
        </div>
      </template>
      <template v-if="tab === 'wheel'">
        <div :style="{ position: 'relative', width: wheelSize + 'px', height: wheelSize + 'px', borderRadius: '50%', overflow: 'hidden' }">
          <canvas ref="wheelCanvas" :width="wheelSize" :height="wheelSize" :style="{ width: '100%', height: '100%', borderRadius: '50%', touchAction: 'none', display: 'block' }" @mousedown="onDown" @mousemove="onMove" @mouseup="onUp" @mouseleave="onUp" @touchstart.prevent="onDown" @touchmove="onMove" @touchend="onUp" />
          <div v-if="pickerPos && picked" :style="{ position: 'absolute', left: pickerPos.x + '%', top: pickerPos.y + '%', transform: 'translate(-50%, -50%)', width: '44px', height: '44px', borderRadius: '50%', background: picked, border: '3px solid #fff', boxShadow: '0 2px 12px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', transition: 'background .1s' }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ opacity: 0.9 }"><path d="M12 2v5"/><path d="M14.829 15.998a3 3 0 1 1-5.658 0"/><path d="M20.92 14.606A1 1 0 0 1 20 16H4a1 1 0 0 1-.92-1.394l3-7A1 1 0 0 1 7 7h10a1 1 0 0 1 .92.606z"/></svg>
          </div>
        </div>
      </template>
    </div>

    <!-- batch11 #8 v3 (#3): кнопки выше, fontSize 16, fontWeight 500, одинаковый размер -->
    <div :style="{ padding: '16px 24px 28px', maxWidth: '400px', width: '100%', margin: '0 auto', flexShrink: 0 }">
      <button
        :style="{
          width: '100%', padding: '18px',
          background: picked ? T.text : T.border,
          color: picked ? T.bg : T.textDim,
          border: 'none', borderRadius: '10px',
          fontWeight: 500, cursor: 'pointer', fontSize: '16px',
          fontFamily: 'inherit', marginBottom: '8px',
        }"
        @click="done"
      >
        Готово
      </button>
      <button
        v-if="picked"
        :style="{
          width: '100%', padding: '18px',
          background: 'none', border: `1px solid ${T.border}`,
          borderRadius: '10px', color: T.textSec,
          cursor: 'pointer', fontSize: '16px', fontWeight: 500,
          fontFamily: 'inherit',
        }"
        @click="reset"
      >
        Сбросить цвет
      </button>
    </div>
  </div>
</template>
