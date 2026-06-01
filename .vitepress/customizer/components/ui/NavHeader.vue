<script setup lang="ts">
/**
 * NavHeader.vue — Единый sticky-хедер.
 *
 * iOS-style: 48px, back-кнопка слева, title по центру (absolute).
 *
 * Слоты:
 *   - #title — кастомный заголовок с inline-элементами (например, pen-icon).
 *              Если не задан, рендерится prop `title` как обычный текст.
 *   - #right — НЕ ИСПОЛЬЗУЕТСЯ в текущей версии (резерв на будущее).
 *              Раньше использовался в RoomSettings, но накладывался
 *              на глобальный SoundButton (top:10 right:16 fixed).
 */

import { T, Z } from '../../theme/tokens'

interface Props {
  title: string
  back?: string
}
withDefaults(defineProps<Props>(), { back: 'Назад' })
defineEmits<{ back: [] }>()
</script>

<template>
  <div
    :style="{
      position: 'sticky',
      top: 0,
      height: '48px',
      background: T.bg,
      borderBottom: `1px solid ${T.border}`,
      zIndex: Z.stickyHeader,
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '12px',
      paddingRight: '12px',
      flexShrink: 0,
    }"
  >
    <button
      :style="{
        background: 'none',
        border: 'none',
        color: T.text,
        fontSize: '17px',
        fontWeight: 400,
        cursor: 'pointer',
        padding: '4px 8px 4px 2px',
        display: 'flex',
        alignItems: 'center',
        gap: '1px',
        fontFamily: 'inherit',
        lineHeight: 1,
      }"
      @click="$emit('back')"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" :style="{ marginLeft: '-4px' }">
        <path d="M13.83 19a1 1 0 0 1-.78-.37l-4.83-6a1 1 0 0 1 0-1.27l5-6a1 1 0 0 1 1.54 1.28L10.29 12l4.32 5.36a1 1 0 0 1-.78 1.64z"/>
      </svg>
      {{ back }}
    </button>

    <div
      :style="{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '16px',
        fontWeight: 700,
        color: T.text,
        whiteSpace: 'nowrap',
        maxWidth: '60%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }"
    >
      <slot name="title">{{ title }}</slot>
    </div>
  </div>
</template>
