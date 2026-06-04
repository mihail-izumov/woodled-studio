<script setup lang="ts">
/**
 * ColorPickerModal.vue — Hue-style color picker.
 *
 * batch11 #8 v3 (#3): Кнопки «Готово» и «Сбросить цвет» — выше,
 *   fontSize 16px, fontWeight 500, одинаковый размер текста.
 */

import { ref, computed, nextTick, watch } from 'vue'
import { T, Z } from '../theme/tokens'
import NavHeader from './ui/NavHeader.vue'
import { normalizeHex, wallFinishFromHex } from '../engine/wall-color'
import type { WallFinish } from '../data/rooms'

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
/* Размер «пука»-указателя (диаметр в px). Должен совпадать со стилем
   `width/height: 44px` у соответствующего div ниже. Используется, чтобы
   не выпускать puck за пределы колеса. */
const PUCK_SIZE = 44
/* Максимальное относительное расстояние от центра колеса до центра puck,
   при котором он целиком умещается внутри. radius_wheel − radius_puck,
   выраженное в долях ширины колеса (0..0.5). */
const PUCK_MAX_R = 0.5 - PUCK_SIZE / 2 / wheelSize
const pickerPos = ref<{ x: number; y: number } | null>(null)

/* ────────── HEX input (на вкладке «Свой цвет») ────────── */

/** Сырой ввод HEX (как набрал/вставил пользователь). */
const hexInput = ref<string>(props.current ?? '')
/** Нормализованный HEX или null если ввод невалиден. */
const hexInputNorm = computed<string | null>(() => normalizeHex(hexInput.value))
const hexInputValid = computed<boolean>(() => hexInputNorm.value !== null)
const hexInputBad = computed<boolean>(
  () => hexInput.value.trim().length > 0 && !hexInputValid.value,
)
const hexInputFinish = computed<WallFinish | null>(() =>
  hexInputNorm.value ? wallFinishFromHex(hexInputNorm.value) : null,
)
const WALL_FINISH_LABEL: Record<WallFinish, string> = {
  light: 'светлый тон',
  medium: 'нейтральный тон',
  dark: 'тёмный тон',
}

/** Когда ввод валидный → синхронизируем picked + двигаем puck на колесе. */
watch(hexInputNorm, (norm) => {
  if (!norm) return
  if (norm === picked.value) return
  picked.value = norm
  const pos = wheelPosForHex(norm)
  if (pos) pickerPos.value = pos
})

async function pasteHex() {
  try {
    if (!navigator.clipboard?.readText) return
    const txt = await navigator.clipboard.readText()
    if (txt) hexInput.value = txt.trim()
  } catch {
    /* отказ доступа — глотаем */
  }
}

/* 12 пресетов — реалистичные цвета стен, не акцентная UI-палитра.
   Подобраны под 2026-тренды (тёплые нейтрали, уход от cool grey),
   с равномерным распределением по категориям отражения:
     light (≥0.55):  Бумага, Лён, Холст, Снег
     medium:         Песок, Камень, Туман, Шалфей, Дымка
     dark (≤0.20):   Какао, Графит, Терракота
   Холст #D7D0C2 = Benjamin Moore Edgecomb Gray HC-173 — индустриальный
   эталон универсального greige. */
const PRESETS: { color: string; name: string }[] = [
  // Тёплая шкала: от бумажного к шоколадному
  { color: '#F5F1E8', name: 'Бумага' },
  { color: '#E0D6C4', name: 'Лён' },
  { color: '#D7D0C2', name: 'Холст' },
  { color: '#C0AE96', name: 'Песок' },
  { color: '#8A7F70', name: 'Камень' },
  { color: '#4F4438', name: 'Какао' },
  // Холодная шкала + натуральные акценты
  { color: '#ECECEC', name: 'Снег' },
  { color: '#A8A8A8', name: 'Туман' },
  { color: '#3A3A3A', name: 'Графит' },
  { color: '#8B947E', name: 'Шалфей' },
  { color: '#7A8B98', name: 'Дымка' },
  { color: '#A06B4F', name: 'Терракота' },
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
  // Если puck ещё не позиционирован — ставим его в точку, реально
  // соответствующую picked (а не в фиксированную «декоративную»). Так
  // кружок-указатель окрашен в тот цвет, над которым стоит, а не в
  // случайный hue из дефолта.
  if (!pickerPos.value && picked.value) {
    const pos = wheelPosForHex(picked.value)
    if (pos) pickerPos.value = pos
  }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100; const c = (1 - Math.abs(2 * l - 1)) * s; const x = c * (1 - Math.abs((h / 60) % 2 - 1)); const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c } else if (h < 180) { g = c; b = x } else if (h < 240) { g = x; b = c } else if (h < 300) { r = x; b = c } else { r = c; b = x }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

