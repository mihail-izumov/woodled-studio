<script setup>
import { computed } from 'vue'
import { C } from './woodled-data.js'

const props = defineProps({
  pct: { type: Number, required: true },
  color: { type: String, required: true },
  size: { type: Number, required: true },
  animate: { type: Boolean, default: false }
})

const dim = C.dim
const aR = computed(() => props.size / 2 - 6 - 18) // arc radius
const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2 + 4)
const arcPath = computed(() =>
  `M ${cx.value - aR.value} ${cy.value} A ${aR.value} ${aR.value} 0 1 1 ${cx.value + aR.value} ${cy.value}`
)
const totalLen = computed(() => Math.PI * aR.value)
const dashLen = computed(() => totalLen.value * (props.animate ? Math.min(props.pct, 100) / 100 : 0))
const dashGap = computed(() => totalLen.value - dashLen.value)
const dashArray = computed(() => `${dashLen.value} ${dashGap.value}`)
const filled = computed(() => `drop-shadow(0 0 14px ${props.color})`)

// 36 tick marks around the arc
const ticks = computed(() => {
  const n = 36
  const R = props.size / 2 - 6
  return Array.from({ length: n }).map((_, i) => {
    const a = Math.PI + (Math.PI * i / (n - 1))
    return {
      x1: cx.value + Math.cos(a) * (R - 8),
      y1: cy.value + Math.sin(a) * (R - 8),
      x2: cx.value + Math.cos(a) * (R + 8),
      y2: cy.value + Math.sin(a) * (R + 8)
    }
  })
})

const tickStroke = `${dim}66`
const bgArcStroke = `${dim}28`
</script>

<template>
  <svg
    :width="size"
    :height="size / 2 + 16"
    :viewBox="`0 0 ${size} ${size / 2 + 16}`"
  >
    <line
      v-for="(t, i) in ticks"
      :key="i"
      :x1="t.x1" :y1="t.y1"
      :x2="t.x2" :y2="t.y2"
      :stroke="tickStroke"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <!-- background arc -->
    <path :d="arcPath" fill="none" :stroke="bgArcStroke" stroke-width="5" stroke-linecap="round"/>
    <!-- animated filled arc -->
    <path
      :d="arcPath"
      fill="none"
      :stroke="color"
      stroke-width="5.5"
      stroke-linecap="round"
      :stroke-dasharray="dashArray"
      :style="{ transition: 'stroke-dasharray 2.5s ease-out, stroke 1s', filter: filled }"
    />
  </svg>
</template>
