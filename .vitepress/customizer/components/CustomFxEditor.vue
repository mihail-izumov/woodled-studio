<script setup lang="ts">
/**
 * CustomFxEditor.vue — Страница «Другой бренд» (не WOODLED).
 *
 * Параллель FxEditor.vue: тот же NavHeader сверху, тот же sticky-bottom,
 * та же модалка «Удалить?» и LeaveConfirmModal при выходе с правками.
 * Mobile-first, инлайн-стили (no CSS classes кроме псевдо).
 *
 * Поля формы → CustomSpec (data/catalog.ts). При save отдаём Fixture
 * c обновлённой custom-спекой. Регистрацию в MD/FX_FACTORS делает
 * store.updateFixture / store.addFixture через registerCustom().
 *
 * Расчёт яркости совпадает с brightness.ts/fxLm:
 *   lmPer × lamps × body × ambient
 * (diff и q учитывает движок; здесь q=1, diff=отсутствует у кастома).
 */

import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { T, Z } from '../theme/tokens'
import type { Fixture, CustomSpec, FxType, ZoneId } from '../data/catalog'
import NavHeader from './ui/NavHeader.vue'
import LeaveConfirmModal from './ui/LeaveConfirmModal.vue'
import { useConfigurator } from '../store/configurator'

/* ──────────────── Props/Emits ──────────────── */

interface Props {
  item: Fixture
  backLabel?: string
  roomName?: string
  roomTint?: string
  isProvisional?: boolean
  /** Стартовая зона при создании нового (определяется кнопкой «+» в ZoneCard). */
  initialZone?: ZoneId
}
const props = withDefaults(defineProps<Props>(), {
  backLabel: 'Назад',
  roomName: '',
  roomTint: T.neutral,
  isProvisional: false,
  initialZone: 'wall',
})
const emit = defineEmits<{
  save: [fx: Fixture]
  delete: []
  close: []
  feedback: [msg: string]
}>()

const cfg = useConfigurator()

/* ──────────────── Справочники (синхронны с sandbox-прототипом) ──────────────── */

const NAME_MAX = 16
const BRAND_MAX = 18
const EMPTY_BRAND = 'Свой'

const TINTS = [
  { id: 'oak',       label: 'Дуб',           hex: '#C4A46C', nearestWood: 'oak'    },
  { id: 'walnut',    label: 'Орех',          hex: '#8B6242', nearestWood: 'walnut' },
  { id: 'black_oak', label: 'Чёрный дуб',    hex: '#5A4E42', nearestWood: 'black'  },
  { id: 'brass',     label: 'Латунь',        hex: '#B8945A', nearestWood: 'oak'    },
  { id: 'white',     label: 'Белый',         hex: '#F0EBE0', nearestWood: 'oak'    },
  { id: 'chrome',    label: 'Хром',          hex: '#C9CDD2', nearestWood: 'oak'    },
  { id: 'nickel',    label: 'Никель',        hex: '#9CA0A4', nearestWood: 'black'  },
  { id: 'bronze',    label: 'Бронза',        hex: '#4A3528', nearestWood: 'walnut' },
  { id: 'graphite',  label: 'Графит',        hex: '#3A3736', nearestWood: 'black'  },
  { id: 'warm_gray', label: 'Тёплый серый',  hex: '#8A7E70', nearestWood: 'walnut' },
] as const

interface FxTypeOpt { id: FxType; label: string; zone: ZoneId | null }
const FX_TYPES: readonly FxTypeOpt[] = [
  { id: 'люстра',     label: 'Люстра',     zone: 'ceiling' },
  { id: 'спот',       label: 'Спот',       zone: null }, // потолок/стена — выбирается
  { id: 'бра',        label: 'Бра',        zone: 'wall' },
  { id: 'настольная', label: 'Настольная', zone: 'table' },
  { id: 'торшер',     label: 'Торшер',     zone: 'floor' },
] as const

const SPOT_PLACES = [
  { id: 'ceiling' as ZoneId, label: 'Потолок' },
  { id: 'wall' as ZoneId,    label: 'Стена'   },
] as const

const SIZES = [
  { id: 'малая',    label: 'Малая',    sqMin: 4,  sqMax: 8  },
  { id: 'средняя',  label: 'Средняя',  sqMin: 8,  sqMax: 12 },
  { id: 'большая',  label: 'Большая',  sqMin: 12, sqMax: 16 },
  { id: 'огромная', label: 'Огромная', sqMin: 15, sqMax: 22 },
] as const

