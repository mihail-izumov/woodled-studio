<script setup lang="ts">
/**
 * RoomCard.vue — Карточка комнаты на главном экране (редизайн).
 *
 * Раскладка (full-width, одна колонка, фикс minHeight):
 *   ВЕРХ:    [палитра 40px]  имя · НАСТРОЕНИЕ caps под именем   [вход 40px стекло]
 *   СЕРЕДИНА: солнце-на-линии — источник света: ярче у себя, заливает активную
 *             (левую) часть, чуть подсвечивает пассивную (правую), гаснет к краям.
 *   НИЗ:     [тэлли: круг-сумма + глянцевые шары дерева]  [бейдж яркости]
 *   ПУСТО:   ротор + пульс-«плюс» по центру, без стрелки.
 *
 * Цветовая логика: всё тонируется под цвет комнаты (cardColor / T.neutral).
 *   lightCc / darkCc — светлый/тёмный замес для переливающейся грани и линии.
 *   Единственное «не в цвете» — дерево (WCOL). Свечение только у солнца (контент).
 *
 * Glass-border: заливка непрозрачная (clip→padding-box, тело без волн),
 *   рамка (clip→border-box) переливается оттенками комнаты.
 *
 * overflow: visible при свете (иначе режутся тени кнопок), hidden — только для
 *   ротора пустой карточки.
 */

import { computed } from 'vue'
import { T, WCOL, type Wood } from '../theme/tokens'
import { getBright } from '../data/moods'
import { baseLm, fxLm } from '../engine/brightness'
import { forestScene } from '../engine/forest'
import { getRT, type Room } from '../data/rooms'

interface Props {
  room: Room
}
const props = defineProps<Props>()
const emit = defineEmits<{ click: []; pickColor: [] }>()

/* ─── Цветовые помощники ─── */
function hexToRgb(h: string) {
  const c = h.replace('#', '')
  return { r: parseInt(c.slice(0, 2), 16), g: parseInt(c.slice(2, 4), 16), b: parseInt(c.slice(4, 6), 16) }
}
function rgbToHex(r: number, g: number, b: number) {
  const f = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${f(r)}${f(g)}${f(b)}`
}
function mix(c1: string, c2: string, ratio: number) {
  const a = hexToRgb(c1), b = hexToRgb(c2)
  return rgbToHex(a.r * (1 - ratio) + b.r * ratio, a.g * (1 - ratio) + b.g * ratio, a.b * (1 - ratio) + b.b * ratio)
}

/* ─── Ламели пустого ротора (тон под cardColor) ─── */
const OAK_LIGHT = '#d4b87a', OAK_MID = '#b4915a', OAK_DARK = '#8a6e3e'
const lam = computed(() => {
  const cc = props.room.cardColor
  if (!cc) return { light: OAK_LIGHT, mid: OAK_MID, dark: OAK_DARK }
  return { light: mix(OAK_LIGHT, cc, 0.5), mid: mix(OAK_MID, cc, 0.5), dark: mix(OAK_DARK, cc, 0.5) }
})

/* ─── Данные комнаты ─── */
const rt = computed(() => getRT(props.room.typeId))
const base = computed(() => baseLm(rt.value, props.room))
const actual = computed(() => fxLm(props.room.fixtures))
const ratio = computed(() => (base.value > 0 ? actual.value / base.value : 0))
const scene = computed(() => forestScene(rt.value, props.room))
const isEmpty = computed(() => props.room.fixtures.length === 0)
const bright = computed(() => getBright(ratio.value).name)

const cc = computed(() => props.room.cardColor || T.neutral)
const lightCc = computed(() => mix(cc.value, '#FFFFFF', 0.48))
const darkCc = computed(() => mix(cc.value, T.bg, 0.5))

const roomName = computed(() => props.room.customName || rt.value.name)
const needsFade = computed(() => roomName.value.length > 14)

/* ─── Тэлли по дереву (только WOODLED; кастомы другого бренда не считаем) ─── */
const WOOD_ORDER: Wood[] = ['oak', 'walnut', 'black']
const tally = computed(() => {
  const counts: Record<Wood, number> = { oak: 0, walnut: 0, black: 0 }
  let total = 0
  for (const it of props.room.fixtures) {
    if (it.custom) continue
    const wood = (it.wood ?? 'oak') as Wood
    const q = it.q ?? 1
    counts[wood] += q
    total += q
  }
  return { counts, total }
})
const woods = computed(() => WOOD_ORDER.filter((w) => tally.value.counts[w] > 0))

/* глянцевый 3D-шар дерева (treeStyle) */
function sphere(wood: Wood, size = 18) {
  const color = WCOL[wood]; const { r, g, b } = hexToRgb(color)
  return {
    width: `${size}px`, height: `${size}px`, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
    background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.45), transparent 50%), radial-gradient(circle at 65% 70%, rgba(0,0,0,0.15), transparent 55%), ${color}`,
    border: wood === 'black' ? '1px solid rgba(19,17,14,0.5)' : 'none',
    boxShadow: `inset 0 -1px 1.5px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.15), 0 0 8px rgba(${r},${g},${b},0.35), 0 1px 3px rgba(0,0,0,0.35)`,
  }
}

