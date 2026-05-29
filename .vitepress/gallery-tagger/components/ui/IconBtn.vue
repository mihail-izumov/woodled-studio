<script setup lang="ts">
import { T } from '../../lib/theme'

const props = withDefaults(defineProps<{
  title?: string
  danger?: boolean
  primary?: boolean
  disabled?: boolean
}>(), {
  danger: false,
  primary: false,
  disabled: false,
})

defineEmits<{ click: [e: MouseEvent] }>()
</script>

<template>
  <button
    :title="title"
    :disabled="disabled"
    :style="{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '8px 12px',
      borderRadius: '8px',
      border: '1px solid ' + (danger ? T.red + '55' : primary ? T.neutral : T.border),
      background: primary ? T.neutral + '22' : danger ? T.red + '11' : T.cardAlt,
      color: primary ? T.text : danger ? T.red : T.text,
      fontSize: '13px',
      fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      whiteSpace: 'nowrap',
    }"
    @click="(e) => $emit('click', e)"
  >
    <slot />
  </button>
</template>
