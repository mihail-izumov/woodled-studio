<script setup lang="ts">
import { ref, watch, onBeforeUnmount, onMounted } from 'vue'
import { PAGE } from './tokens'

const total = 9
const duration = 5000

// Real images live in /public/woodled-studio/lp/wdld-lp-slider-{1..9}.jpg
// Per-slide loaded flag — drives shimmer-to-image crossfade.
const loaded = ref<boolean[]>(new Array(total).fill(false))
function handleImgLoad(i: number) { loaded.value[i] = true }
function handleImgError(i: number) {
  // Don't trap the slide in a permanent shimmer if the image 404s.
  loaded.value[i] = true
}

const containerRef = ref<HTMLElement | null>(null)
const current = ref(0)
const playing = ref(false) // off by default — user must click play to start auto-advance

// non-reactive flags
let isAuto = false
let scrollDebounce: number | null = null
let autoplayTimer: number | null = null

function scrollToSlide(index: number, smooth = true) {
  const container = containerRef.value
  if (!container) return
  const cards = container.querySelectorAll<HTMLElement>('[data-slide]')
  const card = cards[index]
  if (!card) return

  isAuto = true
  const containerCenter = container.offsetWidth / 2
  const cardCenter = card.offsetLeft + card.offsetWidth / 2
  const scrollTo = cardCenter - containerCenter

  container.scrollTo({ left: scrollTo, behavior: smooth ? 'smooth' : 'auto' })
  window.setTimeout(() => { isAuto = false }, 800)
}

function clearAutoplay() {
  if (autoplayTimer !== null) {
    window.clearTimeout(autoplayTimer)
    autoplayTimer = null
  }
}

function scheduleAutoplay() {
  clearAutoplay()
  if (!playing.value) return
  autoplayTimer = window.setTimeout(() => {
    const next = (current.value + 1) % total
    current.value = next
    scrollToSlide(next)
  }, duration)
}

watch([current, playing], () => scheduleAutoplay(), { immediate: false })
onMounted(() => scheduleAutoplay())
onBeforeUnmount(() => {
  clearAutoplay()
  if (scrollDebounce !== null) window.clearTimeout(scrollDebounce)
})

function handleScroll() {
  if (isAuto) return
  if (scrollDebounce !== null) window.clearTimeout(scrollDebounce)
  scrollDebounce = window.setTimeout(() => {
    const container = containerRef.value
    if (!container) return
    const containerCenter = container.scrollLeft + container.offsetWidth / 2
    const cards = container.querySelectorAll<HTMLElement>('[data-slide]')
    let closest = 0
    let minDist = Infinity
    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      const dist = Math.abs(cardCenter - containerCenter)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    if (closest !== current.value) current.value = closest
  }, 120)
}

function handleSelect(index: number) {
  playing.value = false
  current.value = index
  scrollToSlide(index)
}

function handleArrow(dir: 'prev' | 'next') {
  playing.value = false
  const next = Math.max(0, Math.min(total - 1, current.value + (dir === 'next' ? 1 : -1)))
  current.value = next
  scrollToSlide(next)
}

function togglePlay() {
  playing.value = !playing.value
}
</script>

