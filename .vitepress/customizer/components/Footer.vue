<script setup lang="ts">
/**
 * Footer.vue — Лого WOODLED внизу страниц.
 *
 * batch11 #7 (#6): лого ×2 — 130→260, 22→44.
 * batch11 #8 v2 (#5): −30% — 260→182, 44→31.
 */

import { T } from '../theme/tokens'

const LOGO_URL = '/woodled-studio/customizer/woodled-logo.svg'
</script>

<template>
  <div
    :style="{
      marginTop: '60px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'center',
      opacity: 0.55,
    }"
  >
    <a
      href="/woodled-studio/"
      target="_blank"
      rel="noopener"
      aria-label="WOODLED — на главную"
      :style="{
        /* batch11 #8 v2 (#5): лого ×2 минус 30% = ×1.4 */
        display: 'block',
        width: '182px',
        height: '31px',
        cursor: 'pointer',
        background: T.neutral,
        maskImage: `url(${LOGO_URL})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(${LOGO_URL})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
      }"
    />
  </div>
</template>
