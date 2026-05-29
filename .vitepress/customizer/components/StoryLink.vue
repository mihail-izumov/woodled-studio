<script setup lang="ts">
/**
 * StoryLink.vue — Блок «Посмотрите на свой лес».
 *
 * Источник: woodled-v42.jsx (главный экран, блок с IC.trees).
 * Показывается когда есть хотя бы один светильник.
 */

import { T } from '../theme/tokens'
import Icon from './ui/Icons.vue'

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <div
    :style="{
      background: `linear-gradient(135deg, ${T.card}, ${T.neutral}11)`,
      border: `1px solid ${T.neutral}33`,
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
        background: T.neutral + '22',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }"
    >
      <Icon name="trees" :color="T.neutral" :size="22" />
    </div>
    <div :style="{ flex: 1, lineHeight: 1.75 }">
      <div :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">
        Посмотрите на свой лес
      </div>
      <div :style="{ fontSize: '11px', color: T.textSec }">
        Узнайте, какой свет вы создали
      </div>
    </div>
    <svg
      width="22" height="22" viewBox="0 0 24 24" fill="none"
      :stroke="T.neutral" stroke-width="1.5"
      stroke-linecap="round" stroke-linejoin="round"
      :style="{ flexShrink: 0, display: 'block' }"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </div>
</template>
