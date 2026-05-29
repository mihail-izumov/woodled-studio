<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { C, FIG, IMG, BIRD_ICON_LG } from '../woodled-data.js'

const props = defineProps({
  active: { type: Boolean, required: true }
})
const emit = defineEmits(['ready'])

const p = ref(-1)
const sw = ref(false)
const fi = ref(0)
const rotorLoaded = ref(false)
const animalsLoaded = ref(false)
let timers = []

function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

// Preload a single image, resolve when ready
function preloadImg(src) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false) // don't block on error
    img.src = src
  })
}

// Preload rotor + animals in parallel on mount
onMounted(async () => {
  // Rotor is critical — wait for it
  preloadImg(IMG.rotor).then(() => { rotorLoaded.value = true })
  // Animals are nice-to-have — preload in background
  Promise.all(FIG.map(f => preloadImg(IMG[f.img]))).then(() => {
    animalsLoaded.value = true
  })
})

function startTimeline() {
  clearTimers()
  p.value = -1
  const schedule = [
    [300, 0], [1400, 1], [5500, 2], [7500, 3], [9000, 4]
  ]
  schedule.forEach(([ms, val]) => {
    timers.push(setTimeout(() => { p.value = val }, ms))
  })
}

// Only start animation when BOTH active AND rotor image loaded
watch([() => props.active, rotorLoaded], ([active, loaded]) => {
  clearTimers()
  if (!active) {
    p.value = -1; sw.value = false; fi.value = 0
    emit('ready', true)
    return
  }
  emit('ready', true)
  if (loaded) {
    startTimeline()
  }
  // If not loaded yet, the watch will fire again when rotorLoaded flips true
}, { immediate: true })

onUnmounted(clearTimers)

function doSwitch() {
  if (sw.value || !animalsLoaded.value) return
  sw.value = true
}

const N = 20
const R = 80
</script>

<template>
  <div class="ci ch-l4">
    <div class="ctl">
      <span :class="['cs', { v: p >= 0 }]">Глава вторая</span>
      <span :class="['cn', { v: p >= 0 }]">WOODLED Rotor</span>
    </div>

    <!-- Rotor product photo + assembly (before switch) -->
    <div v-if="!sw" class="l4-stage">
      <div :class="['l4-photo', { v: p >= 0 && rotorLoaded, fade: p >= 2 }]">
        <div class="rt-glow" />
        <img v-if="rotorLoaded" :src="IMG.rotor" alt="WOODLED Rotor" class="rt-img">
        <div class="rt-fade-top" />
      </div>
      <div :class="['r-stage', { v: p >= 2 }]">
        <div :class="['r-asm', { spin: p >= 3 }]">
          <div
            v-for="i in N" :key="`rs${i}`"
            class="rs"
            :class="{ in: p >= 2 }"
            :style="{
              transform: p >= 2
                ? `rotate(${((i-1)/N)*360}deg) translateY(-${R}px)`
                : `rotate(${((i-1)/N)*360}deg) translateY(-${R+90}px)`,
              transitionDelay: `${(i-1)*50}ms`
            }"
          />
          <template v-if="p >= 3">
            <div
              v-for="i in N" :key="`rsg${i}`"
              class="rsg"
              :style="{
                transform: `rotate(${((i-1)/N)*360}deg) translateY(-${R*0.55}px)`,
                animationDelay: `${(i-1)*0.15}s`
              }"
            />
          </template>
        </div>
        <div :class="['sww', { vis: p >= 4 && animalsLoaded }]">
          <button class="swb" @click="doSwitch" aria-label="Включить">
            <span class="swb-icon" v-html="BIRD_ICON_LG" />
          </button>
        </div>
      </div>
    </div>

    <!-- Shadow stage (after switch) -->
    <template v-else>
      <div class="sh-stage on">
        <div class="sh-light" />
        <div class="sh-fig" :key="fi">
          <img :src="IMG[FIG[fi].img]" :alt="FIG[fi].label">
        </div>
        <div class="sh-bars">
          <div
            v-for="i in 10" :key="i"
            class="sh-bar"
            :style="{ left: `${((i-1)/10)*100}%` }"
          />
        </div>
      </div>
      <div class="sh-title">Лес вернулся домой</div>
      <div class="figr sh-figr">
        <button
          v-for="(f, i) in FIG"
          :key="f.id"
          :class="['fb', { ac: i === fi }]"
          @click="fi = i"
        >{{ f.label }}</button>
      </div>
    </template>

    <!-- Caption (only before switch) -->
    <div v-if="!sw" :class="['txt', { v: p >= 1 }]">
      <div class="txt-stack">
        <div :class="['txt-layer', { v: p < 2 }]">
          <div class="txth">Дом с WOODLED Rotor</div>
          <div class="txtp">Настоящее дерево становится<br>живым светом в доме.</div>
        </div>
        <div :class="['txt-layer', { v: p >= 2 }]">
          <div class="txth">Ламели встают в круг</div>
          <div class="txtp">Простота. Природа. Ничего лишнего. Только дерево, свет и воздух между ними.</div>
        </div>
      </div>
    </div>
  </div>
</template>
