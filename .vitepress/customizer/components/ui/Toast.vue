<script setup lang="ts">
/**
 * Toast.vue — Всплывающее сообщение на 3.2 сек.
 *
 * Источник: woodled-v42.jsx (Toast).
 * Таймер внутри компонента, наружу вызывает onDone.
 */

import { watch, onUnmounted } from 'vue'
import { T, Z } from '../../theme/tokens'

interface Props {
  msg: string | null
}
const props = defineProps<Props>()
const emit = defineEmits<{ done: [] }>()

let timer: ReturnType<typeof setTimeout> | null = null

function clearTimer() {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

watch(
  () => props.msg,
  (v) => {
    clearTimer()
    if (v) {
      timer = setTimeout(() => {
        emit('done')
        timer = null
      }, 3200)
    }
  },
  { immediate: true },
)

onUnmounted(clearTimer)
</script>

<template>
  <div
    v-if="props.msg"
    :style="{
      position: 'fixed',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: T.text,
      color: T.bg,
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 600,
      zIndex: Z.toast,
      maxWidth: '85%',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,.4)',
    }"
  >
    {{ props.msg }}
  </div>
</template>