/* ─── Прогресс: позиция солнца «женится» с системой отступов ─── */
const GAP = 15
const SR = 11
const pct = computed(() => Math.min(100, Math.max(0, Math.round(ratio.value * 100))))
const sunPos = computed(() => `clamp(${SR}px, ${pct.value}%, calc(100% - ${SR}px))`)

/* ─── Стиль карточки ─── */
const cardStyle = computed(() => ({
  position: 'relative' as const,
  overflow: isEmpty.value ? ('hidden' as const) : ('visible' as const),
  boxSizing: 'border-box' as const,
  background: `linear-gradient(135deg, ${mix(T.bg, cc.value, 0.15)}, ${mix(T.bg, cc.value, 0.05)}) padding-box, linear-gradient(125deg, ${lightCc.value} 0%, ${cc.value} 20%, ${darkCc.value} 44%, ${cc.value} 66%, ${lightCc.value} 88%, ${cc.value} 100%) border-box`,
  border: '1.5px solid transparent',
  borderRadius: '16px',
  padding: '16px',
  boxShadow: `0 0 12px ${cc.value}1A, 0 6px 20px rgba(0,0,0,0.4)`,
  cursor: 'pointer',
  minHeight: '156px',
  display: 'flex',
  flexDirection: 'column' as const,
}))

const tap = {
  width: '44px', height: '44px', padding: 0, border: 'none', background: 'transparent',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, overflow: 'visible' as const,
}
</script>