interface SocketOpt {
  id: string; label: string; kind: 'bulb' | 'led' | 'tape';
  watts?: number[]; wPerM?: number[]; lmPerW: number;
}
const SOCKETS: readonly SocketOpt[] = [
  { id: 'E27',  label: 'E27 — груша / шар',    kind: 'bulb',
    watts: [3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,20,22,25,28,30,35,40,50], lmPerW: 100 },
  { id: 'E14',  label: 'E14 — миньон / свеча', kind: 'bulb',
    watts: [3,4,5,6,7,8,9,10,11,12], lmPerW: 90 },
  { id: 'GX53', label: 'GX53 — таблетка',      kind: 'bulb',
    watts: [4,6,7,9,12,15,18], lmPerW: 85 },
  { id: 'GU10', label: 'GU10 — споттер',       kind: 'bulb',
    watts: [3,5,6,7,8,10,12], lmPerW: 70 },
  { id: 'G9',   label: 'G9 — капсула',         kind: 'bulb',
    watts: [2,3,4,5,6,7,9], lmPerW: 95 },
  { id: 'LED',  label: 'Встроенный LED',       kind: 'led',
    watts: [5,8,10,12,15,18,20,25,30,35,40,50,60,80,100], lmPerW: 110 },
  { id: 'TAPE', label: 'LED-лента',            kind: 'tape',
    wPerM: [4.8,7.2,9.6,14.4,19.2,24], lmPerW: 100 },
] as const

const TEMPS = [
  { id: '2700', label: '2700K', hint: 'тёплый'  },
  { id: '3000', label: '3000K', hint: 'нейтр.'  },
  { id: '4000', label: '4000K', hint: 'дневной' },
] as const

const BODIES = [
  { id: 'open',    label: 'Открытый', hint: 'без плафона', body: 1.0  },
  { id: 'shade',   label: 'Абажур',   hint: 'ткань, шар',  body: 0.80 },
  { id: 'lamella', label: 'Ламели',   hint: 'плотные',     body: 0.60 },
] as const

const AMBIENT_BY_TYPE: Record<FxType, number> = {
  'люстра':     1.0,
  'спот':       0.85,
  'бра':        0.70,
  'настольная': 0.55,
  'торшер':     0.85,
}

/* ──────────────── Утилиты ──────────────── */

function hexToRgb(h: string) {
  const s = h.replace('#', '')
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  }
}
function relLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const a = [r, g, b].map((v) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
}
function orbBorder(hex: string): string {
  const L = relLuminance(hex)
  if (L < 0.18) return '1px solid rgba(19,17,14,0.55)'
  if (L > 0.75) return '1px solid rgba(0,0,0,0.18)'
  return '1px solid rgba(255,255,255,0.06)'
}
function orbBg(hex: string): string {
  return `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.55), transparent 42%), radial-gradient(circle at 70% 78%, rgba(0,0,0,0.22), transparent 60%), ${hex}`
}

/* ──────────────── Local state (источник правды формы) ──────────────── */

const c = props.item.custom

const name      = ref<string>(c?.name ?? '')
const url       = ref<string>(c?.url ?? '')
const brand     = ref<string>(c?.brand ?? '')
const type      = ref<FxType>(c?.type ?? (props.initialZone === 'ceiling' ? 'люстра'
                              : props.initialZone === 'floor' ? 'торшер'
                              : props.initialZone === 'table' ? 'настольная'
                              : 'бра'))
const spotPlace = ref<ZoneId>((c?.zone === 'wall' || c?.zone === 'ceiling') ? c.zone
                              : (props.initialZone === 'wall' ? 'wall' : 'ceiling'))
const size      = ref<string>(c?.chip || 'средняя')
const source    = ref<string>(c?.source === 'led' ? 'LED'
                              : c?.source === 'tape' ? 'TAPE'
                              : (c?.socket ?? 'E14'))
const lamps     = ref<number>(c?.lamps ?? 2)
const wattMap   = ref<Record<string, number>>(
  { E27: 11, E14: 9, GX53: 9, GU10: 7, G9: 5, LED: 20 },
)
const tapeW     = ref<number>(9.6)
const tapeLen   = ref<number>(5)
const manualLm  = ref<boolean>(false)
const customLm  = ref<number>(0)
const temp      = ref<string>(c?.btemp ?? '2700')
const bodyId    = ref<string>(
  (c && BODIES.find((b) => b.body === c.body)?.id) || 'shade',
)
const tintId    = ref<string>(c?.tint?.id ?? 'oak')

// Если редактируем существующий — попробуем восстановить мощность из lmPer.
if (c) {
  const s = SOCKETS.find((s) => s.id === source.value)
  if (s?.kind === 'bulb' && s.watts) {
    const guess = Math.round(c.lmPer / s.lmPerW)
    const closest = s.watts.reduce((a, b) =>
      Math.abs(b - guess) < Math.abs(a - guess) ? b : a,
    )
    wattMap.value[s.id] = closest
  } else if (s?.kind === 'led' && s.watts) {
    const guess = Math.round(c.lmPer / s.lmPerW)
    const closest = s.watts.reduce((a, b) =>
      Math.abs(b - guess) < Math.abs(a - guess) ? b : a,
    )
    wattMap.value.LED = closest
  }
}

const pasteState = ref<'' | 'ok' | 'fail'>('')
const showDelConfirm = ref(false)
const showLeaveConfirm = ref(false)

/* ──────────────── Вычисленные значения ──────────────── */

const socketObj = computed(() =>
  SOCKETS.find((s) => s.id === source.value) ?? SOCKETS[0],
)
const tintObj = computed(() => TINTS.find((t) => t.id === tintId.value) ?? TINTS[0])

