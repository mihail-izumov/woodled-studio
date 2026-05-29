<script lang="ts">
/**
 * Icons.vue — Все Lucide-иконки как единый компонент-обёртка.
 *
 * Реализация: один <svg> + v-html с путями из таблицы ICONS.
 * Источник: woodled-v42.jsx (объект IC) + SuperApp ICP (fxSize, fxMount, fxBowl, fxDiffuser, fxWire).
 *
 * ТЗ-1: Добавлены arrowDownRight, arrowRight, arrowUpRight для MoodArc.
 * batch11 #8 (#3): Добавлен circleEllipsis — замена pen для заголовка дома.
 */

import type { FxType } from '../../data/catalog'

export type IconName =
  | 'ceiling' | 'table' | 'floor' | 'spot' | 'bra' | 'bulb'
  | 'up' | 'pen' | 'leaf' | 'mirror' | 'trees' | 'gift'
  | 'leafy' | 'house' | 'sun' | 'thermo' | 'grid' | 'wind'
  | 'dotDashed' | 'fileSliders' | 'fan' | 'clockFading' | 'gitCompare'
  | 'fxSize' | 'fxMount' | 'fxBowl' | 'fxDiffuser' | 'fxWire'
  | 'fxPendant' | 'fxFlush'
  | 'fxMoveUp' | 'fxSunMed'
  | 'palette'
  | 'slidersH'
  | 'arrowDownRight'
  | 'arrowRight'
  | 'arrowUpRight'
  | 'circleEllipsis'

export const ICON_NAMES: readonly IconName[] = [
  'ceiling', 'table', 'floor', 'spot', 'bra', 'bulb', 'up', 'pen', 'leaf',
  'mirror', 'trees', 'gift', 'leafy', 'house', 'sun', 'thermo', 'grid',
  'wind', 'dotDashed', 'fileSliders', 'fan', 'clockFading', 'gitCompare',
  'fxSize', 'fxMount', 'fxBowl', 'fxDiffuser', 'fxWire',
  'fxPendant', 'fxFlush',
  'fxMoveUp', 'fxSunMed',
  'palette',
  'slidersH',
  'arrowDownRight', 'arrowRight', 'arrowUpRight',
  'circleEllipsis',
] as const

/** Маппинг типа светильника на имя иконки. */
export function fxIcName(type: FxType): IconName {
  switch (type) {
    case 'люстра': return 'ceiling'
    case 'спот': return 'spot'
    case 'бра': return 'bra'
    case 'настольная': return 'table'
    case 'торшер': return 'floor'
    default: return 'ceiling'
  }
}

interface IconData {
  /** Нестандартная толщина обводки (по умолчанию 2). */
  strokeWidth?: number
  /** Содержимое внутри <svg>. */
  paths: string
}

/**
 * Lucide-иконки (viewBox 0 0 24 24, stroke-based).
 * Все пути захардкожены, v-html безопасен.
 */
