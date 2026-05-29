<script setup lang="ts">
import { computed } from 'vue'
import { Check } from '../../lib/icons'
import { T } from '../../lib/theme'

const props = withDefaults(defineProps<{
  active?: boolean
  color?: string
  dim?: boolean
  size?: 'sm' | 'md'
  title?: string
}>(), {
  active: false,
  size: 'md',
})

defineEmits<{ click: [e: MouseEvent] }>()

const c = computed(() => props.color || T.neutral)
const padY = computed(() => props.size === 'sm' ? '4px' : '6px')
const padX = computed(() => props.size === 'sm' ? '8px' : '11px')
const fs = computed(() => props.size === 'sm' ? '11px' : '12.5px')
</script>

<template>
  <button
    :title="title"
    :style="{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: padY + ' ' + padX,
      borderRadius: '999px',
      border: '1px solid ' + (active ? c : T.border),
      background: active ? c + '22' : 'transparent',
      color: active ? c : (dim ? T.textDim : T.textSec),
      fontSize: fs,
      fontWeight: active ? 600 : 500,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all .15s ease',
      userSelect: 'none',
      lineHeight: 1.2,
    }"
    @click="(e) => $emit('click', e)"
  >
    <Check v-if="active" :size="12" :stroke-width="3" />
    <slot />
  </button>
</template>
