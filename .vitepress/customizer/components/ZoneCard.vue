<script setup lang="ts">
/**
 * ZoneCard.vue — Карточка-виджет одной зоны (новый дизайн).
 *
 * Дизайн (см. прототип ZoneCardsV13):
 *   • Шапка: НАЗВАНИЕ зоны (заглавными) + бейдж % доли света + кнопка «+».
 *   • Тело: скроллируемый список моделей (имя + глянцевый шар дерева),
 *     одинаковые модели схлопнуты в «×N». Снизу — затухание, если список длиннее.
 *   • Пустая зона — приглашающий стейт «Добавьте свет».
 *   • Нижняя плашка-кнопка: пипсы точек + стрелка → открыть модалку зоны.
 *
 * Поведение (как в оригинале):
 *   • «+» (есть место)            → emit('add')      → AddFxModal.
 *   • «+» (лимит достигнут)       → emit('limitHit') → тост-подсказка из RoomDetail.
 *   • клик по модели (одна штука) → emit('edit', idx)→ страница светильника (openFx).
 *   • клик по модели (×N) / плашке→ emit('open')     → ZoneFixturesModal.
 *
 * Акцент = mood.color → перекрашивается вместе с цветом комнаты.
 */

import { computed, ref, onMounted, nextTick } from 'vue'
import { T } from '../theme/tokens'
import { MD, type Fixture, type Zone } from '../data/catalog'
import { WCOL, type Wood } from '../data/materials'
import type { Mood } from '../data/moods'
import { zoneLm, zoneFxCount } from '../engine/zone-engine'

interface Props {
  zone: Zone
  fixtures: Fixture[]
  mood: Mood
  totalLm: number
  limit: number
}
const props = defineProps<Props>()
const emit = defineEmits<{
  add: []
  edit: [fxIdx: number]
  limitHit: []
  open: []
}>()

const accent = computed(() => props.mood.color)

interface FxGroup {
  key: string
  name: string
  wood: Wood
  units: number
  entries: { _idx: number }[]
}

/** Светильники зоны, схлопнутые по «модель + дерево». */
const groups = computed<FxGroup[]>(() => {
  const out: FxGroup[] = []
  props.fixtures.forEach((f, idx) => {
    if ((f.zone ?? 'ceiling') !== props.zone.id) return
    const name = MD[f.m]?.name ?? f.m
    const key = name + '|' + f.wood
    const q = f.q ?? 1
    const ex = out.find((g) => g.key === key)
    if (ex) {
      ex.units += q
      ex.entries.push({ _idx: idx })
    } else {
      out.push({ key, name, wood: f.wood, units: q, entries: [{ _idx: idx }] })
    }
  })
  return out
})

const isEmpty = computed(() => groups.value.length === 0)
const used = computed(() => zoneFxCount(props.fixtures, props.zone.id))
const full = computed(() => used.value >= props.limit)
const zPct = computed(() =>
  props.totalLm > 0 ? Math.round((zoneLm(props.fixtures, props.zone.id) / props.totalLm) * 100) : 0,
)

/* Затухание снизу — только если список длиннее карточки. */
const listEl = ref<HTMLElement | null>(null)
const overflowed = ref(false)
onMounted(async () => {
  await nextTick()
  const el = listEl.value
  if (el) overflowed.value = el.scrollHeight > el.clientHeight + 1
})

