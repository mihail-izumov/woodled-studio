<script setup lang="ts">
/**
 * HouseStats.vue — Виджет дома (приборная панель).
 *
 * batch11 #6 (#1):
 *   Адаптивный размер шрифта цифр. Считаем длину самого длинного значения
 *   и выбираем единый размер для всех трёх блоков:
 *     ≤ 4 chars → 28px
 *     5–6 chars → 22px
 *     ≥ 7 chars → 18px
 *   «X/Y» в блоке света — вторая часть масштабируется ×0.5 от основной.
 */

import { computed, onMounted, ref } from 'vue'
import { T } from '../theme/tokens'
import { useConfigurator } from '../store/configurator'
import { getRT, type Room } from '../data/rooms'
import { getArea } from '../engine/brightness'

type FieldId = 'area' | 'ceiling' | 'light'

const cfg = useConfigurator()

const emit = defineEmits<{
  shareLink: []
  changeHome: []
}>()

function parseRange(s: string): [number, number] {
  const parts = s.split(/[–\-]/).map((x) => parseInt(x.trim()))
  if (parts.length === 1 || isNaN(parts[1])) return [parts[0], parts[0]]
  return [parts[0], parts[1]]
}

const totalAreaDisplay = computed<string | null>(() => {
  if (cfg.rooms.length === 0) return null
  let sumMin = 0
  let sumMax = 0
  for (const r of cfg.rooms) {
    const rt = getRT(r.typeId)
    if (r.sizeIndex === 3) {
      const a = r.customArea ?? rt.sizes[2]
      sumMin += a
      sumMax += a
    } else {
      const [mn, mx] = parseRange(rt.ranges[r.sizeIndex])
      sumMin += mn
      sumMax += mx
    }
  }
  if (sumMin === sumMax) return String(sumMin)
  return `${sumMin}–${sumMax}`
})

const ceilingDisplay = computed<string | null>(() => {
  if (cfg.rooms.length === 0) return null
  const heights = [...new Set(cfg.rooms.map((r) => r.ceilingH))].sort(
    (a, b) => a - b,
  )
  if (heights.length === 1) return heights[0].toFixed(1)
  return `${heights[0].toFixed(1)}–${heights[heights.length - 1].toFixed(1)}`
})

const lightPoints = computed<{ used: number; max: number } | null>(() => {
  if (cfg.rooms.length === 0) return null
  let used = 0
  let max = 0
  for (const r of cfg.rooms) {
    const rt = getRT(r.typeId)
    const limits = (r.limits && Object.keys(r.limits).length > 0)
      ? r.limits
      : rt.limits
    for (const z of rt.zones) {
      max += limits[z] ?? 0
    }
    for (const fx of r.fixtures) {
      used += fx.q ?? 1
    }
  }
  return { used, max }
})

const hasAnyFixtures = computed(() =>
  cfg.rooms.some((r) => r.fixtures.length > 0),
)

const isEmpty = computed(() => cfg.rooms.length === 0)

/* batch11 #6: адаптивный единый шрифт для трёх цифр. */
const adaptiveMain = computed<string>(() => {
  if (isEmpty.value) return '28px'
  const aLen = (totalAreaDisplay.value ?? '—').length
  const cLen = (ceilingDisplay.value ?? '—').length
  let lLen = 1
  if (lightPoints.value && hasAnyFixtures.value) {
    lLen = String(lightPoints.value.used).length + 1 + String(lightPoints.value.max).length
  }
  const max = Math.max(aLen, cLen, lLen)
  if (max <= 4) return '28px'
  if (max <= 6) return '22px'
  return '18px'
})

/** Вторичный шрифт «/Y» — половина основного. */
const adaptiveSec = computed<string>(() => {
  const main = parseInt(adaptiveMain.value)
  return Math.round(main * 0.5) + 'px'
})

interface RoomBreakdownAll {
  id: string
  name: string
  area: number
  ceiling: number
  fxCount: number
  pointsMax: number
}

const roomsAll = computed<RoomBreakdownAll[]>(() =>
  cfg.rooms.map((r) => {
    const rt = getRT(r.typeId)
    const limits = (r.limits && Object.keys(r.limits).length > 0)
      ? r.limits
      : rt.limits
    let pointsMax = 0
    for (const z of rt.zones) pointsMax += limits[z] ?? 0
    let fxCount = 0
    for (const fx of r.fixtures) fxCount += fx.q ?? 1
    return {
      id: r.id,
      name: r.customName || rt.name,
      area: Math.round(getArea(rt, r as Room)),
      ceiling: r.ceilingH,
      fxCount,
      pointsMax,
    }
  }),
)

