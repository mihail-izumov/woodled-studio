<script setup lang="ts">
/**
 * RoomCard.vue — Карточка комнаты на главном экране.
 *
 * batch11 #7 (#2): Левый padding пилюли увеличен до 14px (визуальный воздух
 *   перед текстом). Обёртка с padding 0 6px — пилюля не упирается в края
 *   карточки. Длинные названия скрываются маской с fade-to-transparent.
 *
 * batch11 #7 (#4): Анимация в центре синхронизирована с rotor cycle (12s),
 *   pulseOffset = cardCycleOffset чтобы фаза совпадала с появлением ламелей.
 *   Кольцо толще (3px), плюс — SVG со stroke-linecap round (жирные
 *   скруглённые штрихи как ламели). Цвета ламелей + кольца + плюса
 *   тонируются под cardColor (50% mix с дубовой гаммой) — каждая
 *   карточка получает анимацию в своём цвете.
 *
 * batch11 #8 (#1): nameTextStyle стал computed — маска fade применяется
 *   ТОЛЬКО для длинных названий (> 8 символов). Стандартные названия
 *   комнат (Гостиная, Спальня, Кухня и т.д.) не затрагиваются.
 */

import { computed } from 'vue'
import { T, WCOL } from '../theme/tokens'
import { MD } from '../data/catalog'
import { MATS } from '../data/materials'
import { autoMood } from '../data/moods'
import { baseLm, fxLm } from '../engine/brightness'
import { getRT, type Room } from '../data/rooms'
import Icon, { fxIcName } from './ui/Icons.vue'

interface Props {
  room: Room
}
const props = defineProps<Props>()
const emit = defineEmits<{ click: []; pickColor: [] }>()

const rt = computed(() => getRT(props.room.typeId))
const base = computed(() => baseLm(rt.value, props.room))
const actual = computed(() => fxLm(props.room.fixtures))
const ratio = computed(() => (base.value > 0 ? actual.value / base.value : 0))
const mood = computed(() => autoMood(ratio.value))

// Per-instance offset для десинхронизации между карточками
const cardSpinOffset = `-${(Math.random() * 90).toFixed(2)}s`
const cardCycleOffset = `-${(Math.random() * 12).toFixed(2)}s`

/**
 * batch11 #7 (#4): Цветовое тонирование ламелей + пульса.
 * 50% mix дубовой гаммы с cardColor — сохраняет дубовую природу,
 * добавляет оттенок выбранного цвета карточки.
 */
const OAK_LIGHT = '#d4b87a'
const OAK_MID = '#b4915a'
const OAK_DARK = '#8a6e3e'

function hexToRgb(h: string): [number, number, number] {
  const c = h.replace('#', '')
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ]
}
function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}
function mix(c1: string, c2: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(c1)
  const [r2, g2, b2] = hexToRgb(c2)
  return rgbToHex(
    r1 * (1 - ratio) + r2 * ratio,
    g1 * (1 - ratio) + g2 * ratio,
    b1 * (1 - ratio) + b2 * ratio,
  )
}

const lamellaColors = computed(() => {
  const cc = props.room.cardColor
  if (!cc) return { light: OAK_LIGHT, mid: OAK_MID, dark: OAK_DARK }
  return {
    light: mix(OAK_LIGHT, cc, 0.5),
    mid: mix(OAK_MID, cc, 0.5),
    dark: mix(OAK_DARK, cc, 0.5),
  }
})

const cardStyle = computed(() => {
  const isEmpty = mood.value.id === 'empty'
  const cc = props.room.cardColor
  const tint = cc ?? (isEmpty ? null : T.neutral)
  return {
    background: tint ? `linear-gradient(135deg, ${tint}22, ${tint}08)` : T.card,
    border: `1px solid ${tint ? tint + '44' : T.border}`,
    borderRadius: '12px',
    padding: '14px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    minHeight: '160px',
    textAlign: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }
})

