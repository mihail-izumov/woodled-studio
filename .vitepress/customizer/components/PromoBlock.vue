<script setup lang="ts">
/**
 * PromoBlock.vue — «3 000 ₽ на первый светильник».
 *
 * Источник: woodled-v42.jsx (главный экран, блок с IC.gift).
 * Показывается когда все комнаты пусты. По клику открывает гостиную.
 *
 * batch11 #5 (#7): подзаголовок 11px → 13px, weight 500.
 * batch11 #7 (#5): убран хвост «и получите скидку» из подзаголовка.
 */

import { T, RGBA } from '../theme/tokens'
import Icon from './ui/Icons.vue'

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <div
    :style="{
      background: RGBA.white06,
      border: `1px solid ${RGBA.white12}`,
      borderRadius: '12px',
      padding: '14px 16px',
      marginBottom: '12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }"
    @click="emit('click')"
  >
    <div
      :style="{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: T.green + '18',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }"
    >
      <Icon name="gift" :color="T.text" :size="22" />
    </div>
    <div :style="{ flex: 1, lineHeight: 1.75 }">
      <div :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">
        3 000 ₽ на первый светильник
      </div>
      <!-- batch11 #7 (#5): «и получите скидку» убрано -->
      <div :style="{ fontSize: '13px', fontWeight: 500, color: T.textSec }">
        Соберите лес WOODLED Rotor
      </div>
    </div>
    <svg
      width="22" height="22" viewBox="0 0 24 24" fill="none"
      :stroke="T.textSec" stroke-width="1.5"
      stroke-linecap="round" stroke-linejoin="round"
      :style="{ flexShrink: 0, display: 'block' }"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </div>
</template>
