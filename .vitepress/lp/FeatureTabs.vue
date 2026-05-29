<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { PAGE } from './tokens'

/**
 * Sliding-pill segmented control. A single absolute-positioned white pill
 * sits behind the tab labels and translates/resizes to align with the active
 * tab via template refs. This avoids the visual jump caused by swapping
 * background-color on each button (the previous implementation).
 */

const FEATURES = [
  {
    label: 'Без регистрации',
    text: 'Никто не увидит ваш дом, если не хотите. Вы решаете, что показать и кому отправить.',
  },
  {
    label: 'Ссылки',
    text: 'Поделитесь дизайном светильника или проектом всего дома. Близкие смогут оценить концепцию и предложить свои идеи. Создавайте вместе.',
  },
  {
    label: 'Советы',
    text: 'Эксперты WOODLED знают, как сделать ваш свет ещё лучше, где сэкономить и что добавить. Отправьте нам ссылку — и ваши идеи оживут.',
  },
]

const active = ref(0)
const currentText = computed(() => FEATURES[active.value].text)

// Template refs for measuring each tab — stored as an array indexed by tab number.
const tabEls = ref<(HTMLElement | null)[]>([])
function setTabRef(el: unknown, i: number) {
  tabEls.value[i] = el as HTMLElement | null
}

// Pill geometry — kept in refs so they reactively drive style.
const pillX = ref(0)
const pillW = ref(0)
const pillReady = ref(false)

function measurePill() {
  const el = tabEls.value[active.value]
  if (!el) return
  pillX.value = el.offsetLeft
  pillW.value = el.offsetWidth
  if (!pillReady.value) {
    // First measurement done — flip the flag on next tick so the initial
    // appearance doesn't animate from (0,0) to first tab position.
    nextTick(() => { pillReady.value = true })
  }
}

watch(active, () => nextTick(measurePill))

onMounted(() => {
  nextTick(measurePill)
  window.addEventListener('resize', measurePill)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', measurePill)
})

const pillStyle = computed(() => ({
  position: 'absolute' as const,
  top: '4px',
  bottom: '4px',
  left: '0',
  width: `${pillW.value}px`,
  // translate3d forces a GPU-composited layer regardless of will-change.
  transform: `translate3d(${pillX.value}px, 0, 0)`,
  borderRadius: '999px',
  background: '#FFFFFF',
  boxShadow:
    'inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 2px 8px rgba(184, 125, 82, 0.16), 0 0 0 0.5px rgba(184, 125, 82, 0.06)',
  opacity: pillReady.value ? 1 : 0,
  pointerEvents: 'none' as const,
  zIndex: 0,
  willChange: 'transform, width',
  backfaceVisibility: 'hidden' as const,
  // Gentle easeOutExpo — soft start, very smooth decel. 480ms gives the
  // slide enough time to feel deliberate, not snappy.
  transition: pillReady.value
    ? 'transform 480ms cubic-bezier(0.16, 1, 0.3, 1), width 480ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease'
    : 'opacity 220ms ease',
}))
</script>

<template>
  <div :style="{ width: '100%' }">
    <div :style="{ display: 'flex', justifyContent: 'center' }">
      <div
        :style="{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px',
          borderRadius: '999px',
          background: 'rgba(255, 250, 244, 0.55)',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          border: '1px solid rgba(184, 125, 82, 0.10)',
          boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.55), 0 2px 10px rgba(184, 125, 82, 0.06)`,
          maxWidth: '100%',
        }"
      >
        <!-- Sliding white pill — sits behind tab labels, animates position+width -->
        <div :style="pillStyle" />

        <button
          v-for="(f, i) in FEATURES"
          :key="i"
          :ref="(el) => setTabRef(el, i)"
          @click="active = i"
          :style="{
            position: 'relative',
            zIndex: 1,
            padding: 'clamp(7px, 1.6vw, 10px) clamp(14px, 3.5vw, 20px)',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'clamp(13px, 3.2vw, 15px)',
            fontWeight: 600,
            color: i === active ? PAGE.roseDeep : PAGE.textSec,
            letterSpacing: '-0.005em',
            background: 'transparent',
            transition: 'color 300ms ease',
            whiteSpace: 'nowrap',
          }"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <!--
      Description text — fixed-height container via CSS Grid.
      All 3 texts are rendered in the same grid cell (gridArea: '1 / 1').
      The hidden "sizer" copies (visibility: hidden) participate in layout so
      the container's height = max height of all 3 texts. The visible active
      <p> overlays them via the same grid cell. Result: switching tabs
      doesn't reflow surrounding content — the longest text reserves space,
      shorter ones leave whitespace below.
    -->
    <div :style="{ marginTop: '18px', display: 'grid' }">
      <p
        v-for="(f, i) in FEATURES"
        :key="'sizer-' + i"
        :style="{
          margin: 0,
          gridArea: '1 / 1',
          fontSize: 'clamp(15px, 3.4vw, 17px)',
          fontWeight: 500,
          lineHeight: 1.55,
          color: PAGE.textSec,
          maxWidth: '500px',
          marginLeft: 'auto',
          marginRight: 'auto',
          textAlign: 'center',
          visibility: 'hidden',
          pointerEvents: 'none',
        }"
      >
        {{ f.text }}
      </p>

      <p
        :key="active"
        :style="{
          margin: 0,
          gridArea: '1 / 1',
          fontSize: 'clamp(15px, 3.4vw, 17px)',
          fontWeight: 500,
          lineHeight: 1.55,
          color: PAGE.textSec,
          maxWidth: '500px',
          marginLeft: 'auto',
          marginRight: 'auto',
          textAlign: 'center',
          animation: 'fadeInUp 320ms cubic-bezier(0.4, 0, 0.2, 1)',
        }"
      >
        {{ currentText }}
      </p>
    </div>
  </div>
</template>
