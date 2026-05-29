<script setup lang="ts">
import { T } from '../../lib/theme'

withDefaults(defineProps<{
  title: string
  accent?: string
}>(), {})
</script>

<template>
  <div :style="{
    background: T.card,
    border: '1px solid ' + T.border,
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '12px',
  }">
    <div :style="{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: '10px',
    }">
      <div :style="{
        fontSize: '11px', fontWeight: 700,
        color: accent || T.textSec,
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
      }">{{ title }}</div>
      <slot name="right" />
    </div>
    <slot />
  </div>
</template>
