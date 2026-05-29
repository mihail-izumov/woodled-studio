<script setup lang="ts">
/**
 * AppIcon — /og-cover.png with a rotor preloader.
 *
 * While the image is loading, the same 10-petal rotor used in the CTA button
 * spins in the icon's centre. On <img>@load, `loaded` flips true → spinner
 * fades out, image + halo layers fade in.
 *
 * Wrapper uses aspect-ratio: 1/1 so the layout doesn't jump when the image
 * arrives — the spinner has square space reserved before the image loads.
 *
 * Halo geometry kept identical to the previous AppIcon:
 *   1. Outer warm peach shadow — ambient grounding
 *   2. Inner warm-white halo — backlight, animated via haloPulse
 *   3. Image drop-shadow — foreground depth
 */
import { ref } from 'vue'
import { PAGE } from './tokens'

const COVER_URL = '/woodled-studio/og-cover.png'
const loaded = ref(false)
</script>

<template>
  <div
    :style="{
      position: 'relative',
      width: 'clamp(150px, 33vw, 190px)',
      aspectRatio: '1 / 1',
      margin: '0 auto 24px',
    }"
  >
    <!--
      RotorSpinner — visible until <img> @load fires. Same petal mechanics as
      PrimaryCTA: each petal has its own --rot angle and a phased animation
      delay; the global rotorCycle keyframe handles the translate + opacity.
      fontSize on the container is what scales translateY(-0.55em) in the
      keyframe to the right pixel radius for this size.
    -->
    <div
      v-show="!loaded"
      :style="{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60px',
        height: '60px',
        fontSize: '28px',
        zIndex: 3,
        pointerEvents: 'none',
      }"
    >
      <div
        v-for="i in 10"
        :key="i"
        :style="{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '2.6px',
          height: '15px',
          marginTop: '-7.5px',
          marginLeft: '-1.3px',
          borderRadius: '1.3px',
          background: PAGE.rose,
          transformOrigin: '50% 50%',
          '--rot': (((i - 1) / 10) * 360) + 'deg',
          animation: `rotorCycle 5000ms ease-in-out ${(i - 1) * 30}ms infinite`,
          opacity: 0,
        }"
      />
    </div>

    <!-- 1. Outer warm peach shadow — fades in with image -->
    <div
      :style="{
        position: 'absolute',
        inset: '-32px',
        background: `radial-gradient(ellipse at center 58%,
          rgba(232, 181, 160, 0.42) 0%,
          rgba(232, 181, 160, 0.18) 35%,
          transparent 72%
        )`,
        filter: 'blur(22px)',
        pointerEvents: 'none',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 700ms ease',
      }"
    />

    <!-- 2. Inner warm-white halo — backlight, pulses once image is in -->
    <div
      :style="{
        position: 'absolute',
        inset: '-14px',
        background: `radial-gradient(circle at center 38%,
          rgba(255, 251, 245, 0.85) 0%,
          rgba(255, 244, 232, 0.50) 35%,
          rgba(252, 230, 215, 0.18) 60%,
          transparent 78%
        )`,
        filter: 'blur(12px)',
        pointerEvents: 'none',
        animation: loaded ? 'haloPulse 4s ease-in-out infinite' : 'none',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 700ms ease',
      }"
    />

    <!-- 3. Image with drop-shadow — fades in smoothly on load -->
    <img
      :src="COVER_URL"
      alt="WOODLED"
      @load="loaded = true"
      :style="{
        position: 'relative',
        display: 'block',
        width: '100%',
        height: 'auto',
        filter: 'drop-shadow(0 14px 24px rgba(154, 100, 64, 0.18))',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 700ms ease',
      }"
    />
  </div>
</template>
