<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { C, DEMO, SUMMARY_EXTRA, WCOL, fixtureIconPath } from '../woodled-data.js'
import Gauge from '../Gauge.vue'

const props = defineProps({
  active: { type: Boolean, required: true }
})
const emit = defineEmits(['story-done'])

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
    // the fade (1.4s leave + 1.4s enter = 2.8s total). Старый DOM полностью
    // снимается до появления нового, так что числа никогда не дублируются.
    gaugeAnim.value = false
    curIdx = nextIdx
    idx.value = nextIdx
    // Запускаем gauge/counter после монтирования нового DOM (2.8s + буфер).
    cycleTimers.push(setTimeout(() => {
      if (!stopped) gaugeAnim.value = true
    }, 2900))
  }, 6500)
})

onUnmounted(clearAll)

/* done=true — на экране сводка («Лес оживает» + карточки комнат).
   Родителю — сигнал показать «Супер!». */
watch(done, (v) => { if (v) emit('story-done') })

const d = computed(() => DEMO[idx.value])
// Summary показывает DEMO + SUMMARY_EXTRA (кухня видна только здесь,
// в циклическую анимацию не входит).
const summaryRooms = computed(() => [...DEMO, ...SUMMARY_EXTRA])
const gP = { ceiling: '30% 25%', wall: '70% 25%', floor: '30% 75%', table: '70% 75%' }

// Pre-compute zone gradient backgrounds to avoid heavy templating
function zoneGradient(zone, mc) {
  const alpha = Math.round(Math.min(zone.pct / 100 * 0.55 + 0.1, 0.5) * 255)
    .toString(16).padStart(2, '0')
  // Шире + дальше «transparent» + filter:blur на .d5gw — на мобилке
  // не видны края «пучков» по углам зон.
  return `radial-gradient(ellipse 80% 80% at ${gP[zone.id]},${mc}${alpha},transparent 90%)`
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
            <!-- Mood (Ясный день/Рассвет/Поляна) убран — вместо него
                 берём desc прямо в заголовок. v-html чтобы <br> в DEMO
                 разрывал строку (двухстрочная вёрстка на мобилке). -->
            <div
              class="d5m"
              :style="{ color: d.mc, marginBottom: '28px' }"
              v-html="d.desc"
            />


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
        <!-- «Лес оживает» убран — вместо него идёт сразу подзаголовок,
             та же логика что в циклических комнатах: один уровень текста.
             Воздух перед карточками (32px) — карточки не висят впритык. -->
        <div class="d5m" :style="{ color: '#fff', marginBottom: '32px' }">
          Неповторимое настроение<br>в каждом уголке вашего дома
        </div>
        <div class="sgrid">
          <div
            v-for="(rm, i) in summaryRooms"
            :key="i"
            class="scard"
            :style="{
              background: `linear-gradient(145deg,${rm.mc}18,${rm.mc}08,${C_REF.card})`,
              borderColor: `${rm.mc}33`,
              boxShadow: `inset 0 0 30px ${rm.mc}15`
            }"
          >
            <!-- Имя комнаты — цветной заголовок (без mood/wood badges).
                 Цвет = mc (mood-color), визуально комната получает идентичность. -->
            <div class="scard-title" :style="{ color: rm.mc }">{{ rm.name }}</div>
            <div class="scfx">
              <div v-for="(fx, j) in rm.fixtures" :key="j" class="scf">
                <div class="scfc" :style="{ background: WCOL[fx.w] }">
                  <svg
                    width="22" height="22" viewBox="0 0 24 24" fill="none"
                    :stroke="C_REF.bg" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"
                    v-html="fixtureIconPath(fx.t)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
