<script setup lang="ts">
/**
 * ZoneFixturesModal.vue — Белая модалка деталей зоны (новый дизайн).
 *
 * Открывается по клику на нижний бар карточки зоны (ZoneCard) или по тапу
 * на сгруппированную модель (×N). Показывает светильники зоны поштучно,
 * блок «Точки подключения» и кнопку «Параметры комнаты».
 *
 * Поведение сохранено как в оригинале:
 *   • клик по карточке светильника → emit('edit', idx) → RoomDetail → openFx;
 *   • «Параметры комнаты» → emit('openParams') → RoomDetail → RoomSettings.
 *
 * Цвет/дерево светильника показываем глянцевым «шаром» (как в WelcomeScreen).
 * Это отдельный компонент — дизайн правится здесь, не трогая ZoneCard.
 */

import { computed, onMounted, onUnmounted } from 'vue'
import { Z } from '../theme/tokens'
import { MD, type Fixture, type Zone, fxNav, fxLine } from '../data/catalog'
import { MATS, WCOL, type Wood } from '../data/materials'
import { zoneLm, zoneFxCount } from '../engine/zone-engine'
import { occupiedPhrase } from '../engine/i18n'
import { useConfigurator } from '../store/configurator'
import Icon, { fxIcName } from './ui/Icons.vue'
import { pickFxPhotos, fxToConfig, activeHeroPhotos } from '../engine/fx-gallery'

interface Props {
  zone: Zone
  fixtures: Fixture[]
  limit: number
  totalLm: number
}
const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  edit: [fxIdx: number]
  add: []
  openParams: []
}>()

/* Скрываем StickyBar + лочим скролл фона (как RoomSettings/Modal). */
const cfg = useConfigurator()
let prevBodyOverflow = ''
let prevHtmlOverflow = ''
onMounted(() => {
  prevBodyOverflow = document.body.style.overflow
  prevHtmlOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
  cfg.showZoneModal.value = true
})
onUnmounted(() => {
  document.body.style.overflow = prevBodyOverflow
  document.documentElement.style.overflow = prevHtmlOverflow
  cfg.showZoneModal.value = false
})

/* Светлая палитра модалки (намеренно белая — контраст к тёмному приложению). */
const L = {
  bg: '#FBFAF7',
  surface: '#FFFFFF',
  muted: '#EBE4D8',
  chip: '#F0EBE1',
  text: '#1F1B16',
  textSec: '#8A8175',
  border: '#ECE7DD',
  bubble: '#2A251E',
  pipTrack: '#CBC2B2',
}

const WOOD_NAME: Record<Wood, string> = Object.fromEntries(
  MATS.map((m) => [m.id, m.name]),
) as Record<Wood, string>

/* Светильники только этой зоны, с исходными индексами. */
const zFx = computed(() =>
  props.fixtures
    .map((it, idx) => ({ ...it, _idx: idx }))
    .filter((it) => (it.zone ?? 'ceiling') === props.zone.id),
)

/* Hero-фото для фона модалки. Берём первое доступное фото первого WOODLED-
   фикстура в зоне (кастомы пропускаем — у них нет тегированных снимков). */
const heroBgPhoto = computed<string | null>(() => {
  for (const fx of zFx.value) {
    if (fx.custom) continue
    const result = pickFxPhotos(fxToConfig(fx), 'hero')
    const photos = activeHeroPhotos(result)
    if (photos.length > 0) return photos[0].photo.src
  }
  return null
})

const used = computed(() => zoneFxCount(props.fixtures, props.zone.id))
const lamps = computed(() =>
  zFx.value.reduce((s, it) => s + (it.l ?? MD[it.m]?.lamps ?? 0) * (it.q ?? 1), 0),
)
const pct = computed(() =>
  props.totalLm > 0 ? Math.round((zoneLm(props.fixtures, props.zone.id) / props.totalLm) * 100) : 0,
)
const full = computed(() => used.value >= props.limit)
const free = computed(() => Math.max(props.limit - used.value, 0))

function fxLamps(it: Fixture): number {
  return (it.l ?? MD[it.m]?.lamps ?? 0) * (it.q ?? 1)
}
function lampWord(n: number): string {
  const l = n % 10, lt = n % 100
  if (lt >= 11 && lt <= 14) return 'ламп'
  if (l === 1) return 'лампа'
  if (l >= 2 && l <= 4) return 'лампы'
  return 'ламп'
}
function fxWord(n: number): string {
  const l = n % 10, lt = n % 100
  if (lt >= 11 && lt <= 19) return 'светильников'
  if (l === 1) return 'светильник'
  if (l >= 2 && l <= 4) return 'светильника'
  return 'светильников'
}
function orbStyle(wood: Wood, size = 13) {
  const color = WCOL[wood]
  return {
    width: size + 'px',
    height: size + 'px',
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
    background: `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.55), transparent 42%), radial-gradient(circle at 70% 78%, rgba(0,0,0,0.22), transparent 60%), ${color}`,
    border: wood === 'black' ? '1px solid rgba(19,17,14,0.55)' : 'none',
    boxShadow:
      'inset 0 -1px 2px rgba(0,0,0,0.22), inset 0 1px 1px rgba(255,255,255,0.18), 0 1px 3px rgba(0,0,0,0.4)',
  }
}
</script>

