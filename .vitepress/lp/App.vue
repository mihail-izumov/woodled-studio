<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { PAGE } from './tokens'
import Header from './Header.vue'
import StickyHeader from './StickyHeader.vue'
import Hero from './Hero.vue'
import Slider from './Slider.vue'
import Descriptions from './Descriptions.vue'
import TreesBadge from './TreesBadge.vue'
import FAQ from './FAQ.vue'
import Social from './Social.vue'
import Footer from './Footer.vue'

const showSticky = ref(false)

let observer: IntersectionObserver | null = null
let observedEl: HTMLElement | null = null

function observeCta(el: HTMLElement) {
  if (observer && observedEl) observer.unobserve(observedEl)
  observedEl = el

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (!entry) return
      const isAbove = !entry.isIntersecting && entry.boundingClientRect.bottom < 0
      showSticky.value = isAbove
    },
    { threshold: 0 }
  )
  observer.observe(el)
}

function unobserveCta() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  observedEl = null
  showSticky.value = false
}

onBeforeUnmount(() => {
  unobserveCta()
})

// Inject Inter @import at runtime — VitePress strips top-level @import from
// component <style> blocks, so we add the link tag once on mount.
let fontLink: HTMLLinkElement | null = null
onMounted(() => {
  const href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
  if (!document.querySelector(`link[href="${href}"]`)) {
    fontLink = document.createElement('link')
    fontLink.rel = 'stylesheet'
    fontLink.href = href
    document.head.appendChild(fontLink)
  }
})
onBeforeUnmount(() => {
  // leave the font link in place — other pages may benefit too
})
</script>

