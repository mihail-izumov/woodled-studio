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

import { computed } from 'vue'
import { Z } from '../theme/tokens'
import { MD, type Fixture, type Zone } from '../data/catalog'
import { MATS, WCOL, type Wood } from '../data/materials'
import { zoneLm, zoneFxCount } from '../engine/zone-engine'
import { pw } from '../engine/i18n'
import Icon, { fxIcName } from './ui/Icons.vue'

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
  openParams: []
}>()

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
    }"
    @click="emit('close')"
  >
    <div
      :style="{
        width: '100%', maxWidth: '420px', maxHeight: '86vh', background: L.bg,
        borderRadius: '24px', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }"
      @click.stop
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

      <!-- Светильники поштучно, 2 колонки -->
      <div
        v-if="zFx.length > 0"
        :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '18px 20px 8px' }"
      >
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
            <div :style="{ fontSize: '15px', fontWeight: 600, color: L.text }">{{ MD[it.m]?.name }}</div>
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
      </div>
      <div v-else :style="{ padding: '24px 20px 8px', textAlign: 'center', color: L.textSec, fontSize: '13px' }">
        Пока нет светильников — нажмите «+», чтобы добавить.
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
            <template v-if="full">Все {{ limit }} {{ pw(limit) }} заняты. Измените лимиты — добавьте больше света.</template>
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
