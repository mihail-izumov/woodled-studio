<script setup lang="ts">
import { ref } from 'vue'
import { HelpCircle } from '../../lib/icons'
import { T } from '../../lib/theme'

withDefaults(defineProps<{ width?: number }>(), { width: 260 })

const open = ref(false)
</script>

<template>
  <span
    :style="{
      position: 'relative',
      display: 'inline-flex',
      verticalAlign: 'middle',
      marginLeft: '4px',
    }"
    @mouseenter="open = true"
    @mouseleave="open = false"
  >
    <button
      :style="{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '16px', height: '16px',
        background: 'transparent',
        border: 'none', borderRadius: '50%',
        color: T.textSec,
        cursor: 'pointer', padding: 0,
      }"
      @click.stop="open = !open"
    >
      <HelpCircle :size="14" />
    </button>
    <span
      v-if="open"
      :style="{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: width + 'px',
        background: T.card,
        border: '1px solid ' + T.border,
        borderRadius: '8px',
        padding: '8px 10px',
        color: T.text,
        fontSize: '11.5px', fontWeight: 400,
        lineHeight: 1.5,
        boxShadow: '0 6px 20px rgba(0,0,0,.5)',
        zIndex: 110,
        whiteSpace: 'normal',
      }"
    >
      <slot />
      <span :style="{
        position: 'absolute',
        top: '100%', left: '50%',
        transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: '5px solid ' + T.border,
      }" />
    </span>
  </span>
</template>
