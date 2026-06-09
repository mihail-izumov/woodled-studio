<script setup lang="ts">
import { PAGE } from './tokens'

const LOGO_URL = '/customizer/woodled-logo.svg'
</script>

<template>
  <header
    :style="{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 24px',
      maxWidth: '1280px',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
    }"
  >
    <!--
      Mobile-only rebalance vs the previous spec (desktop is unchanged):
        - title clamp: 28..40 → 22..40   ← smaller on mobile, same on desktop
        - logo  clamp: 22..32 → 26..32   ← bigger on mobile, same on desktop
      At 380px viewport: title 22px, logo 26px → near-1:1 visual weight.
      At ≥800px: both hit their clamp max (40 / 32), matching the previous
      desktop look. The vw-coefficient (4.4vw / 4vw) chosen so they meet
      proportionally at the same breakpoint instead of one outrunning the
      other through the mid range.
    -->
    <div
      :style="{
        fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif`,
        fontSize: 'clamp(22px, 4.4vw, 40px)',
        fontWeight: 600,
        letterSpacing: '-0.02em',
        color: PAGE.text,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
      }"
    >
      WOODLED&nbsp;Студия
    </div>

    <a
      href="https://woodled-studio.ru"
      :style="{
        display: 'inline-flex',
        alignItems: 'center',
        opacity: 0.85,
      }"
      aria-label="WOODLED Студия"
    >
      <!--
        <img> + filter:brightness(0) — preserves the SVG's native aspect
        ratio (width:auto) and recolors any fill to pure black.
      -->
      <img
        :src="LOGO_URL"
        alt="WOODLED"
        :style="{
          height: 'clamp(26px, 4vw, 32px)',
          width: 'auto',
          display: 'block',
          filter: 'brightness(0)',
        }"
      />
    </a>
  </header>
</template>