<template>
  <div
    :style="{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(2px)', zIndex: Z.fullscreenModal,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      touchAction: 'none', overscrollBehavior: 'contain',
    }"
    @click="emit('close')"
    @touchmove.prevent
  >
    <div
      :style="{
        width: '100%', maxWidth: '420px', maxHeight: '86vh',
        background: heroBgPhoto
          ? `linear-gradient(rgba(255,250,242,.88), rgba(255,250,242,.88)), url('${heroBgPhoto}') center/cover no-repeat, ${L.bg}`
          : L.bg,
        borderRadius: '24px', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        touchAction: 'pan-y', overscrollBehavior: 'contain',
      }"
      @click.stop
      @touchmove.stop
    >
      <!-- Хедер: заголовок + крестик, ниже тёмные баблы -->
      <div :style="{ padding: '20px 20px 0' }">
        <div :style="{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }">
          <div :style="{ fontSize: '22px', fontWeight: 700, color: L.text }">{{ zone.name }}</div>
          <button
            :style="{
              width: '34px', height: '34px', borderRadius: '50%', background: L.muted,
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }"
            @click="emit('close')"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="L.textSec" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
        <div :style="{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }">
          <span :style="{ padding: '5px 11px', borderRadius: '999px', background: L.bubble, color: '#EDE6D8', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }">
            {{ used }} {{ fxWord(used) }}
          </span>
          <span :style="{ padding: '5px 11px', borderRadius: '999px', background: L.bubble, color: '#EDE6D8', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }">
            {{ lamps }} {{ lampWord(lamps) }}
          </span>
          <span :style="{ padding: '5px 11px', borderRadius: '999px', background: L.bubble, color: '#EDE6D8', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }">
            {{ pct }}% света
          </span>
        </div>
      </div>

      <!-- Светильники поштучно, 2 колонки + карточка «Добавить» -->
      <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '18px 20px 8px' }">
        <div
          v-for="it in zFx"
          :key="it._idx"
          :style="{
            background: L.surface, border: `1px solid ${L.border}`, borderRadius: '16px',
            padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px',
          }"
          @click="emit('edit', it._idx)"
        >
          <div :style="{ width: '44px', height: '44px', borderRadius: '12px', background: '#A8895A18', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <Icon :name="fxIcName(MD[it.m].type)" color="#A8895A" :size="22" />
          </div>
          <div>
            <div :style="{ fontSize: '15px', fontWeight: 600, color: L.text }">{{ fxNav(it.m) }}</div>
            <div :style="{ fontSize: '10px', fontWeight: 700, color: L.textSec, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.6px' }">{{ fxLine(it.m) }}</div>
            <div :style="{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '9px' }">
              <span :style="{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', background: L.chip, color: L.text, fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }">
                <span :style="orbStyle(it.wood, 13)" />{{ WOOD_NAME[it.wood] }}
              </span>
              <span :style="{ padding: '4px 10px', borderRadius: '999px', background: L.chip, color: L.text, fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }">
                {{ fxLamps(it) }} {{ lampWord(fxLamps(it)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Карточка добавления / лимит -->
        <button
          v-if="!full"
          :style="{
            border: '1.5px dashed #A8895A', borderRadius: '16px', padding: '16px', minHeight: '118px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: '#A8895A0c', cursor: 'pointer', fontFamily: 'inherit',
          }"
          @click="emit('add')"
        >
          <div :style="{ width: '40px', height: '40px', borderRadius: '50%', background: '#A8895A', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" :style="{ display: 'block' }"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
          </div>
          <div :style="{ fontSize: '13px', fontWeight: 600, color: '#A8895A' }">Добавить</div>
        </button>
        <div
          v-else
          :style="{
            border: `1.5px solid ${L.border}`, borderRadius: '16px', padding: '16px', minHeight: '118px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: L.muted,
          }"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="L.textSec" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          <span :style="{ fontSize: '12px', color: L.textSec, textAlign: 'center' }">Лимит {{ limit }}/{{ limit }}</span>
        </div>
      </div>

      <!-- Точки подключения -->
      <div :style="{ padding: '8px 20px 22px' }">
        <div :style="{ padding: '14px 16px', background: L.muted, borderRadius: '14px' }">
          <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
            <span :style="{ fontSize: '13px', color: L.text, fontWeight: 700 }">Точки подключения</span>
            <span :style="{ display: 'flex', alignItems: 'center', gap: '8px' }">
              <span :style="{ display: 'flex', gap: '5px' }">
                <span
                  v-for="i in limit" :key="i"
                  :style="{
                    width: '9px', height: '9px', borderRadius: '50%',
                    background: i <= used ? '#1F1B16' : 'transparent',
                    border: `1.5px solid ${i <= used ? '#1F1B16' : L.pipTrack}`,
                  }"
                />
              </span>
              <span :style="{ fontSize: '14px', color: L.text, fontWeight: 700 }">{{ used }}/{{ limit }}</span>
            </span>
          </div>
          <div :style="{ fontSize: '12px', color: L.textSec, marginTop: '8px', lineHeight: 1.45 }">
            <template v-if="full">{{ occupiedPhrase(limit) }}. Измените лимиты — добавьте больше света.</template>
            <template v-else>Свободно {{ free }} из {{ limit }}. Измените лимиты — добавьте больше света.</template>
          </div>
          <button
            :style="{
              marginTop: '12px', padding: '9px 14px', borderRadius: '10px', background: L.text,
              border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fff',
            }"
            @click="emit('openParams')"
          >
            <span :style="{ fontSize: '13px', fontWeight: 600 }">Параметры комнаты</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