const autoLm = computed(() => {
  const s = socketObj.value
  if (s.kind === 'bulb') {
    const w = wattMap.value[s.id] ?? s.watts?.[0] ?? 10
    return Math.round(s.lmPerW * w)
  }
  if (s.kind === 'led') {
    return Math.round(s.lmPerW * (wattMap.value.LED ?? 20))
  }
  return Math.round(s.lmPerW * tapeW.value * tapeLen.value)
})

const lmPer = computed(() => manualLm.value ? customLm.value : autoLm.value)
const effectiveLamps = computed(() => socketObj.value.kind === 'bulb' ? lamps.value : 1)
const bodyVal = computed(() => BODIES.find((b) => b.id === bodyId.value)?.body ?? 1)
const ambientVal = computed(() => AMBIENT_BY_TYPE[type.value] ?? 1)
const totalLm = computed(() =>
  Math.round(lmPer.value * effectiveLamps.value * bodyVal.value * ambientVal.value),
)

const showSize = computed(() => type.value === 'люстра')
const showSpotPlace = computed(() => type.value === 'спот')

function autoName(): string {
  const tl = FX_TYPES.find((t) => t.id === type.value)?.label || type.value
  if (showSize.value) {
    const sl = SIZES.find((s) => s.id === size.value)?.label.toLowerCase() ?? ''
    return sl ? `${sl[0].toUpperCase()}${sl.slice(1)} ${tl.toLowerCase()}` : tl
  }
  return tl
}

const displayName = computed(() => name.value.trim() || autoName())
const displayBrand = computed(() => brand.value.trim() || EMPTY_BRAND)
const canSave = computed(() => lmPer.value > 0 && effectiveLamps.value >= 1)

/* Зона, в которую светильник попадёт (тип → зона; спот → пользователь). */
function resolveZone(): ZoneId {
  if (type.value === 'спот') return spotPlace.value
  const opt = FX_TYPES.find((t) => t.id === type.value)
  return (opt?.zone ?? 'ceiling') as ZoneId
}

function buildSpec(): CustomSpec {
  const sz = SIZES.find((s) => s.id === size.value)
  return {
    name: name.value.trim(),
    brand: brand.value.trim(),
    type: type.value,
    chip: showSize.value ? size.value : '',
    zone: resolveZone(),
    lamps: effectiveLamps.value,
    lmPer: lmPer.value,
    body: bodyVal.value,
    ambient: ambientVal.value,
    btemp: temp.value,
    tint: { id: tintObj.value.id, hex: tintObj.value.hex },
    url: url.value.trim() || undefined,
    source: socketObj.value.kind,
    socket: socketObj.value.kind === 'bulb' ? source.value : undefined,
    sqMin: showSize.value && sz ? sz.sqMin : undefined,
    sqMax: showSize.value && sz ? sz.sqMax : undefined,
  }
}

/* ──────────────── isDirty: было vs сейчас ──────────────── */

const initialSpecSnapshot = c ? JSON.stringify(c) : ''
const currentSpecJson = computed(() => JSON.stringify(buildSpec()))
const isDirty = computed(() =>
  props.isProvisional || currentSpecJson.value !== initialSpecSnapshot,
)

/* ──────────────── Действия ──────────────── */

async function pasteUrl() {
  try {
    const txt = await navigator.clipboard.readText()
    if (txt) {
      url.value = txt.trim().slice(0, 500)
      pasteState.value = 'ok'
    } else {
      pasteState.value = 'fail'
    }
  } catch {
    pasteState.value = 'fail'
  }
  setTimeout(() => { pasteState.value = '' }, 1400)
}

function handleSave() {
  if (!canSave.value) return
  const spec = buildSpec()
  // m обновит store через registerCustom — здесь оставляем существующий.
  const nextFx: Fixture = {
    ...props.item,
    custom: spec,
    wood: tintObj.value.nearestWood as Fixture['wood'],
    zone: spec.zone,
    q: 1,
    l: spec.lamps,
  }
  emit('save', nextFx)
}

function handleDeleteConfirmed() {
  showDelConfirm.value = false
  emit('delete')
}

function tryClose() {
  if (isDirty.value) {
    showLeaveConfirm.value = true
    return
  }
  emit('close')
}
function onLeaveSave() {
  showLeaveConfirm.value = false
  handleSave()
}
function onLeaveDiscard() {
  showLeaveConfirm.value = false
  emit('close')
}

/* ──────────────── Лок скролла + StickyBar/SoundButton ──────────────── */

let prevOverflow = ''
let prevHtmlOverflow = ''
onMounted(() => {
  prevOverflow = document.body.style.overflow
  prevHtmlOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
})
onUnmounted(() => {
  document.body.style.overflow = prevOverflow
  document.documentElement.style.overflow = prevHtmlOverflow
})

/* ──────────────── Динамика: фоллбэк мощности при смене цоколя ──────────────── */

watch(source, () => {
  const s = socketObj.value
  if (s.kind === 'bulb' && s.watts) {
    const cur = wattMap.value[s.id]
    if (!cur || !s.watts.includes(cur)) {
      wattMap.value[s.id] = s.watts[Math.floor(s.watts.length / 2)] ?? s.watts[0]
    }
  }
})

/* ──────────────── i18n helpers ──────────────── */

