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
      height: '44px',
      background: T.bg,
      borderBottom: `1px solid ${T.border}`,
      zIndex: Z.stickyHeader,
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '8px',
      paddingRight: '8px',
      flexShrink: 0,
    }"
  >
    <!-- Левая зона: кнопка назад. flex:1 + min-width:0 — симметрична правой,
         за счёт чего заголовок центрируется по бару; при длинном лейбле
         текст кнопки усекается, а не толкает заголовок. -->
    <div :style="{ flex: '1 1 0', minWidth: 0, display: 'flex', justifyContent: 'flex-start' }">
      <button
        :style="{
          background: 'none',
          border: 'none',
          color: T.text,
          fontSize: '17px',
          fontWeight: 400,
          cursor: 'pointer',
          padding: '4px 6px 4px 2px',
          display: 'flex',
          alignItems: 'center',
          gap: '1px',
          fontFamily: 'inherit',
          lineHeight: 1,
          minWidth: 0,
          maxWidth: '100%',
        }"
        @click="$emit('back')"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" :style="{ marginLeft: '-4px', flexShrink: 0 }">
          <path d="M13.83 19a1 1 0 0 1-.78-.37l-4.83-6a1 1 0 0 1 0-1.27l5-6a1 1 0 0 1 1.54 1.28L10.29 12l4.32 5.36a1 1 0 0 1-.78 1.64z"/>
        </svg>
        <span :style="{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }">{{ back }}</span>
      </button>
    </div>

    <!-- Заголовок: центральная зона, усекается многоточием.
         Внутренний блок — для корректного text-overflow на тексте. -->
    <div :style="{ flex: '0 1 auto', minWidth: 0, padding: '0 6px' }">
      <div
        :style="{
          fontSize: '17px',
          fontWeight: 600,
          color: T.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'center',
        }"
      >
        <slot name="title">{{ title }}</slot>
      </div>
    </div>

    <!-- Правая зона: симметрична левой для центрирования заголовка -->
    <div :style="{ flex: '1 1 0', minWidth: 0, display: 'flex', justifyContent: 'flex-end' }">
      <slot name="right" />
    </div>
  </div>
</template>
