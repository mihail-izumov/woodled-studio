<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { C, IMG } from '../woodled-data.js'

const props = defineProps({
  active: { type: Boolean, required: true }
})

// Phase progression: -1 (initial), 0..5 (story → tree fades → lamel → text)
const p = ref(-1)
let timers = []

function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

watch(() => props.active, (active) => {
  clearTimers()
  if (!active) { p.value = -1; return }
  p.value = -1
  const schedule = [800, 4000, 7500, 9500, 10500, 12000]
  schedule.forEach((ms, i) => {
    timers.push(setTimeout(() => { p.value = i }, ms))
  })
}, { immediate: true })

onUnmounted(clearTimers)

// Tree opacity: bright during p0..1 (story), fades from p>=2 (when leaves fly)
const treeOpacity = computed(() => p.value < 0 ? 0 : p.value >= 2 ? 0 : 0.8)
const treeAnimState = computed(() => p.value >= 2 ? 'paused' : 'running')

// Pre-computed leaf scatter (12 leaves with random angles/distances)
const leaves = Array.from({ length: 12 }).map(() => {
  const angle = Math.random() * Math.PI * 2
  const dist = 120 + Math.random() * 100
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist - 40,
    rot: Math.random() * 360,
    dur: 1.5 + Math.random() * 1,
    del: Math.random() * 0.4,
    sz: 24 + Math.random() * 16
  }
})

const oakSrc = IMG.oak
const clearingColor = C.clearing
</script>

<template>
  <div class="ci ch1">
    <!-- Light beam behind tree -->
    <div
      class="ch1-lightbeam"
      :style="{ opacity: treeOpacity, transition: 'opacity 2.5s ease' }"
    />
    <!-- Oak silhouette -->
    <div
      class="ch1-bg"
      :style="{ opacity: treeOpacity, transition: 'opacity 2.5s ease' }"
    >
      <img
        :src="oakSrc"
        alt=""
        class="ch1-tree"
        :style="{ animationPlayState: treeAnimState }"
      >
    </div>

    <!-- Chapter title -->
    <div class="ctl">
      <span :class="['cs', { v: p >= 0 }]">Глава первая</span>
      <span :class="['cn', { v: p >= 0 }]">Ламели WOODLED</span>
    </div>

    <div class="ch1-center">
      <!-- Story phrases (visible during p<2) -->
      <div :class="['story', p < 2 ? 'vis' : 'hide']">
        <div :class="['sl', { v: p === 0, dim: p > 0 }]">
          Каждое дерево<br>хранит в себе свет.
        </div>
        <div :class="['sl', { v: p === 1, dim: p > 1 }]">
          Когда дерево срубают<br>— свет гаснет.
        </div>
      </div>

      <!-- Leaves scatter (p>=2 && p<4) -->
      <div v-if="p >= 2 && p < 4" class="ch1-leaves">
        <div
          v-for="(l, i) in leaves"
          :key="i"
          class="ember"
          :style="{
            width: l.sz + 'px',
            height: l.sz + 'px',
            animation: `ember ${l.dur}s ease-out ${l.del}s forwards`,
            '--ex': l.x + 'px',
            '--ey': l.y + 'px',
            '--er': l.rot + 'deg'
          }"
        >
          <svg
            :width="l.sz"
            :height="l.sz"
            viewBox="0 0 24 24"
            :fill="clearingColor"
            stroke="none"
            opacity=".9"
          >
            <path d="M2 22c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5 4 4 0 0 0 6.187-2.353 3.5 3.5 0 0 0 3.69-5.116A3.5 3.5 0 0 0 20.95 8 3.5 3.5 0 1 0 16 3.05a3.5 3.5 0 0 0-5.831 1.373 3.5 3.5 0 0 0-5.116 3.69 4 4 0 0 0-2.348 6.155C3.499 15.42 4.409 16.712 4.2 18.1 3.926 19.743 3.014 20.732 2 22"/>
          </svg>
        </div>
      </div>

      <!-- Lamel reveal (p>=4) -->
      <div :class="['l2-stage', { vis: p >= 4 }]">
        <div :class="['l2-lamel', { vis: p >= 4 }]">
          <div class="l2-body">
            <div
              class="l2-grain"
              :style="{ backgroundImage: `url('${IMG.wood}')` }"
            />
            <div :class="['l2-hb', { on: p >= 5 }]" />
            <div class="l2-shimmer" />
          </div>
          <div class="l2-back" />
        </div>
      </div>

      <!-- Final caption (p>=5) -->
      <div :class="['txt', 'txt-ch1', { v: p >= 5 }]">
        <div class="txth">Дерево<br>продолжает светить</div>
        <div class="txtp">В тонкой пластине WOODLED Rotor навсегда остаётся свет настоящего дерева.</div>
      </div>
    </div>
  </div>
</template>