const roomsByArea = computed(() =>
  cfg.rooms.map((r) => {
    const rt = getRT(r.typeId)
    const raw = r.sizeIndex ?? 1
    const idx = (raw >= 0 && raw <= 2 ? raw : 1) as 0 | 1 | 2
    const display = (r.sizeIndex === 3 && r.customArea != null)
      ? `${r.customArea} м²`
      : `${rt.ranges[idx]} м²`
    return { id: r.id, name: r.customName || rt.name, display }
  }),
)

const roomsByCeiling = computed(() =>
  cfg.rooms.map((r) => ({
    id: r.id,
    name: r.customName || getRT(r.typeId).name,
    ceiling: r.ceilingH,
  })),
)

const roomsByLight = computed(() =>
  cfg.rooms.map((r) => {
    const rt = getRT(r.typeId)
    const limits = (r.limits && Object.keys(r.limits).length > 0)
      ? r.limits
      : rt.limits
    let pointsMax = 0
    for (const z of rt.zones) pointsMax += limits[z] ?? 0
    let fxCount = 0
    for (const fx of r.fixtures) fxCount += fx.q ?? 1
    return { id: r.id, name: r.customName || rt.name, fxCount, pointsMax }
  }),
)

const expanded = ref(false)
const focusField = ref<FieldId | null>(null)

function toggleExpand(field: FieldId | null = null) {
  if (focusField.value === field && expanded.value) {
    expanded.value = false
    focusField.value = null
  } else {
    expanded.value = true
    focusField.value = field
  }
  if (!cfg.dashboardTourSeen.value) {
    cfg.markDashboardTourSeen()
  }
}

const tourActive = ref(false)
const tourStep = ref<0 | 1 | 2>(0)

const TOUR_FIELDS: { id: FieldId; title: string; text: string }[] = [
  { id: 'area', title: 'S комнат', text: 'Сумма площадей всех комнат вашего плана. Меняется при добавлении новой или изменении размера.' },
  { id: 'ceiling', title: 'Потолок', text: 'Высота потолков. Чем выше — тем больше люмен нужно для комфортного света.' },
  { id: 'light', title: 'Свет', text: 'Светильников установлено / точек подключения. Чем больше точек — тем гибче можно расставлять свет.' },
]

function startTour() { tourActive.value = true; tourStep.value = 0 }
function nextTourStep() { if (tourStep.value < 2) { tourStep.value = (tourStep.value + 1) as 0 | 1 | 2 } else { finishTour() } }
function finishTour() { tourActive.value = false; cfg.markDashboardTourSeen() }

onMounted(() => {
  if (!cfg.dashboardTourSeen.value && cfg.rooms.length > 0) {
    setTimeout(() => { if (!cfg.dashboardTourSeen.value) startTour() }, 600)
  }
})

const fieldToast = ref<string | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showFieldToast(field: FieldId) {
  const t = TOUR_FIELDS.find((x) => x.id === field)
  if (!t) return
  fieldToast.value = t.text
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { fieldToast.value = null }, 4500)
}

function onFieldTap(field: FieldId) { if (tourActive.value) return; showFieldToast(field); toggleExpand(field) }
function onWidgetTap() {
  if (tourActive.value) return
  if (expanded.value && focusField.value === null) { expanded.value = false; focusField.value = null }
  else { toggleExpand(null) }
}
function dismissHint() { if (!cfg.dashboardTourSeen.value) cfg.markDashboardTourSeen() }
function onShareClick() { emit('shareLink') }
function onChangeHomeClick() { emit('changeHome') }

const PANEL_BG = '#EAE0CA'
const PANEL_FG = T.bg
const PANEL_FG_SEC = T.cardAlt
const PANEL_PASSIVE_BG = 'rgba(19,17,14,0.07)'
const PANEL_DIVIDER = 'rgba(19,17,14,0.10)'
const PANEL_FIELD_ACTIVE = '#FFFFFF'
const PANEL_BTN_BG = 'rgba(19,17,14,0.12)'

const tourCurrentField = computed<FieldId>(() => TOUR_FIELDS[tourStep.value].id)
const tourCurrentText = computed(() => TOUR_FIELDS[tourStep.value])

function fieldStyle(field: FieldId) {
  const isFocused = expanded.value && focusField.value === field
  const isTourField = tourActive.value && tourCurrentField.value === field
  const isDimmed = tourActive.value && !isTourField
  let bg: string = PANEL_PASSIVE_BG
  if (isFocused || isTourField) bg = PANEL_FIELD_ACTIVE
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '8px 0',
    borderRadius: '8px',
    background: bg,
    opacity: isDimmed ? 0.3 : 1,
    transition: 'all .3s',
    cursor: isEmpty.value ? 'default' : 'pointer',
  }
}
</script>

