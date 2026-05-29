<script setup lang="ts">
/**
 * Modal.vue — Оверлей с карточкой и блокировкой скролла body.
 *
 * Источник: woodled-v42.jsx (Modal).
 * Закрывается по клику на фон или снаружи через emit('close').
 */

import { onMounted, onUnmounted } from 'vue'
import { T, Z, RGBA } from '../../theme/tokens'

const emit = defineEmits<{ close: [] }>()

let prevOverflow = ''

onMounted(() => {
  prevOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = prevOverflow
})

function handleClose() {
  emit('close')
}
</script>

<template>
  <div
    :style="{
      position: 'fixed',
      inset: 0,
      background: RGBA.black65,
      zIndex: Z.modalOverlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }"
    @click="handleClose"
  >
    <div
      :style="{
        background: T.bg,
        borderRadius: '14px',
        maxWidth: '480px',
        width: '95%',
        maxHeight: '92vh',
        overflow: 'auto',
        border: `1px solid ${T.border}`,
      }"
      @click.stop
    >
      <slot />
    </div>
  </div>
</template>
