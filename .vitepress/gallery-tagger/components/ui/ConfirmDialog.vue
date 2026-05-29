<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { T } from '../../lib/theme'
import IconBtn from './IconBtn.vue'

withDefaults(defineProps<{
  title: string
  body: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}>(), {
  danger: false,
})

const emit = defineEmits<{ confirm: []; cancel: [] }>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('cancel')
  if (e.key === 'Enter')  emit('confirm')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    :style="{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,.72)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 150,
    }"
    @click="$emit('cancel')"
  >
    <div
      :style="{
        background: T.bg,
        border: '1px solid ' + T.border,
        borderRadius: '14px',
        width: '100%', maxWidth: '380px',
        padding: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,.6)',
      }"
      @click.stop
    >
      <div :style="{ fontSize: '16px', fontWeight: 700, color: T.text, marginBottom: '8px' }">
        {{ title }}
      </div>
      <div :style="{ fontSize: '13px', color: T.textSec, lineHeight: 1.5, marginBottom: '18px' }">
        {{ body }}
      </div>
      <div :style="{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }">
        <IconBtn title="Esc" @click="$emit('cancel')">
          {{ cancelLabel || 'Отмена' }}
        </IconBtn>
        <IconBtn
          title="Enter"
          :danger="danger"
          :primary="!danger"
          @click="$emit('confirm')"
        >
          {{ confirmLabel || 'Подтвердить' }}
        </IconBtn>
      </div>
    </div>
  </div>
</template>