/**
 * batch11 #7 (#2): Обёртка вокруг бейджа — даёт 6px воздуха с боков
 * чтобы пилюля не упиралась в края карточки.
 */
const badgeWrapStyle = {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  padding: '0 6px',
  boxSizing: 'border-box' as const,
  position: 'relative' as const,
  zIndex: 2,
}

/**
 * batch11 #7 (#2): Левый padding 14 (визуальный воздух перед текстом),
 * правый 8 (вплотную к иконке палитры). Max-width: 100% от wrap.
 */
const badgeStyle = computed(() => {
  const cc = props.room.cardColor
  const tint = cc ?? (mood.value.id === 'empty' ? null : T.neutral)
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 8px 8px 14px',
    borderRadius: '999px',
    background: cc
      ? `linear-gradient(135deg, ${cc}cc, ${cc}88)`
      : tint ? tint + '30' : T.border,
    fontSize: '17px',
    fontWeight: 600,
    color: '#fff',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
    minWidth: 0,
  }
})

/**
 * batch11 #8 (#1): Маска fade-to-transparent ТОЛЬКО для длинных названий.
 * Стандартные названия (Гостиная, Спальня и т.д. — все ≤ 8 символов)
 * отображаются полностью без маски. Пользовательские длинные названия
 * получают fade на правом краю.
 */
const nameTextStyle = computed(() => {
  const needsFade = roomName.value.length > 8
  return {
    flex: 1,
    minWidth: 0,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    display: 'block',
    ...(needsFade ? {
      WebkitMaskImage: 'linear-gradient(to right, #000 calc(100% - 16px), transparent)',
      maskImage: 'linear-gradient(to right, #000 calc(100% - 16px), transparent)',
    } : {}),
  }
})

const bgShadowColor = computed(() => {
  const cc = props.room.cardColor
  return cc ? cc + '50' : '#00000080'
})

interface Circle {
  key: string; type: string; wood: string; color: string; matName: string; isBlack: boolean
}

const circles = computed<Circle[]>(() => {
  const out: Circle[] = []
  props.room.fixtures.forEach((it, i) => {
    const md = MD[it.m]
    if (!md) return
    const wood = it.wood ?? 'oak'
    const col = WCOL[wood]
    const matName = MATS.find((x) => x.id === wood)?.name ?? 'Дуб'
    const q = it.q ?? 1
    for (let j = 0; j < q; j++) {
      out.push({ key: `${i}-${j}`, type: md.type, wood, color: col, matName, isBlack: wood === 'black' })
    }
  })
  return out
})

const paletteIconColor = computed(() => '#fff')
const roomName = computed(() => props.room.customName || rt.value.name)
</script>

