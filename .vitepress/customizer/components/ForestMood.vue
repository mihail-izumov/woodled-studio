<script setup lang="ts">
/**
 * ForestMood.vue — блок настроения как ЛЕСНАЯ СЦЕНА.
 *
 * Имя (порода × место) + легенда + слайдер карточек «Как это работает».
 * Получает готовые scene + knobs из RoomDetail (там реактивные computed) —
 * сам ничего не считает. Иначе глубокая реактивность по props.room терялась
 * на границе пропса и карточки не обновлялись при изменении набора.
 */
import { ref, onMounted, nextTick } from 'vue'
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
const atStart = ref(true)
const atEnd = ref(false)
function onScroll() {
  const el = sliderRef.value
  const n = props.knobs.length
  if (!el || n === 0) return
  active.value = Math.min(n - 1, Math.max(0, Math.round(el.scrollLeft / (el.scrollWidth / n))))
  atStart.value = el.scrollLeft <= 2
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
}
function goTo(i: number) {
  const el = sliderRef.value
  const n = props.knobs.length
  if (!el || n === 0) return
  el.scrollTo({ left: (el.scrollWidth / n) * i, behavior: 'smooth' })
}
onMounted(() => {
  nextTick(() => onScroll())
})
</script>

<template>
  <div
    :style="{
      background: 'transparent',
      padding: '24px 0 4px',
      marginBottom: '20px',
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

    <div :style="{ textAlign: 'center', fontSize: '17px', fontWeight: 700, color: T.text, marginTop: '8px' }">
      {{ props.scene.name }}
    </div>

    <div
      :style="{
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 500,
        color: T.text,
        lineHeight: 1.55,
        maxWidth: '360px',
        margin: '8px auto 0',
      }"
    >
      {{ props.scene.legend }}
    </div>

    <div :style="{ textAlign: 'center', marginTop: '16px' }">
      <button
        :style="{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '9px',
          padding: '9px 20px',
          borderRadius: '999px',
          background: props.tint + '1e',
          border: 'none',
          color: props.tint,
          cursor: 'pointer',
          fontSize: '14px',
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
      <div :style="{ height: '28px' }" />

      <div :style="{ position: 'relative' }">
        <div ref="sliderRef" class="fm-slider" @scroll="onScroll">
          <div
            v-for="(k, i) in props.knobs"
            :key="i"
            class="fm-slide"
            :style="{
              background: `linear-gradient(135deg, ${props.tint}1c, ${props.tint}0c), ${T.card}`,
              border: 'none',
              borderRadius: '16px',
              padding: '18px',
            }"
          >
            <div :style="{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }">
              <span :style="{ fontSize: '16px', fontWeight: 700, color: T.text }">{{ k.title }}</span>
              <span
                v-if="k.chip"
                :style="{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: props.tint,
                  background: props.tint + '33',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                }"
              >
                <!-- Цветной кружок, если карточка прокинула swatch (карточка
                     «Стены» при заданном wallColor). -->
                <span
                  v-if="k.swatch"
                  :style="{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: k.swatch,
                    border: '1px solid rgba(255,255,255,0.15)',
                    flexShrink: 0,
                  }"
                  aria-hidden="true"
                />
                {{ k.chip }}
              </span>
            </div>
            <div :style="{ fontSize: '14px', color: 'rgba(232,224,212,0.82)', lineHeight: 1.55 }">{{ k.text }}</div>
          </div>
        </div>
        <div
          aria-hidden="true"
          :style="{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '28px',
            pointerEvents: 'none',
            opacity: atStart ? 0 : 1,
            transition: 'opacity .2s',
            background: `linear-gradient(90deg, ${T.bg} 0%, ${T.bg}cc 40%, ${T.bg}00 100%)`,
          }"
        />
        <div
          aria-hidden="true"
          :style="{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '28px',
            pointerEvents: 'none',
            opacity: atEnd ? 0 : 1,
            transition: 'opacity .2s',
            background: `linear-gradient(270deg, ${T.bg} 0%, ${T.bg}cc 40%, ${T.bg}00 100%)`,
          }"
        />
      </div>

      <div :style="{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px' }">
        <button
          v-for="(k, i) in props.knobs"
          :key="i"
          type="button"
          :aria-label="`К карточке ${i + 1}`"
          @click="goTo(i)"
          :style="{
            height: '12px',
            width: i === active ? '32px' : '12px',
            borderRadius: '6px',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            transition: 'all .2s',
            background: i === active ? props.tint : 'rgba(255,255,255,0.22)',
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
  min-height: 140px;
}
.rotor-dash {
  display: inline-block;
  width: 24px;
  height: 24px;
  position: relative;
  flex-shrink: 0;
}
.rotor-dash-l {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 6.5px;
  margin: -3.25px 0 0 -1px;
  border-radius: 1px;
  background: var(--rc, #b4915a);
  transform-origin: 50% 50%;
  animation: rotorDashCycle 5000ms ease-in-out infinite;
  opacity: 0;
}
@keyframes rotorDashCycle {
  0%   { transform: rotate(var(--rot)) translateY(-18px) scale(0.3); opacity: 0; }
  5%   { transform: rotate(var(--rot)) translateY(-9px) scale(1);   opacity: 0.7; }
  80%  { transform: rotate(var(--rot)) translateY(-9px) scale(1);   opacity: 0.7; }
  90%  { transform: rotate(var(--rot)) translateY(-18px) scale(0.3); opacity: 0; }
  100% { transform: rotate(var(--rot)) translateY(-18px) scale(0.3); opacity: 0; }
}
</style>
