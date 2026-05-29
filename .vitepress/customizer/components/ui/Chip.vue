<script setup lang="ts">
/**
 * Chip.vue — Чип-кнопка.
 *
 * Источник: woodled-v42.jsx (Chip).
 * Две грани: активный (с neutral-рамкой) и неактивный (с border-рамкой).
 *
 * batch7 #11: добавлен prop `pill` — режим скруглённой капсулы с
 * увеличенным padding/font-size/font-weight для FurnitureBlock.
 * По умолчанию false — обычный chip (RoomSettings и пр. не меняются).
 */

import { computed, type StyleValue } from 'vue'
import { T } from '../../theme/tokens'

interface Props {
  active?: boolean
  tint?: string
  /** Pill-режим: borderRadius 999px + крупнее padding/text. */
  pill?: boolean
  style?: StyleValue
}
const props = withDefaults(defineProps<Props>(), {
  active: false,
  tint: '',
  pill: false,
  style: () => ({}),
})

const baseStyle = computed<StyleValue>(() => {
  const c = props.tint || T.neutral
  return {
    padding: props.pill ? '7px 14px' : '5px 10px',
    borderRadius: props.pill ? '999px' : '4px',
    cursor: 'pointer',
    fontSize: props.pill ? '13px' : '11px',
    fontWeight: props.pill ? 600 : 400,
    border: `1px solid ${props.active ? c : T.border}`,
    background: props.active ? c + '22' : 'transparent',
    color: props.active ? T.text : T.textSec,
    lineHeight: 1.3,
  }
})
</script>

<template>
  <button :style="[baseStyle, props.style]">
    <slot />
  </button>
</template>