<template>
  <section :style="{ padding: '12px 0 16px', position: 'relative' }">
    <div :style="{ position: 'relative', maxWidth: '1280px', margin: '0 auto' }">
      <!-- Arrow buttons — hidden on mobile via CSS class -->
      <button
        class="slider-arrow"
        @click="handleArrow('prev')"
        :disabled="current === 0"
        :style="{
          position: 'absolute',
          top: '50%',
          left: '8px',
          transform: 'translateY(-50%)',
          zIndex: 5,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(255, 250, 244, 0.75)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: 'none',
          padding: 0,
          cursor: current === 0 ? 'default' : 'pointer',
          opacity: current === 0 ? 0.3 : 1,
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          color: PAGE.roseDeep,
          boxShadow: '0 4px 16px rgba(184, 125, 82, 0.15)',
        }"
        aria-label="Назад"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <button
        class="slider-arrow"
        @click="handleArrow('next')"
        :disabled="current === total - 1"
        :style="{
          position: 'absolute',
          top: '50%',
          right: '8px',
          transform: 'translateY(-50%)',
          zIndex: 5,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(255, 250, 244, 0.75)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: 'none',
          padding: 0,
          cursor: current === total - 1 ? 'default' : 'pointer',
          opacity: current === total - 1 ? 0.3 : 1,
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          color: PAGE.roseDeep,
          boxShadow: '0 4px 16px rgba(184, 125, 82, 0.15)',
        }"
        aria-label="Вперёд"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
      </button>

      <div
        ref="containerRef"
        @scroll="handleScroll"
        class="slider-scroll"
        :style="{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          gap: '10px',
          padding: '24px 0 42px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
        }"
      >
        <div
          v-for="(_, i) in total"
          :key="i"
          data-slide
          :style="{
            flexShrink: 0,
            width: 'clamp(258px, 26vw, 295px)',
            aspectRatio: '1290 / 2796',
            scrollSnapAlign: 'center',
            // Card half-width ≈ 129px at min clamp → center on viewport.
            marginLeft: i === 0 ? 'max(12px, calc(50vw - 129px))' : 0,
            marginRight: i === total - 1 ? 'max(12px, calc(50vw - 129px))' : 0,
          }"
        >
          <!-- Slide: real image + shimmer wave until loaded -->
          <div
            :style="{
              width: '100%',
              height: '100%',
              borderRadius: '26px',
              background: '#2A1F18',
              // Single clean drop shadow — no inset rim lights, no opacity dim,
              // no scale on neighbors. All slides full strength like App Store carousel.
              boxShadow: i === current
                ? '0 18px 36px -10px rgba(42, 31, 24, 0.38), 0 0 0 1px rgba(212, 165, 116, 0.08)'
                : '0 12px 24px -8px rgba(42, 31, 24, 0.26)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'box-shadow 600ms cubic-bezier(0.4, 0, 0.2, 1)',
            }"
          >
            <!-- Shimmer wave — visible while image still loading -->
            <div
              v-show="!loaded[i]"
              class="slider-shimmer"
              :style="{
                position: 'absolute',
                inset: 0,
                borderRadius: '26px',
                pointerEvents: 'none',
              }"
            />

            <!-- Real image — fades in on @load -->
            <img
              :src="`/woodled-studio/lp/wdld-lp-slider-${i + 1}.jpg`"
              :alt="`Слайд ${i + 1}`"
              loading="lazy"
              decoding="async"
              @load="handleImgLoad(i)"
              @error="handleImgError(i)"
              :style="{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '26px',
                opacity: loaded[i] ? 1 : 0,
                transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'block',
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- SliderControls -->
    <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '10px' }">
      <div
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          height: '56px',
          padding: '0 26px',
          borderRadius: '999px',
          background: 'rgba(255, 250, 244, 0.65)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 6px 20px rgba(184, 125, 82, 0.10)`,
        }"
      >
        <template v-for="(_, i) in total" :key="i">
          <button
            v-if="i === current"
            @click="handleSelect(i)"
            :style="{
              width: '26px',
              height: '8px',
              borderRadius: '4px',
              background: 'rgba(154, 100, 64, 0.12)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }"
            :aria-label="`Слайд ${i + 1}`"
          >
            <div
              :key="`progress-${current}-${playing}`"
              :style="{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, ${PAGE.cocoa} 0%, ${PAGE.roseDeep} 100%)`,
                transformOrigin: 'left center',
                animation: playing
                  ? `progressFill ${duration}ms cubic-bezier(0.45, 0, 0.55, 1) forwards`
                  : 'none',
                transform: playing ? undefined : 'scaleX(1)',
              }"
            />
          </button>
          <button
            v-else
            @click="handleSelect(i)"
            :style="{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'rgba(184, 125, 82, 0.42)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'background 300ms ease',
            }"
            :aria-label="`Слайд ${i + 1}`"
          />
        </template>
      </div>

      <!-- Play/Pause -->
      <button
        @click="togglePlay"
        :style="{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(255, 250, 244, 0.65)',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 6px 20px rgba(184, 125, 82, 0.10)`,
        }"
        :aria-label="playing ? 'Пауза' : 'Воспроизвести'"
      >
        <div :style="{ position: 'relative', width: '24px', height: '24px' }">
          <!-- Pause icon -->
          <div
            :style="{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: playing ? 1 : 0,
              transform: playing ? 'scale(1) rotate(0deg)' : 'scale(0.6) rotate(-90deg)',
              transition: 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1), transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" :fill="PAGE.roseDeep">
              <rect x="6" y="4.5" width="4" height="15" rx="1.6" />
              <rect x="14" y="4.5" width="4" height="15" rx="1.6" />
            </svg>
          </div>
          <!-- Play icon -->
          <div
            :style="{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: playing ? 0 : 1,
              transform: playing ? 'scale(0.6) rotate(90deg)' : 'scale(1) rotate(0deg)',
              transition: 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1), transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                d="M8.5 5.2 c0-1.05 1.15-1.7 2.04-1.12 l9.1 5.85 c0.83 0.53 0.83 1.74 0 2.27 l-9.1 5.85 c-0.89 0.57 -2.04 -0.07 -2.04 -1.12 z"
                :fill="PAGE.roseDeep"
                :stroke="PAGE.roseDeep"
                stroke-width="1.2"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
            </svg>
          </div>
        </div>
      </button>
    </div>
  </section>
</template>
