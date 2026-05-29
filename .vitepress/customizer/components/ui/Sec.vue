<script setup lang="ts">
/**
 * Sec.vue — Секция с заголовком-лейблом.
 *
 * Источник: woodled-v42.jsx (Sec).
 * Используется в FxEditor, RoomSettings.
 */

import { T } from '../../theme/tokens'

interface Props {
  label: string
}
defineProps<Props>()
</script>

<template>
  <div :style="{ marginBottom: '14px' }">
    <div
      :style="{
        fontSize: '11px',
        color: T.text,
        marginBottom: '6px',
        fontWeight: 600,
      }"
    >
      {{ label }}
    </div>
    <slot />
  </div>
</template>