<template>
  <div :style="{ position: 'relative' }">
    <div
      :style="{
        background: PANEL_BG, borderRadius: '14px', padding: '6px',
        marginBottom: '8px', cursor: isEmpty ? 'default' : 'pointer',
        position: 'relative', zIndex: tourActive ? 60 : 1,
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: '6px',
      }"
      @click.self="onWidgetTap"
    >
      <div :style="{ display: 'flex', alignItems: 'stretch', gap: '6px' }">
        <div :style="fieldStyle('area')" @click.stop="onFieldTap('area')">
          <div :style="{ fontSize: '9px', fontWeight: 700, color: PANEL_FG_SEC, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }">S комнат</div>
          <!-- batch11 #6 (#1): адаптивный шрифт -->
          <div :style="{ fontSize: adaptiveMain, fontWeight: 800, color: isEmpty ? PANEL_FG_SEC : PANEL_FG, fontVariantNumeric: 'tabular-nums', lineHeight: 1, whiteSpace: 'nowrap' }">
            {{ totalAreaDisplay ?? '—' }}
          </div>
          <div :style="{ fontSize: '11px', color: PANEL_FG_SEC, opacity: 0.7 }">м²</div>
        </div>

        <div :style="fieldStyle('ceiling')" @click.stop="onFieldTap('ceiling')">
          <div :style="{ fontSize: '9px', fontWeight: 700, color: PANEL_FG_SEC, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }">потолок</div>
          <div :style="{ fontSize: adaptiveMain, fontWeight: 800, color: isEmpty ? PANEL_FG_SEC : PANEL_FG, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }">
            {{ ceilingDisplay ?? '—' }}
          </div>
          <div :style="{ fontSize: '11px', color: PANEL_FG_SEC, opacity: 0.7 }">м</div>
        </div>

        <div :style="fieldStyle('light')" @click.stop="onFieldTap('light')">
          <div :style="{ fontSize: '9px', fontWeight: 700, color: PANEL_FG_SEC, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }">свет</div>
          <div :style="{ fontSize: adaptiveMain, fontWeight: 800, color: isEmpty ? PANEL_FG_SEC : PANEL_FG, fontVariantNumeric: 'tabular-nums', lineHeight: 1, display: 'flex', alignItems: 'baseline' }">
            <template v-if="lightPoints && hasAnyFixtures">
              <span>{{ lightPoints.used }}</span>
              <span :style="{ fontSize: adaptiveSec, color: PANEL_FG_SEC, fontWeight: 500, opacity: 0.55 }">/{{ lightPoints.max }}</span>
            </template>
            <template v-else>—</template>
          </div>
          <div :style="{ fontSize: '11px', color: PANEL_FG_SEC, opacity: 0.7 }">точек</div>
        </div>
      </div>

      <div :style="{ display: 'flex', gap: '6px' }">
        <button :style="{ flex: 1, padding: '10px 6px', background: PANEL_BTN_BG, border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: PANEL_FG, fontFamily: 'inherit' }" @click.stop="onShareClick">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Поделиться
        </button>
        <button :style="{ flex: 1, padding: '10px 6px', background: PANEL_BTN_BG, border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: PANEL_FG, fontFamily: 'inherit' }" @click.stop="onChangeHomeClick">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 10a8 8 0 1 1 8 8H4" />
            <path d="m8 22-4-4 4-4" />
          </svg>
          Сбросить
        </button>
      </div>
    </div>

    <div v-if="!cfg.dashboardTourSeen.value && !isEmpty && !expanded && !tourActive" :style="{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: T.neutral + '10', borderRadius: '8px', marginBottom: '8px', fontSize: '11px', color: T.textSec }">
      <span :style="{ flex: 1 }">Тапните на параметр для деталей →</span>
      <button :style="{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer', padding: '2px 6px', fontSize: '14px', lineHeight: 1 }" @click="dismissHint">✕</button>
    </div>

    <div v-if="expanded && !isEmpty" :style="{ background: PANEL_BG, borderRadius: '12px', padding: '6px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }">
      <div v-if="focusField" :style="{ background: PANEL_FIELD_ACTIVE, borderRadius: '8px', padding: '12px 14px' }">
        <div :style="{ fontSize: '10px', fontWeight: 700, color: PANEL_FG, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px', opacity: 0.7 }">{{ TOUR_FIELDS.find(f => f.id === focusField)?.title }}</div>
        <div :style="{ fontSize: '12px', color: PANEL_FG, lineHeight: 1.5 }">{{ TOUR_FIELDS.find(f => f.id === focusField)?.text }}</div>
      </div>

      <div :style="{ background: PANEL_FIELD_ACTIVE, borderRadius: '8px', padding: '12px 14px' }">
        <div :style="{ fontSize: '10px', fontWeight: 700, color: PANEL_FG, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px', opacity: 0.7 }">по комнатам</div>

        <template v-if="focusField === null">
          <div v-for="(r, i) in roomsAll" :key="r.id" :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', fontSize: '13px', color: PANEL_FG, borderBottom: i < roomsAll.length - 1 ? `1px solid ${PANEL_DIVIDER}` : 'none', gap: '12px' }">
            <span :style="{ flexShrink: 0 }">{{ r.name }}</span>
            <span :style="{ color: PANEL_FG_SEC, fontVariantNumeric: 'tabular-nums', fontSize: '12px', textAlign: 'right' }">{{ r.area }} м² · {{ r.ceiling.toFixed(1) }} м · {{ r.fxCount }}/{{ r.pointsMax }}</span>
          </div>
        </template>
        <template v-else-if="focusField === 'area'">
          <div v-for="(r, i) in roomsByArea" :key="r.id" :style="{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', color: PANEL_FG, borderBottom: i < roomsByArea.length - 1 ? `1px solid ${PANEL_DIVIDER}` : 'none' }">
            <span>{{ r.name }}</span>
            <span :style="{ color: PANEL_FG_SEC, fontVariantNumeric: 'tabular-nums' }">{{ r.display }}</span>
          </div>
        </template>
        <template v-else-if="focusField === 'ceiling'">
          <div v-for="(r, i) in roomsByCeiling" :key="r.id" :style="{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', color: PANEL_FG, borderBottom: i < roomsByCeiling.length - 1 ? `1px solid ${PANEL_DIVIDER}` : 'none' }">
            <span>{{ r.name }}</span>
            <span :style="{ color: PANEL_FG_SEC, fontVariantNumeric: 'tabular-nums' }">{{ r.ceiling.toFixed(1) }} м</span>
          </div>
        </template>
        <template v-else-if="focusField === 'light'">
          <div v-for="(r, i) in roomsByLight" :key="r.id" :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', fontSize: '13px', color: PANEL_FG, borderBottom: i < roomsByLight.length - 1 ? `1px solid ${PANEL_DIVIDER}` : 'none', gap: '8px' }">
            <span>{{ r.name }}</span>
            <span :style="{ color: PANEL_FG_SEC, fontVariantNumeric: 'tabular-nums', fontSize: '12px' }">{{ r.fxCount }} <span :style="{ opacity: 0.6 }">из</span> {{ r.pointsMax }} точек</span>
          </div>
        </template>
      </div>
    </div>

    <div v-if="fieldToast && !expanded" :style="{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: T.text, color: T.bg, padding: '12px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: 500, lineHeight: 1.5, zIndex: 95, maxWidth: '85%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,.4)' }">
      {{ fieldToast }}
    </div>

    <div v-if="tourActive" :style="{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 55 }" @click="finishTour" />
    <div v-if="tourActive" :style="{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: '420px', background: T.card, border: `1px solid ${T.neutral}33`, borderRadius: '14px', padding: '18px 20px', zIndex: 65, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }">
      <div :style="{ display: 'flex', gap: '4px', marginBottom: '12px' }">
        <div v-for="(_, i) in TOUR_FIELDS" :key="i" :style="{ height: '3px', borderRadius: '2px', flex: i === tourStep ? 2 : 1, background: i === tourStep ? T.neutral : T.border, transition: 'all .3s' }" />
      </div>
      <div :style="{ fontSize: '10px', fontWeight: 700, color: T.neutral, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }">{{ tourCurrentText.title }}</div>
      <div :style="{ fontSize: '14px', color: T.text, lineHeight: 1.55, marginBottom: '16px' }">{{ tourCurrentText.text }}</div>
      <div :style="{ display: 'flex', gap: '8px' }">
        <button :style="{ flex: 1, padding: '10px', background: 'none', border: `1px solid ${T.border}`, color: T.textSec, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }" @click="finishTour">Пропустить</button>
        <button :style="{ flex: 1, padding: '10px', background: T.neutral, color: T.bg, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit' }" @click="nextTourStep">{{ tourStep < 2 ? 'Дальше' : 'Готово' }}</button>
      </div>
    </div>
  </div>
</template>