<template>
  <!--
    `lp-root` class is what the .lp-root CSS rule below sizes. minHeight is
    moved out of inline-style into the global CSS block so we can declare
    BOTH 100vh (fallback) AND 100dvh (modern) — Vue's style object can't
    hold two values for the same property, but CSS happily takes the second
    declaration if the browser supports it.
  -->
  <div
    class="lp-root"
    :style="{
      background: `linear-gradient(180deg, ${PAGE.bgTop} 0%, ${PAGE.bgMid} 50%, ${PAGE.bgBottom} 100%)`,
      color: PAGE.text,
      fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`,
      fontWeight: 500,
      position: 'relative',
      overflow: 'hidden',
    }"
  >
    <!-- Dot grid — pinned to viewport so it stays put while scrolling -->
    <div
      :style="{
        position: 'fixed',
        inset: 0,
        backgroundImage:
          'radial-gradient(circle at center, rgba(122, 88, 60, 0.12) 1.0px, transparent 1.5px)',
        backgroundSize: '16px 16px',
        opacity: 1,
        pointerEvents: 'none',
        zIndex: 0,
      }"
    />

    <!-- Radial glow: top-right rose -->
    <div
      :style="{
        position: 'absolute',
        top: '-5%',
        right: '-15%',
        width: '70%',
        height: '55%',
        background:
          'radial-gradient(ellipse at center, rgba(232, 181, 160, 0.35), rgba(212, 165, 116, 0.15), transparent 65%)',
        pointerEvents: 'none',
        filter: 'blur(50px)',
      }"
    />
    <!-- Radial glow: middle-left warm rose -->
    <div
      :style="{
        position: 'absolute',
        top: '30%',
        left: '-20%',
        width: '60%',
        height: '50%',
        background:
          'radial-gradient(ellipse at center, rgba(232, 181, 160, 0.22), rgba(184, 125, 82, 0.10), transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(60px)',
      }"
    />
    <!-- Radial glow: bottom-right pastel pink -->
    <div
      :style="{
        position: 'absolute',
        bottom: '5%',
        right: '0%',
        width: '50%',
        height: '40%',
        background:
          'radial-gradient(ellipse at center, rgba(248, 218, 210, 0.25), transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(60px)',
      }"
    />

    <StickyHeader :show="showSticky" />

    <div :style="{ position: 'relative', zIndex: 1 }">
      <Header />
      <Hero @cta-mounted="observeCta" @cta-unmounted="unobserveCta" />
      <Slider />
      <Descriptions />
      <TreesBadge />
      <Social />
      <FAQ />
      <Footer />
    </div>
  </div>
</template>

<style>
/*
 * Mobile viewport coverage fix.
 *
 * On iOS Safari (and Chrome on Android with collapsing URL bars) the actual
 * visible viewport is taller than `100vh` once the URL bar collapses on
 * scroll. The LP was sized to 100vh and the gradient stopped there, so a
 * strip of body bg (white by default) was visible at the very bottom —
 * the "чёрная дырка" the user reported.
 *
 * Two-part fix:
 *   1. .lp-root uses 100dvh (dynamic viewport height) which tracks the
 *      real visible area. 100vh stays as fallback for older browsers.
 *   2. html/body bg colored to PAGE.bgBottom so even if the LP doesn't
 *      cover the very edge (rubber-band overscroll, hidden URL bar past
 *      content end), the seam reads as a continuation of the LP gradient
 *      instead of a sudden colour break.
 */
.lp-root {
  min-height: 100vh;
  min-height: 100dvh;
}

html,
body {
  background: #F0C5B5; /* PAGE.bgBottom */
  margin: 0;
}

/* Global keyframes for the LP — declared without scoping so they reach
 * elements styled via inline `style="animation: …"`. */
@keyframes rotorCycle {
  0%   { transform: rotate(var(--rot)) translateY(-1.0em) scale(0.3); opacity: 0; }
  5%   { transform: rotate(var(--rot)) translateY(-0.55em) scale(1);   opacity: 0.9; }
  80%  { transform: rotate(var(--rot)) translateY(-0.55em) scale(1);   opacity: 0.9; }
  90%  { transform: rotate(var(--rot)) translateY(-1.0em) scale(0.3); opacity: 0; }
  100% { transform: rotate(var(--rot)) translateY(-1.0em) scale(0.3); opacity: 0; }
}
@keyframes progressFill {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes haloPulse {
  0%, 100% { opacity: 0.75; transform: scale(1); }
  50%      { opacity: 1;    transform: scale(1.08); }
}
@keyframes goldShimmer {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes glowPulse {
  0%, 100% {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.40),
      inset 0 -1px 0 rgba(122, 88, 60, 0.20),
      0 10px 28px rgba(154, 100, 64, 0.28),
      0 0 32px rgba(232, 181, 160, 0.30);
  }
  50% {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.45),
      inset 0 -1px 0 rgba(122, 88, 60, 0.25),
      0 14px 36px rgba(154, 100, 64, 0.34),
      0 0 56px rgba(232, 181, 160, 0.50);
  }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.slider-scroll::-webkit-scrollbar { display: none; }
@media (min-width: 768px) {
  .slider-arrow { display: inline-flex !important; }
}

/*
 * Bulletproof link reset (kept verbatim from prior revision).
 */
.lp-root.lp-root a,
.lp-root.lp-root a:link,
.lp-root.lp-root a:visited,
.lp-root.lp-root a:hover,
.lp-root.lp-root a:focus,
.lp-root.lp-root a:focus-visible,
.lp-root.lp-root a:active {
  text-decoration: none !important;
  text-decoration-line: none !important;
  text-decoration-color: transparent !important;
  text-decoration-thickness: 0 !important;
  text-decoration-style: solid !important;
  -webkit-text-decoration: none !important;
  -webkit-text-decoration-color: transparent !important;
  text-underline-offset: 0 !important;
  border-bottom: 0 solid transparent !important;
  box-shadow: none !important;
}

.lp-root.lp-root a *,
.lp-root.lp-root a:link *,
.lp-root.lp-root a:visited *,
.lp-root.lp-root a:hover *,
.lp-root.lp-root a:focus *,
.lp-root.lp-root a:focus-visible *,
.lp-root.lp-root a:active * {
  text-decoration: none !important;
  text-decoration-line: none !important;
  text-decoration-color: transparent !important;
  text-decoration-thickness: 0 !important;
  -webkit-text-decoration: none !important;
  -webkit-text-decoration-color: transparent !important;
  text-underline-offset: 0 !important;
}

.lp-root.lp-root .footer-brand-word {
  border-bottom: 1.5px solid currentColor !important;
  padding-bottom: 2px !important;
  text-decoration: none !important;
  -webkit-text-decoration: none !important;
}
.lp-root.lp-root .footer-brand-reg {
  border-bottom: 0 solid transparent !important;
  text-decoration: none !important;
}

/*
 * Slider shimmer — warm wave that sweeps across dark slide bg while the JPG
 * is still loading. Once <img> @load fires, the shimmer is hidden via v-show
 * and the image fades in.
 */
.slider-shimmer {
  background:
    linear-gradient(
      90deg,
      rgba(58, 42, 31, 0.0) 0%,
      rgba(184, 125, 82, 0.18) 30%,
      rgba(232, 181, 160, 0.28) 50%,
      rgba(184, 125, 82, 0.18) 70%,
      rgba(58, 42, 31, 0.0) 100%
    ),
    linear-gradient(160deg, #2A1F18, #3A2A1C);
  background-size: 220% 100%, 100% 100%;
  background-repeat: no-repeat, no-repeat;
  background-position: -110% 0, 0 0;
  animation: sliderShimmerSweep 1.6s ease-in-out infinite;
}
@keyframes sliderShimmerSweep {
  0%   { background-position: -110% 0, 0 0; }
  100% { background-position:  110% 0, 0 0; }
}
</style>
