<script setup lang="ts">
/**
 * NameModal.vue — Редактирование названия дома.
 *
 * batch11 #8 v4:
 *   #1 — Убран текст «до 16 символов».
 *   #2 — Input fontSize 15 → 16.
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { T, Z } from '../theme/tokens'

const MAX_LEN = 16

interface Props {
  value: string
}
const props = defineProps<Props>()
const emit = defineEmits<{
  save: [value: string]
  close: []
}>()

const v = ref(props.value)

let prevOverflow = ''
onMounted(() => {
  prevOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
})
onUnmounted(() => {
  document.body.style.overflow = prevOverflow
})

function save() {
  emit('save', v.value)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      :style="{
        position: 'fixed', inset: 0, background: T.bg,
        zIndex: Z.modalOverlay, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px',
      }"
      @click.self="emit('close')"
    >
      <div
        :style="{
          width: '100%', maxWidth: '380px', background: '#FFFFFF',
          borderRadius: '14px', padding: '24px 22px', border: 'none',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }"
      >
        <div
          :style="{
            fontSize: '18px', fontWeight: 700, color: T.bg,
            marginBottom: '14px', textAlign: 'center', lineHeight: 1.4,
          }"
        >
          Какой свет — такой дом
        </div>
        <!-- batch11 #8 v4 (#2): fontSize 16 -->
        <input
          v-model="v"
          autofocus
          :maxlength="MAX_LEN"
          :style="{
            width: '100%', padding: '12px 14px',
            background: '#F5F0E8', border: 'none', borderRadius: '8px',
            color: T.bg, fontSize: '16px', fontWeight: 500,
            outline: 'none', boxSizing: 'border-box', textAlign: 'center',
          }"
          @keydown.enter="save"
        />
        <button
          :style="{
            marginTop: '14px', width: '100%', padding: '16px',
            background: T.bg, color: '#FFFFFF', border: 'none',
            borderRadius: '8px', fontWeight: 500, fontSize: '16px',
            fontFamily: 'inherit', cursor: 'pointer',
          }"
          @click="save"
        >
          Сохранить
        </button>
      </div>
    </div>
  </Teleport>
</template>
