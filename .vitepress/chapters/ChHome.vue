<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { C, DEMO, WCOL, WNAME, fixtureIconPath } from '../woodled-data.js'
import Gauge from '../Gauge.vue'

const props = defineProps({
  active: { type: Boolean, required: true }
})

const phase = ref(-1)
const idx = ref(0)
const done = ref(false)
const playing = ref(false)
const fade = ref(false)
const gaugeAnim = ref(false)
const displayPct = ref(0)

let initTimers = []
let cycleInterval = null
let cycleTimers = []
let counterRAF = null
let stopped = false

function clearAll() {
  initTimers.forEach(clearTimeout); initTimers = []
  cycleTimers.forEach(clearTimeout); cycleTimers = []
  if (cycleInterval) { clearInterval(cycleInterval); cycleInterval = null }
  if (counterRAF) { cancelAnimationFrame(counterRAF); counterRAF = null }
  stopped = true
}

function replay() {
  clearAll()
  stopped = false
  idx.value = 0
  done.value = false
  fade.value = false
  gaugeAnim.value = false
  displayPct.value = 0
  playing.value = true
  // Re-trigger the gauge animation for replay
  setTimeout(() => { gaugeAnim.value = true }, 100)
}

// Init when active changes
watch(() => props.active, (active) => {
  clearAll()
  if (!active) {
    phase.value = -1
    idx.value = 0
    done.value = false
    playing.value = false
    gaugeAnim.value = false
    displayPct.value = 0
    return
  }
  stopped = false
  initTimers.push(setTimeout(() => { phase.value = 0 }, 200))
  initTimers.push(setTimeout(() => { phase.value = 1; playing.value = true }, 800))
  initTimers.push(setTimeout(() => { gaugeAnim.value = true }, 1400))
}, { immediate: true })