function lampsWord(n: number): string {
  if (n === 1) return 'лампа'
  if (n >= 2 && n <= 4) return 'лампы'
  return 'ламп'
}
function metersWord(n: number): string {
  if (n === 1) return 'метр'
  if (n >= 2 && n <= 4) return 'метра'
  return 'метров'
}

const accent = computed(() => props.roomTint || T.neutral)
</script>

<template>
  <div :style="{
    position: 'fixed', inset: 0, zIndex: Z.fxPage,
    background: T.bg, color: T.text,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  }">
    <!-- NavHeader -->
    <NavHeader
      :title="displayName"
      :back="props.backLabel"
      @back="tryClose"
    />

    <!-- Превью карточки в комнате (mini ZoneCard row) -->
    <div :style="{
      flexShrink: 0,
      padding: '10px 16px',
      background: T.cardAlt,
      borderBottom: `1px solid ${T.border}`,
    }">
      <div :style="{
        fontSize: '10px', color: T.textDim, marginBottom: '6px',
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }">
        так будет выглядеть в комнате
      </div>
      <div :style="{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 10px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.04)',
      }">
        <span :style="{
          width: '14px', height: '14px', borderRadius: '50%',
          flexShrink: 0, display: 'inline-block',
          background: orbBg(tintObj.hex),
          border: orbBorder(tintObj.hex),
          boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.22), inset 0 1px 1px rgba(255,255,255,0.18), 0 1px 3px rgba(0,0,0,0.4)',
        }" />
        <span :style="{
          flex: 1, display: 'flex', flexDirection: 'column',
          lineHeight: 1.15, minWidth: 0,
        }">
          <span :style="{
            fontSize: '14px', fontWeight: 600, color: T.text,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }">{{ FX_TYPES.find((t) => t.id === type)?.label }}</span>
          <span :style="{
            fontSize: '10px', fontWeight: 700, color: accent,
            textTransform: 'uppercase', letterSpacing: '0.6px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }">{{ displayBrand }}</span>
        </span>
        <span v-if="showSize" :style="{
          padding: '2px 8px', borderRadius: '6px',
          background: accent + '22',
          fontSize: '11px', fontWeight: 600, color: accent,
        }">{{ size }}</span>
      </div>
    </div>

    <!-- Scroll body -->
    <div class="customfx-scroll" :style="{
      flex: 1, overflowY: 'auto',
      padding: '14px 16px 16px',
      WebkitOverflowScrolling: 'touch',
      maxWidth: '560px', width: '100%',
      margin: '0 auto',
    }">
      <!-- Вводная (ToV: спокойно, по делу) -->
      <div :style="{
        padding: '10px 12px', marginBottom: '14px',
        background: T.neutral + '11',
        border: `1px solid ${T.neutral}33`,
        borderRadius: '10px',
        fontSize: '12px', color: T.textSec, lineHeight: 1.4,
      }">
        Учтём в общей яркости комнаты.
      </div>

      <!-- Название -->
      <div :style="{ marginBottom: '14px' }">
        <div :style="{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: '8px', padding: '0 2px',
        }">
          <span :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">Название</span>
          <span :style="{ fontSize: '11px', color: T.textDim }">{{ name.length }}/{{ NAME_MAX }}</span>
        </div>
        <input
          v-model="name"
          :maxlength="NAME_MAX"
          :placeholder="autoName()"
          :style="{
            width: '100%', padding: '12px 14px',
            background: T.cardAlt, border: `1px solid ${T.border}`,
            borderRadius: '12px', color: T.text, fontSize: '16px',
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }"
        />
      </div>

      <!-- Где посмотреть -->
      <div :style="{ marginBottom: '14px' }">
        <div :style="{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: '8px', padding: '0 2px',
        }">
          <span :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">Где посмотреть</span>
          <span :style="{ fontSize: '11px', color: T.textDim }">опц.</span>
        </div>
        <div :style="{ position: 'relative' }">
          <input
            v-model="url"
            type="url"
            placeholder="https://..."
            :style="{
              width: '100%', padding: '12px 88px 12px 14px',
              background: T.cardAlt, border: `1px solid ${T.border}`,
              borderRadius: '12px', color: T.text, fontSize: '16px',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            }"
          />
          <button
            :style="{
              position: 'absolute', right: '6px', top: '50%',
              transform: 'translateY(-50%)',
              padding: '7px 14px', border: 'none', borderRadius: '8px',
              background: pasteState === 'ok' ? T.green
                        : pasteState === 'fail' ? T.red + '88'
                        : T.neutral + '33',
              color: (pasteState === 'ok' || pasteState === 'fail') ? T.bg : T.neutral,
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              transition: 'all .2s', fontFamily: 'inherit',
            }"
            @click="pasteUrl"
          >{{ pasteState === 'ok' ? 'вставлено' : pasteState === 'fail' ? 'нет доступа' : 'Вставить' }}</button>
        </div>
      </div>

      <!-- Бренд -->
      <div :style="{ marginBottom: '14px' }">
        <div :style="{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: '8px', padding: '0 2px',
        }">
          <span :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">Бренд</span>
          <span :style="{ fontSize: '11px', color: T.textDim }">опц.</span>
        </div>
        <input
          v-model="brand"
          :maxlength="BRAND_MAX"
          placeholder="IKEA, Vitra, Lightstar..."
          :style="{
            width: '100%', padding: '12px 14px',
            background: T.cardAlt, border: `1px solid ${T.border}`,
            borderRadius: '12px', color: T.text, fontSize: '16px',
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }"
        />
      </div>

      <!-- Тип -->
      <div :style="{ marginBottom: '14px' }">
        <div :style="{ marginBottom: '8px', padding: '0 2px' }">
          <span :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">Тип</span>
        </div>
        <div :style="{ position: 'relative' }">
          <select
            v-model="type"
            :style="{
              width: '100%', appearance: 'none', WebkitAppearance: 'none',
              padding: '13px 38px 13px 14px',
              background: T.cardAlt, border: `1px solid ${T.border}`,
              borderRadius: '12px', color: T.text, fontSize: '16px', fontWeight: 600,
              outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
              boxSizing: 'border-box',
            }"
          >
            <option v-for="opt in FX_TYPES" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
          </select>
          <svg viewBox="0 0 12 8" :style="{
            position: 'absolute', right: '14px', top: '50%',
            transform: 'translateY(-50%)',
            width: '12px', height: '8px', pointerEvents: 'none',
          }">
            <path d="M1 1 L6 6 L11 1" :stroke="T.textSec" stroke-width="1.5" fill="none" stroke-linecap="round" />
          </svg>
        </div>
      </div>

      <!-- Где крепится (спот) -->
      <div v-if="showSpotPlace" :style="{ marginBottom: '14px' }">
        <div :style="{ marginBottom: '8px', padding: '0 2px' }">
          <span :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">Где крепится</span>
        </div>
        <div :style="{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px',
          padding: '3px', background: T.cardAlt,
          borderRadius: '12px', border: `1px solid ${T.border}`,
        }">
          <button
            v-for="opt in SPOT_PLACES" :key="opt.id"
            :style="{
              padding: '9px 6px', border: 'none', borderRadius: '9px',
              background: spotPlace === opt.id ? T.text : 'transparent',
              color: spotPlace === opt.id ? T.bg : T.textSec,
              fontSize: '13px', fontWeight: spotPlace === opt.id ? 700 : 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }"
            @click="spotPlace = opt.id"
          >{{ opt.label }}</button>
        </div>
      </div>

      <!-- Размер (люстры) -->
      <div v-if="showSize" :style="{ marginBottom: '14px' }">
        <div :style="{ marginBottom: '8px', padding: '0 2px' }">
          <span :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">Размер</span>
        </div>
        <div :style="{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px',
          padding: '3px', background: T.cardAlt,
          borderRadius: '12px', border: `1px solid ${T.border}`,
        }">
          <button
            v-for="opt in SIZES" :key="opt.id"
            :style="{
              padding: '9px 4px', border: 'none', borderRadius: '9px',
              background: size === opt.id ? T.text : 'transparent',
              color: size === opt.id ? T.bg : T.textSec,
              fontSize: '12px', fontWeight: size === opt.id ? 700 : 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }"
            @click="size = opt.id"
          >{{ opt.label }}</button>
        </div>
      </div>

      <!-- Источник света -->
      <div :style="{ marginBottom: '14px' }">
        <div :style="{ marginBottom: '8px', padding: '0 2px' }">
          <span :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">Источник света</span>
        </div>
        <div :style="{ position: 'relative' }">
          <select
            v-model="source"
            :style="{
              width: '100%', appearance: 'none', WebkitAppearance: 'none',
              padding: '13px 38px 13px 14px',
              background: T.cardAlt, border: `1px solid ${T.border}`,
              borderRadius: '12px', color: T.text, fontSize: '16px', fontWeight: 600,
              outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
              boxSizing: 'border-box',
            }"
          >
            <option v-for="opt in SOCKETS" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
          </select>
          <svg viewBox="0 0 12 8" :style="{
            position: 'absolute', right: '14px', top: '50%',
            transform: 'translateY(-50%)',
            width: '12px', height: '8px', pointerEvents: 'none',
          }">
            <path d="M1 1 L6 6 L11 1" :stroke="T.textSec" stroke-width="1.5" fill="none" stroke-linecap="round" />
          </svg>
        </div>
      </div>

      <!-- Сколько ламп (только для bulb) -->
      <div v-if="socketObj.kind === 'bulb'" :style="{ marginBottom: '14px' }">
        <div :style="{ marginBottom: '8px', padding: '0 2px' }">
          <span :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">Сколько ламп</span>
        </div>
        <div :style="{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 4px 4px 16px',
          background: T.cardAlt, borderRadius: '12px', border: `1px solid ${T.border}`,
        }">
          <span :style="{ fontSize: '15px', fontWeight: 600, color: T.text }">
            {{ lamps }} <span :style="{ color: T.textSec, fontWeight: 500, fontSize: '13px' }">{{ lampsWord(lamps) }}</span>
          </span>
          <div :style="{ display: 'flex', gap: '4px' }">
            <button
              :disabled="lamps <= 1"
              :style="{
                width: '36px', height: '36px', borderRadius: '9px', border: 'none',
                background: lamps <= 1 ? T.border : T.text,
                color: lamps <= 1 ? T.textDim : T.bg,
                fontSize: '18px', fontWeight: 700,
                cursor: lamps <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }"
              @click="lamps = Math.max(1, lamps - 1)"
            >−</button>
            <button
              :disabled="lamps >= 12"
              :style="{
                width: '36px', height: '36px', borderRadius: '9px', border: 'none',
                background: lamps >= 12 ? T.border : T.text,
                color: lamps >= 12 ? T.textDim : T.bg,
                fontSize: '18px', fontWeight: 700,
                cursor: lamps >= 12 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }"
              @click="lamps = Math.min(12, lamps + 1)"
            >+</button>
          </div>
        </div>
      </div>

      <!-- Мощность / параметры ленты -->
      <div :style="{ marginBottom: '14px' }">
        <div :style="{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: '8px', padding: '0 2px',
        }">
          <span :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">
            {{ socketObj.kind === 'bulb' ? 'Мощность лампы'
              : socketObj.kind === 'led' ? 'Мощность светильника'
              : 'Ватт на метр ленты' }}
          </span>
          <span
            :style="{
              cursor: 'pointer', color: T.neutral,
              textDecoration: 'underline', fontSize: '11px',
            }"
            @click="manualLm = !manualLm"
          >{{ manualLm ? '← по мощности' : 'знаю люмены →' }}</span>
        </div>

        <template v-if="!manualLm">
          <!-- Bulb watt select -->
          <div v-if="socketObj.kind === 'bulb' && socketObj.watts" :style="{ position: 'relative' }">
            <select
              :value="wattMap[socketObj.id] ?? socketObj.watts[0]"
              @change="(e) => { wattMap[socketObj.id] = parseFloat((e.target as HTMLSelectElement).value) }"
              :style="{
                width: '100%', appearance: 'none', WebkitAppearance: 'none',
                padding: '13px 38px 13px 14px',
                background: T.cardAlt, border: `1px solid ${T.border}`,
                borderRadius: '12px', color: T.text, fontSize: '16px', fontWeight: 600,
                outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
                boxSizing: 'border-box',
              }"
            >
              <option v-for="w in socketObj.watts" :key="w" :value="w">{{ w }} Вт</option>
            </select>
            <svg viewBox="0 0 12 8" :style="{
              position: 'absolute', right: '14px', top: '50%',
              transform: 'translateY(-50%)',
              width: '12px', height: '8px', pointerEvents: 'none',
            }">
              <path d="M1 1 L6 6 L11 1" :stroke="T.textSec" stroke-width="1.5" fill="none" stroke-linecap="round" />
            </svg>
          </div>

          <!-- LED watt select -->
          <div v-else-if="socketObj.kind === 'led' && socketObj.watts" :style="{ position: 'relative' }">
            <select
              :value="wattMap.LED ?? 20"
              @change="(e) => { wattMap.LED = parseFloat((e.target as HTMLSelectElement).value) }"
              :style="{
                width: '100%', appearance: 'none', WebkitAppearance: 'none',
                padding: '13px 38px 13px 14px',
                background: T.cardAlt, border: `1px solid ${T.border}`,
                borderRadius: '12px', color: T.text, fontSize: '16px', fontWeight: 600,
                outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
                boxSizing: 'border-box',
              }"
            >
              <option v-for="w in socketObj.watts" :key="w" :value="w">{{ w }} Вт</option>
            </select>
            <svg viewBox="0 0 12 8" :style="{
              position: 'absolute', right: '14px', top: '50%',
              transform: 'translateY(-50%)',
              width: '12px', height: '8px', pointerEvents: 'none',
            }">
              <path d="M1 1 L6 6 L11 1" :stroke="T.textSec" stroke-width="1.5" fill="none" stroke-linecap="round" />
            </svg>
          </div>

          <!-- Tape: W/m + length -->
          <div v-else-if="socketObj.kind === 'tape' && socketObj.wPerM" :style="{ display: 'grid', gap: '8px' }">
            <div :style="{ position: 'relative' }">
              <select
                v-model.number="tapeW"
                :style="{
                  width: '100%', appearance: 'none', WebkitAppearance: 'none',
                  padding: '13px 38px 13px 14px',
                  background: T.cardAlt, border: `1px solid ${T.border}`,
                  borderRadius: '12px', color: T.text, fontSize: '16px', fontWeight: 600,
                  outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
                  boxSizing: 'border-box',
                }"
              >
                <option v-for="w in socketObj.wPerM" :key="w" :value="w">{{ w }} Вт/м</option>
              </select>
              <svg viewBox="0 0 12 8" :style="{
                position: 'absolute', right: '14px', top: '50%',
                transform: 'translateY(-50%)',
                width: '12px', height: '8px', pointerEvents: 'none',
              }">
                <path d="M1 1 L6 6 L11 1" :stroke="T.textSec" stroke-width="1.5" fill="none" stroke-linecap="round" />
              </svg>
            </div>
            <div :style="{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 4px 4px 16px',
              background: T.cardAlt, borderRadius: '12px', border: `1px solid ${T.border}`,
            }">
              <span :style="{ fontSize: '15px', fontWeight: 600, color: T.text }">
                {{ tapeLen }} <span :style="{ color: T.textSec, fontWeight: 500, fontSize: '13px' }">{{ metersWord(tapeLen) }}</span>
              </span>
              <div :style="{ display: 'flex', gap: '4px' }">
                <button
                  :disabled="tapeLen <= 1"
                  :style="{
                    width: '36px', height: '36px', borderRadius: '9px', border: 'none',
                    background: tapeLen <= 1 ? T.border : T.text,
                    color: tapeLen <= 1 ? T.textDim : T.bg,
                    fontSize: '18px', fontWeight: 700,
                    cursor: tapeLen <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  }"
                  @click="tapeLen = Math.max(1, tapeLen - 1)"
                >−</button>
                <button
                  :disabled="tapeLen >= 30"
                  :style="{
                    width: '36px', height: '36px', borderRadius: '9px', border: 'none',
                    background: tapeLen >= 30 ? T.border : T.text,
                    color: tapeLen >= 30 ? T.textDim : T.bg,
                    fontSize: '18px', fontWeight: 700,
                    cursor: tapeLen >= 30 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  }"
                  @click="tapeLen = Math.min(30, tapeLen + 1)"
                >+</button>
              </div>
            </div>
          </div>

          <!-- Авто-люмены -->
          <div :style="{
            marginTop: '8px', padding: '8px 12px',
            background: T.cardAlt, borderRadius: '9px',
            fontSize: '12px', color: T.textSec,
            display: 'flex', justifyContent: 'space-between',
          }">
            <span>
              ≈ {{ socketObj.kind === 'bulb' ? 'на лампу'
                : socketObj.kind === 'led' ? 'со светильника'
                : 'со всей ленты' }}
            </span>
            <b :style="{ color: T.text }">{{ autoLm.toLocaleString('ru-RU') }} лм</b>
          </div>
        </template>

        <template v-else>
          <input
            v-model.number="customLm"
            type="number"
            :placeholder="socketObj.kind === 'bulb' ? 'люмены на одну лампу' : 'люмены со всего устройства'"
            :style="{
              width: '100%', padding: '12px 14px',
              background: T.cardAlt, border: `1px solid ${T.border}`,
              borderRadius: '12px', color: T.text, fontSize: '16px',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            }"
          />
        </template>
      </div>

      <!-- Корпус -->
      <div :style="{ marginBottom: '14px' }">
        <div :style="{ marginBottom: '8px', padding: '0 2px' }">
          <span :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">Корпус</span>
        </div>
        <div :style="{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px',
          padding: '3px', background: T.cardAlt,
          borderRadius: '12px', border: `1px solid ${T.border}`,
        }">
          <button
            v-for="opt in BODIES" :key="opt.id"
            :style="{
              padding: '9px 6px', border: 'none', borderRadius: '9px',
              background: bodyId === opt.id ? T.text : 'transparent',
              color: bodyId === opt.id ? T.bg : T.textSec,
              fontSize: '13px', fontWeight: bodyId === opt.id ? 700 : 500,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '1px', lineHeight: 1.2,
            }"
            @click="bodyId = opt.id"
          >
            <span>{{ opt.label }}</span>
            <span :style="{ fontSize: '10px', opacity: bodyId === opt.id ? 0.7 : 0.55, fontWeight: 500 }">{{ opt.hint }}</span>
          </button>
        </div>
      </div>

      <!-- Цвет светильника -->
      <div :style="{ marginBottom: '14px' }">
        <div :style="{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: '8px', padding: '0 2px',
        }">
          <span :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">Цвет светильника</span>
          <span :style="{ fontSize: '11px', color: T.textDim }">{{ tintObj.label }}</span>
        </div>
        <div class="customfx-tint-row" :style="{
          display: 'flex', gap: '12px',
          padding: '6px 2px 10px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }">
          <button
            v-for="t in TINTS" :key="t.id"
            :title="t.label"
            :style="{
              flexShrink: 0,
              width: '44px', height: '44px', borderRadius: '50%', padding: 0,
              border: tintId === t.id ? `2px solid ${T.text}` : '2px solid transparent',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }"
            @click="tintId = t.id"
          >
            <span :style="{
              width: '36px', height: '36px', borderRadius: '50%',
              display: 'inline-block', flexShrink: 0,
              background: orbBg(t.hex),
              border: orbBorder(t.hex),
              boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.22), inset 0 1px 1px rgba(255,255,255,0.18), 0 1px 3px rgba(0,0,0,0.4)',
            }" />
          </button>
        </div>
      </div>

      <!-- Оттенок света -->
      <div :style="{ marginBottom: '14px' }">
        <div :style="{ marginBottom: '8px', padding: '0 2px' }">
          <span :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">Оттенок света</span>
        </div>
        <div :style="{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px',
          padding: '3px', background: T.cardAlt,
          borderRadius: '12px', border: `1px solid ${T.border}`,
        }">
          <button
            v-for="opt in TEMPS" :key="opt.id"
            :style="{
              padding: '9px 6px', border: 'none', borderRadius: '9px',
              background: temp === opt.id ? T.text : 'transparent',
              color: temp === opt.id ? T.bg : T.textSec,
              fontSize: '13px', fontWeight: temp === opt.id ? 700 : 500,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '1px', lineHeight: 1.2,
            }"
            @click="temp = opt.id"
          >
            <span>{{ opt.label }}</span>
            <span :style="{ fontSize: '10px', opacity: temp === opt.id ? 0.7 : 0.55, fontWeight: 500 }">{{ opt.hint }}</span>
          </button>
        </div>
      </div>

      <!-- Превью «В комнату пойдёт» -->
      <div :style="{
        marginTop: '4px', padding: '14px 16px',
        background: T.neutral + '11',
        border: `1px solid ${T.neutral}33`,
        borderRadius: '12px',
      }">
        <div :style="{
          fontSize: '11px', fontWeight: 600, color: T.neutral,
          textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
        }">
          В комнату пойдёт
        </div>
        <div :style="{ display: 'flex', alignItems: 'baseline', gap: '6px' }">
          <span :style="{ fontSize: '24px', fontWeight: 700, color: T.text }">
            {{ totalLm.toLocaleString('ru-RU') }}
          </span>
          <span :style="{ fontSize: '13px', color: T.textSec }">лм общего света</span>
        </div>
        <div :style="{ fontSize: '11px', color: T.textDim, marginTop: '4px' }">
          {{ lmPer }} × {{ effectiveLamps }} × {{ bodyVal.toFixed(2) }} (корпус) × {{ ambientVal.toFixed(2) }} (тип)
        </div>
      </div>

      <!-- Удалить — большая outline-кнопка в красной плашке (паттерн FxEditor) -->
      <div v-if="!props.isProvisional" :style="{
        background: T.red + '14', border: `1px solid ${T.red}33`,
        borderRadius: '10px', padding: '14px', marginTop: '16px',
      }">
        <div :style="{ fontSize: '12px', color: T.textSec, marginBottom: '10px', lineHeight: 1.5 }">
          «{{ displayName }}» будет удалён из комнаты. Настройки не сохранятся — при повторном добавлении нужно будет ввести заново.
        </div>
        <button
          :style="{
            width: '100%', padding: '10px', background: 'none',
            border: `1px solid ${T.red}44`, borderRadius: '8px',
            color: T.red, cursor: 'pointer',
            fontSize: '17px', fontWeight: 600, fontFamily: 'inherit',
          }"
          @click="showDelConfirm = true"
        >Удалить светильник</button>
      </div>
    </div>

    <!-- Sticky bottom — одна кнопка (как у FxEditor через StickyBar) -->
    <div :style="{
      flexShrink: 0,
      padding: '12px 16px 18px',
      borderTop: `1px solid ${T.border}`,
      background: T.bg,
    }">
      <div :style="{ maxWidth: '560px', margin: '0 auto' }">
        <button
          :disabled="!canSave"
          :style="{
            width: '100%', padding: '14px', border: 'none',
            background: canSave ? T.text : T.border,
            color: canSave ? T.bg : T.textDim,
            borderRadius: '10px', fontSize: '15px', fontWeight: 700,
            cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
          }"
          @click="handleSave"
        >{{ props.isProvisional ? 'Добавить' : 'Сохранить' }}</button>
      </div>
    </div>

    <!-- Подтверждение удаления -->
    <div
      v-if="showDelConfirm"
      :style="{
        position: 'fixed', inset: 0, zIndex: 70,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }"
      @click.self="showDelConfirm = false"
    >
      <div :style="{
        width: '100%', maxWidth: '340px',
        background: T.bg, borderRadius: '16px',
        border: `1px solid ${T.border}`,
        padding: '24px 20px', textAlign: 'center',
      }">
        <div :style="{ fontSize: '16px', fontWeight: 700, color: T.text, marginBottom: '8px' }">
          Удалить светильник?
        </div>
        <div :style="{ fontSize: '13px', color: T.textSec, lineHeight: 1.5, marginBottom: '20px' }">
          «{{ displayName }}» будет удалён из комнаты. Все настройки потеряются.
        </div>
        <div :style="{ display: 'flex', gap: '8px' }">
          <button
            :style="{
              flex: 1, padding: '12px', borderRadius: '10px',
              border: `1px solid ${T.border}`, background: T.card,
              color: T.textSec, cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
            }"
            @click="showDelConfirm = false"
          >Отмена</button>
          <button
            :style="{
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
              background: T.red, color: '#fff', cursor: 'pointer',
              fontSize: '13px', fontWeight: 700, fontFamily: 'inherit',
            }"
            @click="handleDeleteConfirmed"
          >Удалить</button>
        </div>
      </div>
    </div>

    <!-- Leave-confirm: на выходе с правками / провизорный -->
    <LeaveConfirmModal
      v-if="showLeaveConfirm"
      :save-label="props.isProvisional ? 'Добавить' : 'Сохранить'"
      @save="onLeaveSave"
      @discard="onLeaveDiscard"
      @cancel="showLeaveConfirm = false"
    />
  </div>
</template>

<style scoped>
.customfx-scroll::-webkit-scrollbar { width: 4px; }
.customfx-scroll::-webkit-scrollbar-thumb { background: #2E2921; border-radius: 2px; }
.customfx-tint-row::-webkit-scrollbar { height: 4px; }
.customfx-tint-row::-webkit-scrollbar-thumb { background: #2E2921; border-radius: 2px; }
</style>