<template>
  <div :style="cardStyle" @click="emit('click')">
    <!-- ═══ BG-ротор: ламели в дубово-тонированных цветах карточки ═══ -->
    <div
      v-if="mood.id === 'empty'"
      :style="{
        position: 'absolute',
        top: '54%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '130px',
        height: '130px',
        opacity: 0.25,
        filter: `drop-shadow(0 8px 18px ${bgShadowColor}) drop-shadow(0 2px 4px rgba(0,0,0,0.3))`,
        pointerEvents: 'none',
        zIndex: 0,
        '--lc1': lamellaColors.light,
        '--lc2': lamellaColors.mid,
        '--lc3': lamellaColors.dark,
      }"
      aria-hidden="true"
    >
      <div class="rotor-card" :style="{ animationDelay: cardSpinOffset }">
        <div
          v-for="i in 12"
          :key="i"
          class="rotor-card-l"
          :style="{
            '--rot': ((i - 1) / 12 * 360) + 'deg',
            animationDelay: `calc(${cardCycleOffset} + ${((i - 1) * 0.144).toFixed(3)}s)`,
          }"
        />
      </div>
    </div>

    <!-- ═══ batch11 #7 (#4): пульсирующий «+» в круге, синхронизирован с cycle ═══ -->
    <div
      v-if="mood.id === 'empty'"
      class="rotor-pulse"
      :style="{
        position: 'absolute',
        top: '54%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 1,
        animationDelay: cardCycleOffset,
        '--lc-mid': lamellaColors.mid,
        '--lc-light': lamellaColors.light,
      }"
      aria-hidden="true"
    >
      <div class="rotor-pulse-ring">
        <svg width="22" height="22" viewBox="0 0 22 22" :style="{ display: 'block' }">
          <line
            x1="11" y1="4" x2="11" y2="18"
            :stroke="lamellaColors.light"
            stroke-width="3"
            stroke-linecap="round"
          />
          <line
            x1="4" y1="11" x2="18" y2="11"
            :stroke="lamellaColors.light"
            stroke-width="3"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </div>

    <!-- ═══ Бейдж: обёртка с воздухом + пилюля с маской ═══ -->
    <div :style="badgeWrapStyle">
      <div :style="badgeStyle">
        <span :style="nameTextStyle">{{ roomName }}</span>
        <button
          :style="{
            background: 'rgba(255,255,255,0.18)',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            flexShrink: 0,
          }"
          @click.stop="emit('pickColor')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" :stroke="paletteIconColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/>
            <circle cx="13.5" cy="6.5" r="1.5" :fill="paletteIconColor" stroke="none"/>
            <circle cx="17.5" cy="10.5" r="1.5" :fill="paletteIconColor" stroke="none"/>
            <circle cx="6.5" cy="12.5" r="1.5" :fill="paletteIconColor" stroke="none"/>
            <circle cx="8.5" cy="7.5" r="1.5" :fill="paletteIconColor" stroke="none"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ═══ Filled state: круги светильников ═══ -->
    <template v-if="mood.id !== 'empty'">
      <div
        :style="{
          display: 'flex',
          gap: '8px',
          marginTop: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2,
        }"
      >
        <div v-if="circles.length === 0" :style="{ fontSize: '11px', color: T.textDim, padding: '12px 0' }">
          Добавьте свет
        </div>
        <div
          v-for="c in circles"
          :key="c.key"
          :style="{ textAlign: 'center', width: '44px' }"
        >
          <div
            :style="{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: c.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              border: c.isBlack ? `2px solid ${T.textDim}` : 'none',
            }"
          >
            <Icon :name="fxIcName(c.type as any)" :color="T.bg" :size="16" />
          </div>
          <div
            :style="{
              fontSize: '11px',
              fontWeight: 500,
              color: T.text,
              marginTop: '4px',
              lineHeight: 1.2,
              opacity: 0.85,
            }"
          >
            {{ c.matName }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.rotor-card {
  width: 100%;
  height: 100%;
  position: relative;
  animation: rotorCardSpin 90s linear infinite;
}

/* batch11 #7 (#4): цвета через CSS-переменные — тонируются под cardColor */
.rotor-card-l {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 36px;
  margin: -18px 0 0 -2px;
  border-radius: 2px;
  background: linear-gradient(to bottom, var(--lc1, #d4b87a), var(--lc2, #b4915a), var(--lc3, #8a6e3e));
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

/* batch11 #7 (#4): пульс синхронизирован с cycle (12s, тот же offset).
   Толще, тонированный, со скруглёнными штрихами на «+». */
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
  border: 3px solid var(--lc-mid, #b4915a);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  box-sizing: border-box;
}

/* Pulse в фазе с rotor cycle:
   - 0/100% (момент исчезновения ламелей): минимум — opacity 0.35, scale 0.9
   - 50% (момент пика яркости ламелей):    максимум — opacity 1, scale 1.1
*/
@keyframes rotorPulse {
  0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(0.92); }
  50%      { opacity: 1;    transform: translate(-50%, -50%) scale(1.1);  }
}
</style>