// Animated percentage counter — runs whenever gaugeAnim flips on or idx changes
watch([gaugeAnim, idx], ([anim, currentIdx]) => {
  if (counterRAF) cancelAnimationFrame(counterRAF)
  if (!anim) { displayPct.value = 0; return }
  const target = DEMO[currentIdx].pct
  const duration = 2500
  const start = Date.now()
  const tick = () => {
    const t = Math.min(1, (Date.now() - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
    displayPct.value = Math.round(target * eased)
    if (t < 1) counterRAF = requestAnimationFrame(tick)
  }
  counterRAF = requestAnimationFrame(tick)
})

// Room-cycling loop — 4.5s per room, then crossfade to summary
watch([playing, done], ([play, isDone]) => {
  if (!play || isDone) return
  if (cycleInterval) clearInterval(cycleInterval)
  let curIdx = idx.value
  cycleInterval = setInterval(() => {
    if (stopped) return
    const nextIdx = curIdx + 1
    if (nextIdx >= DEMO.length) {
      // Last room shown → fade to summary (still uses fade ref for summary swap)
      stopped = true
      clearInterval(cycleInterval); cycleInterval = null
      fade.value = true; gaugeAnim.value = false
      cycleTimers.push(setTimeout(() => {
        fade.value = false
        done.value = true
      }, 1600))
      return
    }
    // Reset gauge first, then swap idx — <Transition mode="out-in"> animates
    // the fade (1s leave + 1s enter = 2s total). Old DOM is fully removed
    // before new one appears, so numbers can never show twice.
    gaugeAnim.value = false
    curIdx = nextIdx
    idx.value = nextIdx
    // Start gauge/counter after new DOM is mounted (2s + small buffer)
    cycleTimers.push(setTimeout(() => {
      if (!stopped) gaugeAnim.value = true
    }, 2200))
  }, 5500)
})

onUnmounted(clearAll)

const d = computed(() => DEMO[idx.value])
const gP = { ceiling: '30% 25%', wall: '70% 25%', floor: '30% 75%', table: '70% 75%' }

// Pre-compute zone gradient backgrounds to avoid heavy templating
function zoneGradient(zone, mc) {
  const alpha = Math.round(Math.min(zone.pct / 100 * 0.55 + 0.1, 0.5) * 255)
    .toString(16).padStart(2, '0')
  return `radial-gradient(ellipse 55% 55% at ${gP[zone.id]},${mc}${alpha},transparent 65%)`
}

const C_REF = C
</script>

<template>
  <div class="ci ch4">
    <div class="ctl">
      <span :class="['cs', { v: phase >= 0 }]">Глава третья</span>
      <span :class="['cn', { v: phase >= 0 }]">Живой дом</span>
    </div>

    <div
      :class="['d5', { v: phase >= 1 }]"
      :style="{
        opacity: done && fade ? 0 : 1,
        transform: done && fade ? 'translateY(6px)' : '',
        transition: 'all .6s'
      }"
    >
      <!-- Cycling rooms -->
      <template v-if="!done">
        <div class="rmb">
          <div
            v-for="(rm, i) in DEMO" :key="i"
            :class="['rb', { ac: i === idx }]"
            :style="{
              background: i === idx ? `${rm.mc}25` : C_REF.card,
              borderColor: i === idx ? `${rm.mc}55` : C_REF.border,
              transition: 'all .8s'
            }"
          >
            <span :style="{ color: i === idx ? C_REF.text : C_REF.dim, transition: 'color .8s' }">{{ rm.name }}</span>
          </div>
        </div>

        <Transition name="room-fade" mode="out-in">
          <div class="d5-c" :key="idx">
            <div class="d5m" :style="{ color: d.mc }">{{ d.mood }}</div>
            <div class="d5desc">{{ d.desc }}</div>

            <div class="d5g">
              <Gauge :pct="d.pct" :color="d.mc" :size="200" :animate="gaugeAnim"/>
              <div class="d5gv">
                <span class="d5gn">{{ displayPct }}</span>
                <span class="d5gp">%</span>
              </div>
            </div>

            <div class="d5z">
              <div class="d5zg" :style="{ borderColor: `${d.mc}22`, background: `${d.mc}08` }">
                <div
                  v-for="z in d.zones"
                  :key="z.id"
                  class="d5gw"
                  :style="{
                    background: zoneGradient(z, d.mc),
                    opacity: z.pct > 0 ? 1 : 0,
                    transition: 'opacity 1.5s ease, background 1.5s ease'
                  }"
                />
                <div class="d5zgr">
                  <div
                    v-for="z in d.zones"
                    :key="z.id"
                    class="d5zc"
                    :style="{ opacity: z.pct > 0 ? 1 : .2, transition: 'all .8s' }"
                  >
                    <div class="d5zh">
                      <span class="d5zn">{{ z.n }}</span>
                      <span
                        v-if="z.pct > 0"
                        class="d5zp"
                        :style="{ color: d.mc, background: `${d.mc}20` }"
                      >{{ z.pct }}%</span>
                    </div>
                    <div v-if="z.pct > 0" class="d5zm">{{ z.m }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </template>

      <!-- Summary -->
      <div v-else class="d5sum" :style="{ opacity: fade ? 0 : 1, transition: 'opacity 1.5s ease' }">
        <div class="d5m" :style="{ color: '#fff' }">Лес оживает</div>
        <div class="d5desc" :style="{ marginBottom: '16px' }">
          Неповторимое настроение<br>в каждом уголке вашего дома.
        </div>
        <div class="sgrid">
          <div
            v-for="(rm, i) in DEMO"
            :key="i"
            class="scard"
            :style="{
              background: `linear-gradient(145deg,${rm.mc}18,${rm.mc}08,${C_REF.card})`,
              borderColor: `${rm.mc}33`,
              boxShadow: `inset 0 0 30px ${rm.mc}15`
            }"
          >
            <div class="scb" :style="{ background: `${rm.mc}30` }">{{ rm.name }}</div>
            <div class="scm" :style="{ color: rm.mc }">{{ rm.mood }}</div>
            <div class="scfx">
              <div v-for="(fx, j) in rm.fixtures" :key="j" class="scf">
                <div class="scfc" :style="{ background: WCOL[fx.w] }">
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    :stroke="C_REF.bg" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"
                    v-html="fixtureIconPath(fx.t)"
                  />
                </div>
                <div class="scfw">{{ WNAME[fx.w] }}</div>
              </div>
            </div>
          </div>
          <div class="scard acard" :style="{ borderColor: `${C_REF.dim}33` }">
            <div :style="{ fontSize: '28px', color: C_REF.dim }">+</div>
            <div :style="{ fontSize: '11px', color: C_REF.dim }">Добавить<br>комнату</div>
          </div>
        </div>
        <button class="rpl" @click="replay">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 10a8 8 0 1 1 8 8H4"/>
            <path d="m8 22-4-4 4-4"/>
          </svg>
          Повторить
        </button>
      </div>
    </div>
  </div>
</template>