<template>
  <div :style="cardStyle" @click="emit('click')">
    <!-- ═══ ПУСТО: ротор + пульс-«плюс» ═══ -->
    <template v-if="isEmpty">
      <div
        :style="{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '130px', height: '130px', opacity: 0.25, pointerEvents: 'none', zIndex: 0,
          filter: `drop-shadow(0 8px 18px ${room.cardColor ? room.cardColor + '50' : '#00000080'}) drop-shadow(0 2px 4px rgba(0,0,0,0.3))`,
        }"
        aria-hidden="true"
      >
        <div class="rotor-card">
          <div
            v-for="i in 12"
            :key="i"
            class="rotor-card-l"
            :style="{ '--rot': ((i - 1) / 12 * 360) + 'deg', animationDelay: `${((i - 1) * 0.144).toFixed(3)}s`, background: `linear-gradient(to bottom, ${lam.light}, ${lam.mid}, ${lam.dark})` }"
          />
        </div>
      </div>
      <div class="rotor-pulse" :style="{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 1 }" aria-hidden="true">
        <div class="rotor-pulse-ring" :style="{ borderColor: lam.mid }">
          <svg width="22" height="22" viewBox="0 0 22 22" :style="{ display: 'block' }">
            <line x1="11" y1="4" x2="11" y2="18" :stroke="lam.light" stroke-width="3" stroke-linecap="round" />
            <line x1="4" y1="11" x2="18" y2="11" :stroke="lam.light" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>
      </div>
    </template>

    <!-- ═══ ВЕРХ: палитра · (имя + настроение) · вход ═══ -->
    <div :style="{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', zIndex: 2, overflow: 'visible' }">
      <!-- палитра — приглушённая объёмная монетка -->
      <button :style="tap" title="Цвет комнаты" @click.stop="emit('pickColor')">
        <span
          :style="{
            width: '40px', height: '40px', borderRadius: '50%',
            background: `radial-gradient(circle at 33% 28%, rgba(255,255,255,0.28), transparent 52%), ${cc}22`,
            border: `1.5px solid ${cc}55`,
            boxShadow: `inset 0 2px 2.5px rgba(255,255,255,0.32), inset 0 -2px 3px rgba(0,0,0,0.24), 0 2px 6px rgba(0,0,0,0.4)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }"
        >
          <span :style="{ display: 'flex', filter: 'drop-shadow(0 1px 0.5px rgba(0,0,0,0.5))' }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" :stroke="mix(cc, '#FFFFFF', 0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
              <circle cx="13.5" cy="6.5" r="1.5" :fill="mix(cc, '#FFFFFF', 0.4)" stroke="none" />
              <circle cx="17.5" cy="10.5" r="1.5" :fill="mix(cc, '#FFFFFF', 0.4)" stroke="none" />
              <circle cx="6.5" cy="12.5" r="1.5" :fill="mix(cc, '#FFFFFF', 0.4)" stroke="none" />
              <circle cx="8.5" cy="7.5" r="1.5" :fill="mix(cc, '#FFFFFF', 0.4)" stroke="none" />
            </svg>
          </span>
        </span>
      </button>

      <!-- имя + настроение (caps под именем) -->
      <div :style="{ flex: 1, minWidth: 0, padding: '0 2px' }">
        <div
          :style="{
            whiteSpace: 'nowrap', overflow: 'hidden', fontSize: '19px', fontWeight: 700, color: T.text, lineHeight: 1.15,
            ...(needsFade ? { WebkitMaskImage: 'linear-gradient(to right,#000 calc(100% - 20px),transparent)', maskImage: 'linear-gradient(to right,#000 calc(100% - 20px),transparent)' } : {}),
          }"
        >{{ roomName }}</div>
        <div
          v-if="!isEmpty"
          :style="{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: cc, lineHeight: 1, marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }"
        >{{ bright }}</div>
      </div>

      <!-- вход — объёмный стеклянный шар (без halo: свечение отдано солнцу) -->
      <button v-if="!isEmpty" :style="tap" title="Войти" @click.stop="emit('click')">
        <span
          :style="{
            width: '40px', height: '40px', borderRadius: '50%',
            background: `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.55), transparent 46%), radial-gradient(circle at 70% 80%, rgba(0,0,0,0.18), transparent 55%), linear-gradient(140deg, ${cc}, ${cc}cc)`,
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: `0 3px 8px rgba(0,0,0,0.42), inset 0 1px 1.5px rgba(255,255,255,0.55), inset 0 -2px 4px rgba(0,0,0,0.18)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="mix(T.bg, cc, 0.35)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" :style="{ filter: 'drop-shadow(0 1px 0.5px rgba(255,255,255,0.4))', transform: 'translateX(0.5px)' }">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </button>
    </div>

    <!-- ═══ СЕРЕДИНА: солнце-на-линии ═══ -->
    <div v-if="!isEmpty" :style="{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }">
      <div :style="{ position: 'relative', height: '22px', flex: 1, margin: '0 2px 0 0' }">
        <!-- активная (левая): свет от солнца — ярче у солнца, гаснет влево -->
        <div :style="{ position: 'absolute', left: 0, width: `calc(${sunPos} - ${GAP}px)`, top: '50%', height: '2px', borderRadius: '2px', background: `linear-gradient(90deg, ${cc}55 0%, ${cc} 70%, ${lightCc} 100%)`, transform: 'translateY(-50%)' }" />
        <!-- пассивная (правая): лёгкий отсвет у солнца, быстро гаснет -->
        <div :style="{ position: 'absolute', left: `calc(${sunPos} + ${GAP}px)`, right: 0, top: '50%', height: '2px', borderRadius: '2px', background: `linear-gradient(90deg, ${cc}4D 0%, ${cc}12 45%, ${cc}0D 100%)`, transform: 'translateY(-50%)' }" />
        <!-- солнце-источник: рассеянное свечение + иконка -->
        <div :style="{ position: 'absolute', left: sunPos, top: '50%', transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
          <div :style="{ position: 'absolute', width: '42px', height: '42px', borderRadius: '50%', background: `radial-gradient(circle, ${cc}33 0%, ${cc}0F 42%, transparent 80%)`, filter: 'blur(6px)', pointerEvents: 'none' }" />
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" :stroke="lightCc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ filter: `drop-shadow(0 0 2px ${cc}99)`, position: 'relative' }">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>
      </div>
    </div>

    <!-- ═══ НИЗ: тэлли + бейдж яркости (на узкой — бейдж переносится) ═══ -->
    <div v-if="!isEmpty" :style="{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', position: 'relative', zIndex: 2 }">
      <div
        :style="{
          display: 'inline-flex', alignItems: 'center', gap: '13px', padding: '0 14px 0 0', height: '32px',
          border: `1.5px solid ${cc}3D`, borderRadius: '999px', background: `${cc}0A`, lineHeight: 1, boxSizing: 'border-box',
        }"
      >
        <!-- сумма — круг во всю высоту, перекрывает обводку слева -->
        <span
          :style="{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', flexShrink: 0, marginLeft: '-1.5px',
            background: mix(T.bg, cc, 0.34), color: mix(T.text, cc, 0.45), borderRadius: '50%', fontSize: '12px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)',
          }"
        >{{ tally.total }}</span>
        <span v-for="w in woods" :key="w" :style="{ display: 'inline-flex', alignItems: 'center', gap: '5px', lineHeight: 1 }">
          <span :style="sphere(w)" />
          <span :style="{ fontSize: '12px', fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }">{{ tally.counts[w] }}</span>
        </span>
      </div>

      <span
        :style="{
          display: 'inline-flex', alignItems: 'center', height: '32px', padding: '0 13px', borderRadius: '999px', boxSizing: 'border-box',
          background: cc + '1F', border: `1.5px solid ${cc}3D`, color: cc, fontSize: '12px', fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap',
        }"
      >{{ scene.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.rotor-card {
  width: 100%;
  height: 100%;
  position: relative;
  animation: rotorCardSpin 90s linear infinite;
}
.rotor-card-l {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 36px;
  margin: -18px 0 0 -2px;
  border-radius: 2px;
  transform-origin: 50% 50%;
  animation: rotorCardCycle 12s ease-in-out infinite;
  opacity: 0;
}
@keyframes rotorCardSpin {
  to { transform: rotate(360deg); }
}
@keyframes rotorCardCycle {
  0%   { transform: rotate(var(--rot)) translateY(-60px) scale(0.3); opacity: 0; }
  5%   { transform: rotate(var(--rot)) translateY(-45px) scale(1);   opacity: 0.95; }
  80%  { transform: rotate(var(--rot)) translateY(-45px) scale(1);   opacity: 0.95; }
  90%  { transform: rotate(var(--rot)) translateY(-60px) scale(0.3); opacity: 0; }
  100% { transform: rotate(var(--rot)) translateY(-60px) scale(0.3); opacity: 0; }
}
.rotor-pulse {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: rotorPulse 12s ease-in-out infinite;
}
.rotor-pulse-ring {
  width: 42px;
  height: 42px;
  border: 3px solid;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  box-sizing: border-box;
}
@keyframes rotorPulse {
  0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(0.92); }
  50%      { opacity: 1;    transform: translate(-50%, -50%) scale(1.1);  }
}
</style>
