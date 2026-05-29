<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { PAGE } from './tokens'

const props = withDefaults(defineProps<{
  size?: 'large' | 'small'
  label?: string
}>(), {
  size: 'large',
  label: 'Войти',
})

const emit = defineEmits<{
  (e: 'mounted', el: HTMLElement): void
  (e: 'unmounted'): void
}>()

const btnRef = ref<HTMLElement | null>(null)

/**
 * Cross-domain navigation (the configurator lives on runscale.ru) means a
 * truly seamless transition isn't possible — the browser has to actually
 * load a different page. The next best thing: fade the LP under a full-bleed
 * overlay that matches the page palette, parked on the same rotor spinner
 * used elsewhere on the site. To the user it reads as "loading", not as
 * "page froze and then jumped".
 *
 * Timing: 350ms fade-in, then 350ms more before redirect (~700ms total).
 * Short enough to stay snappy, long enough to mask the white flash of the
 * cross-domain navigation.
 */
const isTransitioning = ref(false)

let redirectTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (btnRef.value) emit('mounted', btnRef.value)
})
onBeforeUnmount(() => {
  emit('unmounted')
  if (redirectTimer !== null) {
    clearTimeout(redirectTimer)
    redirectTimer = null
  }
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

function handleClick() {
  if (isTransitioning.value) return
  if (typeof window === 'undefined') return

  isTransitioning.value = true
  if (typeof document !== 'undefined') {
    // Lock scroll so the overlay stays put while the redirect is in flight.
    document.body.style.overflow = 'hidden'
  }

  redirectTimer = setTimeout(() => {
    window.location.href = '/woodled-studio/onboarding'
  }, 700)
}
</script>

<template>
  <button
    ref="btnRef"
    @click="handleClick"
    :style="{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: size === 'large' ? '14px' : '10px',
      padding: size === 'large' ? '20px 40px' : '11px 22px',
      fontSize: size === 'large' ? '18px' : '15px',
      backgroundImage: `linear-gradient(120deg, ${PAGE.rose} 0%, ${PAGE.roseLight} 25%, ${PAGE.roseGlow} 50%, ${PAGE.roseLight} 75%, ${PAGE.rose} 100%)`,
      backgroundSize: '220% 100%',
      animation: 'goldShimmer 7s ease-in-out infinite, glowPulse 4s ease-in-out infinite',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '999px',
      fontWeight: 700,
      cursor: 'pointer',
      fontFamily: 'inherit',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 200ms ease',
      textShadow: '0 1px 1px rgba(90, 61, 38, 0.20)',
    }"
    @mouseenter="(e) => ((e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)')"
    @mouseleave="(e) => ((e.currentTarget as HTMLElement).style.transform = 'translateY(0)')"
  >
    <!-- RotorSpinner: 10 rotating petals -->
    <div
      :style="{
        position: 'relative',
        width: (size === 'large' ? 28 : 18) + 'px',
        height: (size === 'large' ? 28 : 18) + 'px',
        flexShrink: 0,
      }"
    >
      <div
        v-for="i in 10"
        :key="i"
        :style="{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '1.8px',
          height: ((size === 'large' ? 28 : 18) * 0.28) + 'px',
          marginTop: (-(size === 'large' ? 28 : 18) * 0.14) + 'px',
          marginLeft: '-0.9px',
          borderRadius: '1.2px',
          background: '#fff',
          transformOrigin: '50% 50%',
          '--rot': (((i - 1) / 10) * 360) + 'deg',
          animation: `rotorCycle 5000ms ease-in-out ${(i - 1) * 30}ms infinite`,
          opacity: 0,
        }"
      />
    </div>
    {{ label }}
  </button>

  <!--
    Page-level transition overlay. Mounts to <body> via Teleport so it
    escapes any clipping/stacking inside the LP wrapper, and so both CTA
    instances (Hero + StickyHeader) overlay the same viewport.
  -->
  <Teleport to="body">
    <Transition name="lp-cta-fade">
      <div
        v-if="isTransitioning"
        class="lp-cta-overlay"
        aria-hidden="true"
      >
        <div class="lp-cta-overlay__rotor">
          <div
            v-for="i in 10"
            :key="i"
            :style="{
              '--rot': (((i - 1) / 10) * 360) + 'deg',
              animationDelay: ((i - 1) * 30) + 'ms',
            }"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Overlay styles are NOT scoped to the button — they live on a body-teleported
   element. But Vue's scoped CSS will tag .lp-cta-overlay correctly via the
   <style scoped> data-attr because the element is rendered by this component's
   template. */
.lp-cta-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: linear-gradient(180deg, #FAE8DB 0%, #F5D5C5 50%, #F0C5B5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: all;
}

.lp-cta-overlay__rotor {
  position: relative;
  width: 70px;
  height: 70px;
  font-size: 32px; /* drives the rotorCycle keyframe's translateY(-0.55em) */
}

.lp-cta-overlay__rotor > div {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 18px;
  margin-top: -9px;
  margin-left: -1.5px;
  border-radius: 1.5px;
  background: #B58060; /* PAGE.rose */
  transform-origin: 50% 50%;
  animation: rotorCycle 5000ms ease-in-out infinite;
  opacity: 0;
}

.lp-cta-fade-enter-active,
.lp-cta-fade-leave-active {
  transition: opacity 350ms ease;
}
.lp-cta-fade-enter-from,
.lp-cta-fade-leave-to {
  opacity: 0;
}
.lp-cta-fade-enter-to,
.lp-cta-fade-leave-from {
  opacity: 1;
}
</style>
