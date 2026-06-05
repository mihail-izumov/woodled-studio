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
  icon?: 'check' | null
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
      // calc(100vw - 32px) даёт максимально доступную ширину при 16px-отступах
      // по бокам. Короткие сообщения вмещаются в одну строку; длинные перенесутся
      // только когда не помещаются физически.
      maxWidth: 'calc(100vw - 32px)',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    }"
  >
    <svg v-if="props.icon === 'check'" width="17" height="17" viewBox="0 0 24 24" fill="none" :stroke="T.bg" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :style="{ flexShrink: 0 }"><circle cx="12" cy="12" r="10" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>
    <span>{{ props.msg }}</span>
  </div>
</template>
