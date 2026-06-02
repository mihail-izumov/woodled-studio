<script setup lang="ts">
/**
 * ForestMood.vue — блок настроения как ЛЕСНАЯ СЦЕНА.
 *
 * Имя (порода × место) + легенда + слайдер карточек «Как это работает».
 * Получает готовые scene + knobs из RoomDetail (там реактивные computed) —
 * сам ничего не считает. Иначе глубокая реактивность по props.room терялась
 * на границе пропса и карточки не обновлялись при изменении набора.
 */
import { ref } from 'vue'
import { T } from '../theme/tokens'
import type { ForestScene, KnobCard } from '../engine/forest'

interface Props {
  scene: ForestScene
  knobs: KnobCard[]
  tint: string
  roomPrepName: string
}
const props = defineProps<Props>()
const emit = defineEmits<{ showHelp: [] }>()

const sliderRef = ref<HTMLElement | null>(null)
const active = ref(0)
function onScroll() {
  const el = sliderRef.value
  const n = props.knobs.length
  if (!el || n === 0) return
  active.value = Math.min(n - 1, Math.max(0, Math.round(el.scrollLeft / (el.scrollWidth / n))))
}
</script>

<template>
  <div
    :style="{
      border: `1px solid ${props.tint}`,
      background: props.tint + '0a',
      borderRadius: '16px',
      padding: '18px 14px 18px',
      marginBottom: '16px',
    }"
  >
    <div
      :style="{
        textAlign: 'center',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '2.5px',
        color: props.tint + 'bb',
      }"
    >
      Настроение {{ props.roomPrepName }}
    </div>

    <div :style="{ textAlign: 'center', fontSize: '22px', fontWeight: 700, color: T.text, marginTop: '10px' }">
      {{ props.scene.name }}
    </div>

    <div
      :style="{
        textAlign: 'center',
        fontSize: '13px',
        color: T.textSec,
        lineHeight: 1.6,
        maxWidth: '340px',
        margin: '8px auto 0',
      }"
    >
      {{ props.scene.legend }}
    </div>

    <div :style="{ textAlign: 'center', marginTop: '14px' }">
      <button
        :style="{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '6px 14px',
          borderRadius: '999px',
          background: props.tint + '1e',
          border: 'none',
          color: props.tint,
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'inherit',
        }"
        @click="emit('showHelp')"
      >
        <span class="rotor-dash" :style="{ '--rc': props.tint }" aria-hidden="true">
          <span
            v-for="i in 10"
            :key="i"
            class="rotor-dash-l"
            :style="{ '--rot': ((i - 1) / 10 * 360) + 'deg', animationDelay: ((i - 1) * 30) + 'ms' }"
          />
        </span>
        WOODLED Smart
      </button>
    </div>

    <template v-if="props.knobs.length > 0">
      <div :style="{ height: '1px', background: T.border, margin: '16px 0 14px' }" />

      <div ref="sliderRef" class="fm-slider" @scroll="onScroll">
        <div
          v-for="(k, i) in props.knobs"
          :key="i"
          class="fm-slide"
          :style="{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '13px', padding: '14px' }"
        >
          <div :style="{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '7px' }">
            <span :style="{ fontSize: '14px', fontWeight: 700, color: T.text }">{{ k.title }}</span>
            <span
              v-if="k.chip"
              :style="{
                marginLeft: 'auto',
                fontSize: '10px',
                fontWeight: 700,
                color: props.tint,
                background: props.tint + '1e',
                padding: '2px 7px',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
              }"
            >
              {{ k.chip }}
            </span>
          </div>
          <div :style="{ fontSize: '12.5px', color: T.textSec, lineHeight: 1.55 }">{{ k.text }}</div>
        </div>
      </div>

      <div :style="{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }">
        <span
          v-for="(k, i) in props.knobs"
          :key="i"
          :style="{
            height: '6px',
            borderRadius: '3px',
            transition: 'all .2s',
            width: i === active ? '16px' : '6px',
            background: i === active ? props.tint : 'rgba(255,255,255,0.18)',
          }"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.fm-slider {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.fm-slider::-webkit-scrollbar {
  display: none;
}
.fm-slide {
  flex: 0 0 82%;
  scroll-snap-align: center;
  min-height: 116px;
}
.rotor-dash {
  display: inline-block;
  width: 18px;
  height: 18px;
  position: relative;
  flex-shrink: 0;
}
.rotor-dash-l {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1.5px;
  height: 5px;
  margin: -2.5px 0 0 -0.75px;
  border-radius: 1px;
  background: var(--rc, #b4915a);
  transform-origin: 50% 50%;
  animation: rotorDashCycle 5000ms ease-in-out infinite;
  opacity: 0;
}
@keyframes rotorDashCycle {
  0%   { transform: rotate(var(--rot)) translateY(-14px) scale(0.3); opacity: 0; }
  5%   { transform: rotate(var(--rot)) translateY(-7px) scale(1);   opacity: 0.7; }
  80%  { transform: rotate(var(--rot)) translateY(-7px) scale(1);   opacity: 0.7; }
  90%  { transform: rotate(var(--rot)) translateY(-14px) scale(0.3); opacity: 0; }
  100% { transform: rotate(var(--rot)) translateY(-14px) scale(0.3); opacity: 0; }
}
</style>