function rgbToHex(r: number, g: number, b: number): string { return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('') }

/* ────────── HEX → координаты на колесе ──────────
   Колесо в drawWheel — HSL-спираль:
     sat(t) = 30 + 70·t,  lit(t) = 85 − 35·t,  где t = ring/steps ∈ [0..1]
     hue → угол (0° = восток, по часовой).
   Обратное преобразование: берём среднее t из уравнений по sat и по lit,
   clamp в [0..1] (тёмные/насыщенные цвета вне колеса прижимаются к краю).
*/
function hexToHsl(hex: string): [number, number, number] | null {
  const norm = normalizeHex(hex); if (!norm) return null
  const r = parseInt(norm.slice(1, 3), 16) / 255
  const g = parseInt(norm.slice(3, 5), 16) / 255
  const b = parseInt(norm.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
    else if (max === g) h = ((b - r) / d + 2)
    else h = ((r - g) / d + 4)
    h *= 60
  }
  return [h, s * 100, l * 100]
}
function wheelPosForHex(hex: string): { x: number; y: number } | null {
  const hsl = hexToHsl(hex); if (!hsl) return null
  const [h, s, l] = hsl
  const tSat = (s - 30) / 70
  const tLit = (85 - l) / 35
  // t — доля от радиуса колеса (0 = центр, 1 = внешний край). Клампим до
  // PUCK_MAX_R*2, чтобы puck (44px) умещался внутри колеса полностью,
  // а не наполовину торчал наружу.
  const tMax = PUCK_MAX_R * 2 // потому что t масштабируется на 50% (полуширина)
  const t = Math.max(0, Math.min(tMax, (tSat + tLit) / 2))
  const a = (h * Math.PI) / 180
  return { x: 50 + 50 * t * Math.cos(a), y: 50 + 50 * t * Math.sin(a) }
}

function pickFromWheel(e: MouseEvent | TouchEvent) {
  const cvs = wheelCanvas.value; if (!cvs) return; const rect = cvs.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX; const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const relX = (clientX - rect.left) / rect.width; const relY = (clientY - rect.top) / rect.height
  const dx = relX - 0.5, dy = relY - 0.5; if (Math.sqrt(dx * dx + dy * dy) > 0.49) return
  // Цвет берём из точки тапа (как и раньше) — пиксель колеса.
  const px_x = Math.round(relX * wheelSize); const px_y = Math.round(relY * wheelSize)
  const ctx = cvs.getContext('2d'); if (!ctx) return; const px = ctx.getImageData(px_x, px_y, 1, 1).data; if (px[3] < 128) return
  const hex = rgbToHex(px[0], px[1], px[2])
  picked.value = hex; hexInput.value = hex
  // А вот позицию puck клампим в окружность радиуса PUCK_MAX_R от центра,
  // чтобы кружок-указатель целиком оставался внутри колеса. Цвет при
  // этом — точный пиксель тапа, поэтому при тапе у самого края puck
  // визуально «сел» чуть ближе к центру, но окрашен в тот цвет, который
  // пользователь подтвердил тапом.
  const r = Math.sqrt(dx * dx + dy * dy)
  let posX = relX, posY = relY
  if (r > PUCK_MAX_R) {
    const k = PUCK_MAX_R / r
    posX = 0.5 + dx * k
    posY = 0.5 + dy * k
  }
  pickerPos.value = { x: posX * 100, y: posY * 100 }
}