function onAdd() {
  if (full.value) emit('limitHit')
  else emit('add')
}
function onRow(g: FxGroup) {
  // Клик по модели открывает страницу светильника (первого в группе).
  // Список всех — через нижнюю плашку (emit('open')).
  emit('edit', g.entries[0]._idx)
}
function orbStyle(wood: Wood, size = 15) {
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
      position: 'relative',
      aspectRatio: '5 / 6',
      borderRadius: '16px',
      padding: '13px 14px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: `radial-gradient(ellipse 90% 70% at 20% 0%, rgba(255,255,255,0.09), transparent 62%), radial-gradient(ellipse 70% 60% at 100% 100%, ${accent}1f, transparent 70%), rgba(255,255,255,0.022)`,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.09), 0 4px 20px rgba(0,0,0,0.28)',
    }"
  >
    <!-- Шапка -->
    <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexShrink: 0 }">
      <span :style="{ display: 'flex', alignItems: 'center', minWidth: 0 }">
        <span :style="{ fontSize: '10px', fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }">
          {{ zone.name }}
        </span>
        <span
          v-if="zPct > 0"
          :style="{ marginLeft: '4px', padding: '1px 6px', borderRadius: '4px', background: accent + '20', fontSize: '11px', fontWeight: 600, color: accent }"
        >
          {{ zPct }}%
        </span>
      </span>

      <!-- Кнопка «+»: активная (тоновая) / приглушённая (лимит) -->
      <button
        :aria-label="full ? 'Лимит точек достигнут' : 'Добавить свет'"
        :style="full
          ? { width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(rgba(19,17,14,0.72), rgba(19,17,14,0.72)), ${accent}`, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }
          : { width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(${accent}38, ${accent}38), ${T.card}`, border: `1px solid ${accent}66`, boxShadow: `inset 0 0 10px ${accent}66, inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 7px rgba(0,0,0,0.32)`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }"
        @click.stop="onAdd"
      >
        <svg v-if="full" width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="accent" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" :style="{ display: 'block' }"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        <svg v-else width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#F4ECDD" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" :style="{ display: 'block', filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.5))' }"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
      </button>
    </div>

    <!-- Пустой стейт -->
    <button
      v-if="isEmpty"
      :style="{ flex: 1, minHeight: 0, marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }"
      @click="onAdd"
    >
      <span :style="{ fontSize: '15px', fontWeight: 600, color: T.text, textAlign: 'center', lineHeight: 1.3 }">Добавьте<br />свет</span>
    </button>

    <!-- Список моделей -->
    <div v-else ref="listEl" class="fxscroll" :style="{ flex: 1, minHeight: 0, overflowY: 'auto', marginTop: '8px', paddingRight: '4px', marginRight: '-4px' }">
      <button
        v-for="g in groups"
        :key="g.key"
        class="fxrow"
        :style="{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '6px 0', borderRadius: '9px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }"
        @click="onRow(g)"
      >
        <span :style="orbStyle(g.wood, 15)" />
        <span :style="{ flex: 1, fontSize: '14px', fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', maskImage: 'linear-gradient(to right, #000 82%, transparent)', WebkitMaskImage: 'linear-gradient(to right, #000 82%, transparent)' }">
          {{ g.name }}
        </span>
        <span
          v-if="g.units > 1"
          :style="{ fontSize: '13px', fontWeight: 700, color: T.text, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '7px', flexShrink: 0 }"
        >
          ×{{ g.units }}
        </span>
      </button>
    </div>

    <!-- Затухание снизу -->
    <div
      v-if="overflowed"
      :style="{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '96px', zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(26,22,18,0), rgba(26,22,18,0.92) 70%)' }"
    />

    <!-- Нижняя плашка: пипсы + стрелка -->
    <button
      aria-label="Открыть зону"
      :style="{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%', padding: '7px 8px 7px 11px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginTop: '8px' }"
      @click="emit('open')"
    >
      <span :style="{ display: 'flex', gap: '5px', flexWrap: 'wrap' }">
        <span
          v-for="i in limit" :key="i"
          :style="{ width: '9px', height: '9px', borderRadius: '50%', background: i <= used ? accent : 'transparent', border: `1.5px solid ${i <= used ? accent : T.textDim}` }"
        />
      </span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" :stroke="accent" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
    </button>
  </div>
</template>

<style scoped>
.fxscroll::-webkit-scrollbar { width: 4px; }
.fxscroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.18); border-radius: 2px; }
.fxscroll::-webkit-scrollbar-track { background: transparent; }
.fxscroll { scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.18) transparent; }
.fxrow { transition: background 0.15s ease; }
.fxrow:hover { background: rgba(255, 255, 255, 0.05); }
.fxrow:active { background: rgba(255, 255, 255, 0.09); }
</style>