export const ICONS: Record<IconName, IconData> = {
  ceiling: {
    paths:
      '<path d="M12 2v5"/>' +
      '<path d="M14.829 15.998a3 3 0 1 1-5.658 0"/>' +
      '<path d="M20.92 14.606A1 1 0 0 1 20 16H4a1 1 0 0 1-.92-1.394l3-7A1 1 0 0 1 7 7h10a1 1 0 0 1 .92.606z"/>',
  },
  table: {
    paths:
      '<path d="M12 12v6"/>' +
      '<path d="M4.077 10.615A1 1 0 0 0 5 12h14a1 1 0 0 0 .923-1.385l-3.077-7.384A2 2 0 0 0 15 2H9a2 2 0 0 0-1.846 1.23Z"/>' +
      '<path d="M8 20a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z"/>',
  },
  floor: {
    paths:
      '<path d="M12 10v12"/>' +
      '<path d="M17.929 7.629A1 1 0 0 1 17 9H7a1 1 0 0 1-.928-1.371l2-5A1 1 0 0 1 9 2h6a1 1 0 0 1 .928.629z"/>' +
      '<path d="M9 22h6"/>',
  },
  spot: {
    paths:
      '<path d="M15.295 19.562 16 22"/>' +
      '<path d="m17 16 3.758 2.098"/>' +
      '<path d="m19 12.5 3.026-.598"/>' +
      '<path d="M7.61 6.3a3 3 0 0 0-3.92 1.3l-1.38 2.79a3 3 0 0 0 1.3 3.91l6.89 3.597a1 1 0 0 0 1.342-.447l3.106-6.211a1 1 0 0 0-.447-1.341z"/>' +
      '<path d="M8 9V2"/>',
  },
  bra: {
    paths:
      '<path d="M19.929 9.629A1 1 0 0 1 19 11H9a1 1 0 0 1-.928-1.371l2-5A1 1 0 0 1 11 4h6a1 1 0 0 1 .928.629z"/>' +
      '<path d="M6 15a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z"/>' +
      '<path d="M8 18h4a2 2 0 0 0 2-2v-5"/>',
  },
  bulb: {
    paths:
      '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>' +
      '<path d="M9 18h6"/>' +
      '<path d="M10 22h4"/>',
  },
  up: {
    paths:
      '<path d="M12 2a10 10 0 0 1 7.38 16.75"/>' +
      '<path d="m16 12-4-4-4 4"/>' +
      '<path d="M12 16V8"/>' +
      '<path d="M2.5 8.875a10 10 0 0 0-.5 3"/>' +
      '<path d="M2.83 16a10 10 0 0 0 2.43 3.4"/>' +
      '<path d="M4.636 5.235a10 10 0 0 1 .891-.857"/>' +
      '<path d="M8.644 21.42a10 10 0 0 0 7.631-.38"/>',
  },
  pen: {
    paths:
      '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>' +
      '<path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>',
  },
  leaf: {
    strokeWidth: 1.5,
    paths:
      '<path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z"/>' +
      '<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  },
  mirror: {
    paths:
      '<path d="M11 6 8 9"/>' +
      '<path d="m16 7-8 8"/>' +
      '<rect x="4" y="2" width="16" height="20" rx="2"/>',
  },
  trees: {
    paths:
      '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/>' +
      '<path d="M7 16v6"/>' +
      '<path d="M13 19v3"/>' +
      '<path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>',
  },
  gift: {
    paths:
      '<path d="M12 7v14"/>' +
      '<path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/>' +
      '<path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/>' +
      '<rect x="3" y="7" width="18" height="4" rx="1"/>',
  },
  leafy: {
    paths:
      '<path d="M2 22c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5 4 4 0 0 0 6.187-2.353 3.5 3.5 0 0 0 3.69-5.116A3.5 3.5 0 0 0 20.95 8 3.5 3.5 0 1 0 16 3.05a3.5 3.5 0 0 0-5.831 1.373 3.5 3.5 0 0 0-5.116 3.69 4 4 0 0 0-2.348 6.155C3.499 15.42 4.409 16.712 4.2 18.1 3.926 19.743 3.014 20.732 2 22"/>' +
      '<path d="M2 22 17 7"/>',
  },
  house: {
    paths:
      '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>' +
      '<path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  },
  sun: {
    paths:
      '<circle cx="12" cy="12" r="4"/>' +
      '<path d="M12 2v2"/>' +
      '<path d="M12 20v2"/>' +
      '<path d="m4.93 4.93 1.41 1.41"/>' +
      '<path d="m17.66 17.66 1.41 1.41"/>' +
      '<path d="M2 12h2"/>' +
      '<path d="M20 12h2"/>' +
      '<path d="m6.34 17.66-1.41 1.41"/>' +
      '<path d="m19.07 4.93-1.41 1.41"/>',
  },
  thermo: {
    paths:
      '<path d="M12 2v2"/>' +
      '<path d="M12 8a4 4 0 0 0-1.645 7.647"/>' +
      '<path d="M2 12h2"/>' +
      '<path d="M20 14.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z"/>' +
      '<path d="m4.93 4.93 1.41 1.41"/>' +
      '<path d="m6.34 17.66-1.41 1.41"/>',
  },
  grid: {
    paths:
      '<path d="M12 3v18"/>' +
      '<path d="M3 12h18"/>' +
      '<rect x="3" y="3" width="18" height="18" rx="2"/>',
  },
  wind: {
    paths:
      '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/>' +
      '<path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/>' +
      '<path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>',
  },
  dotDashed: {
    paths:
      '<path d="M10.1 2.18a9.93 9.93 0 0 1 3.8 0"/>' +
      '<path d="M17.6 3.71a9.95 9.95 0 0 1 2.69 2.7"/>' +
      '<path d="M21.82 10.1a9.93 9.93 0 0 1 0 3.8"/>' +
      '<path d="M20.29 17.6a9.95 9.95 0 0 1-2.7 2.69"/>' +
      '<path d="M13.9 21.82a9.94 9.94 0 0 1-3.8 0"/>' +
      '<path d="M6.4 20.29a9.95 9.95 0 0 1-2.69-2.7"/>' +
      '<path d="M2.18 13.9a9.93 9.93 0 0 1 0-3.8"/>' +
      '<path d="M3.71 6.4a9.95 9.95 0 0 1 2.7-2.69"/>' +
      '<circle cx="12" cy="12" r="1"/>',
  },
  fileSliders: {
    paths:
      '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>' +
      '<path d="M14 2v5a1 1 0 0 0 1 1h5"/>' +
      '<path d="M8 12h8"/>' +
      '<path d="M10 11v2"/>' +
      '<path d="M8 17h8"/>' +
      '<path d="M14 16v2"/>',
  },
  fan: {
    paths:
      '<path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z"/>' +
      '<path d="M12 12v.01"/>',
  },
  clockFading: {
    paths:
      '<path d="M12 2a10 10 0 0 1 7.38 16.75"/>' +
      '<path d="M12 6v6l4 2"/>' +
      '<path d="M2.5 8.875a10 10 0 0 0-.5 3"/>' +
      '<path d="M2.83 16a10 10 0 0 0 2.43 3.4"/>' +
      '<path d="M4.636 5.235a10 10 0 0 1 .891-.857"/>' +
      '<path d="M8.644 21.42a10 10 0 0 0 7.631-.38"/>',
  },
  gitCompare: {
    paths:
      '<circle cx="18" cy="18" r="3"/>' +
      '<circle cx="6" cy="6" r="3"/>' +
      '<path d="M13 6h3a2 2 0 0 1 2 2v7"/>' +
      '<path d="M11 18H8a2 2 0 0 1-2-2V9"/>',
  },

  /* ── SuperApp ICP (FxEditor шаги) ── */

  fxSize: {
    paths:
      '<circle cx="19" cy="19" r="2"/>' +
      '<circle cx="5" cy="5" r="2"/>' +
      '<path d="M6.48 3.66a10 10 0 0 1 13.86 13.86"/>' +
      '<path d="m6.41 6.41 11.18 11.18"/>' +
      '<path d="M3.66 6.48a10 10 0 0 0 13.86 13.86"/>',
  },
  fxMount: {
    paths:
      '<path d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74z"/>' +
      '<path d="m20 14.285 1.5.845a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74l1.5-.845"/>',
  },
  fxBowl: {
    paths:
      '<circle cx="12" cy="12" r="10"/>' +
      '<circle cx="12" cy="12" r="2"/>',
  },
  fxDiffuser: {
    paths:
      '<circle cx="12" cy="12" r="10"/>' +
      '<path d="M12 18a6 6 0 0 0 0-12v12z"/>',
  },
  fxWire: {
    paths:
      '<path d="M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z"/>' +
      '<path d="M17 21v-2"/>' +
      '<path d="M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10"/>' +
      '<path d="M21 21v-2"/>' +
      '<path d="M3 5V3"/>' +
      '<path d="M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z"/>' +
      '<path d="M7 5V3"/>',
  },
  fxPendant: {
    paths:
      '<path d="M12 2q2 2.5 0 5t0 5 0 5 0 5"/>' +
      '<path d="M19 2q2 2.5 0 5t0 5 0 5 0 5"/>' +
      '<path d="M5 2q2 2.5 0 5t0 5 0 5 0 5"/>',
  },
  fxFlush: {
    paths:
      '<path d="M5 3h14"/>' +
      '<path d="m18 13-6-6-6 6"/>' +
      '<path d="M12 7v14"/>',
  },
  fxMoveUp: {
    paths:
      '<path d="M8 6L12 2L16 6"/>' +
      '<path d="M12 2V22"/>',
  },
  fxSunMed: {
    paths:
      '<circle cx="12" cy="12" r="4"/>' +
      '<path d="M12 3v1"/>' +
      '<path d="M12 20v1"/>' +
      '<path d="M3 12h1"/>' +
      '<path d="M20 12h1"/>' +
      '<path d="m18.364 5.636-.707.707"/>' +
      '<path d="m6.343 17.657-.707.707"/>' +
      '<path d="m5.636 5.636.707.707"/>' +
      '<path d="m17.657 17.657.707.707"/>',
  },
  palette: {
    paths:
      '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/>' +
      '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>' +
      '<circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>' +
      '<circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>' +
      '<circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
  },
  slidersH: {
    paths:
      '<path d="M10 5H3"/><path d="M12 19H3"/><path d="M14 3v4"/><path d="M16 17v4"/>' +
      '<path d="M21 12h-9"/><path d="M21 19h-5"/><path d="M21 5h-7"/><path d="M8 10v4"/><path d="M8 12H3"/>',
  },

  /* ── ТЗ-1: MoodArc иконки стрелок ── */

  arrowDownRight: {
    paths:
      '<path d="m7 7 10 10"/>' +
      '<path d="M17 7v10H7"/>',
  },
  arrowRight: {
    paths:
      '<path d="M5 12h14"/>' +
      '<path d="m12 5 7 7-7 7"/>',
  },
  arrowUpRight: {
    paths:
      '<path d="M7 7h10v10"/>' +
      '<path d="M7 17 17 7"/>',
  },

  /* batch11 #8 (#3): circle-ellipsis — замена pen для редактирования названия */
  circleEllipsis: {
    paths:
      '<circle cx="12" cy="12" r="10"/>' +
      '<path d="M17 12h.01"/>' +
      '<path d="M12 12h.01"/>' +
      '<path d="M7 12h.01"/>',
  },
}
</script>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: IconName
  color?: string
  size?: number
}
const props = withDefaults(defineProps<Props>(), {
  color: 'currentColor',
  size: 20,
})

const icon = computed(() => ICONS[props.name])
const sw = computed(() => icon.value?.strokeWidth ?? 2)
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="props.color"
    :stroke-width="sw"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-html="icon?.paths || ''"
  />
</template>