let dragging = false
function onDown(e: MouseEvent | TouchEvent) { dragging = true; pickFromWheel(e) }
function onMove(e: MouseEvent | TouchEvent) { if (!dragging) return; e.preventDefault(); pickFromWheel(e) }
function onUp() { dragging = false }
function switchTab(t: 'presets' | 'wheel') { tab.value = t; if (t === 'wheel') nextTick(() => drawWheel()) }
function done() {
  // На выходе всегда отдаём нормализованный HEX или undefined.
  const out = picked.value ? (normalizeHex(picked.value) ?? picked.value) : undefined
  emit('pick', out); emit('close')
}
function reset() {
  picked.value = undefined; pickerPos.value = null; hexInput.value = ''
}
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
          <button v-for="p in PRESETS" :key="p.color" :style="{ width: '42px', height: '42px', borderRadius: '50%', background: p.color, border: picked === p.color ? '3px solid #fff' : '2px solid transparent', boxSizing: 'border-box', cursor: 'pointer', boxShadow: picked === p.color ? `0 0 14px ${p.color}55` : 'none', transition: 'all .2s', padding: 0 }" :title="p.name" @click="picked = p.color; hexInput = p.color; pickerPos = wheelPosForHex(p.color)" />
        </div>
      </template>
      <template v-if="tab === 'wheel'">
        <div :style="{ position: 'relative', width: wheelSize + 'px', height: wheelSize + 'px', borderRadius: '50%', overflow: 'hidden' }">
          <canvas ref="wheelCanvas" :width="wheelSize" :height="wheelSize" :style="{ width: '100%', height: '100%', borderRadius: '50%', touchAction: 'none', display: 'block' }" @mousedown="onDown" @mousemove="onMove" @mouseup="onUp" @mouseleave="onUp" @touchstart.prevent="onDown" @touchmove="onMove" @touchend="onUp" />
          <div v-if="pickerPos && picked" :style="{ position: 'absolute', left: pickerPos.x + '%', top: pickerPos.y + '%', transform: 'translate(-50%, -50%)', width: '44px', height: '44px', borderRadius: '50%', background: picked, border: '3px solid #fff', boxShadow: '0 2px 12px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', transition: 'background .1s' }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ opacity: 0.9 }"><path d="M12 2v5"/><path d="M14.829 15.998a3 3 0 1 1-5.658 0"/><path d="M20.92 14.606A1 1 0 0 1 20 16H4a1 1 0 0 1-.92-1.394l3-7A1 1 0 0 1 7 7h10a1 1 0 0 1 .92.606z"/></svg>
          </div>
        </div>

        <!-- HEX-input под колесом. Принимает с # и без, короткий #abc, alpha
             игнорируется. «Вставить» — clipboard для скопированных из Pinterest
             / Figma. При валидном HEX — picked и puck синхронизируются. -->
        <div :style="{ width: '100%', maxWidth: '340px', marginTop: '20px' }">
          <div :style="{ display: 'flex', gap: '8px', alignItems: 'center' }">
            <div
              :style="{
                width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                background: hexInputValid ? hexInputNorm : 'transparent',
                border: hexInputValid ? `1px solid ${T.border}` : `1px dashed ${T.border}`,
              }"
              aria-hidden="true"
            />
            <input
              v-model="hexInput"
              type="text"
              inputmode="text"
              autocapitalize="characters"
              autocomplete="off"
              spellcheck="false"
              placeholder="#E8E0D4 или E8E0D4"
              :style="{
                flex: 1, minWidth: 0,
                background: T.bg,
                border: hexInputBad ? `1px solid ${T.red}66` : `1px solid ${T.border}`,
                borderRadius: '8px',
                padding: '10px 12px',
                color: T.text,
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
              }"
            />
            <button
              type="button"
              :style="{
                background: T.bg,
                border: `1px solid ${T.border}`,
                borderRadius: '8px',
                padding: '10px 12px',
                color: T.text,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
              }"
              @click="pasteHex"
            >Вставить</button>
          </div>
          <div :style="{ marginTop: '8px', minHeight: '18px', fontSize: '12px', lineHeight: 1.4 }">
            <span v-if="hexInputBad" :style="{ color: T.red }">Не похоже на HEX. Пример: #E8E0D4</span>
            <span v-else-if="hexInputValid" :style="{ color: T.textSec }">
              Распознан как <span :style="{ color: T.text, fontWeight: 600 }">{{ WALL_FINISH_LABEL[hexInputFinish!] }}</span>
            </span>
            <span v-else :style="{ color: T.textDim }">Введите или вставьте HEX — система определит категорию.</span>
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
