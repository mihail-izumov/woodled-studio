<script setup lang="ts">
/**
 * TypePicker.vue — Модалка «Добавить комнату».
 *
 * batch11 #6 (#5):
 *   - Полное затемнение фона (background #000 без прозрачности).
 *     Не используем общий Modal.vue — у него полупрозрачный фон.
 *     Делаем самостоятельный Teleport-overlay.
 *   - Карточка модалки белая, без обводки, скруглённая (radius 20px).
 *   - Заголовок «Добавить комнату» по центру, ×1.5 кегля (14 → 21px).
 *   - Кнопки выбора комнат: бежевый фон #F5F0E8, без обводки, fontSize 15.
 *   - Кнопка «Отмена» — крупная: padding 20px, fontSize 22px, weight 500.
 *     В 1.5–2× больше типичной кнопки — комфортно нажимать.
 *   - Скролл body блокируется на время показа.
 */

import { onMounted, onUnmounted } from 'vue'
import { T, Z } from '../theme/tokens'
import { RTS, type RoomTypeId } from '../data/rooms'

const emit = defineEmits<{
  pick: [typeId: RoomTypeId]
  close: []
}>()

let prevOverflow = ''
onMounted(() => {
  prevOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
})
onUnmounted(() => {
  document.body.style.overflow = prevOverflow
})

/**
 * После выбора типа cfg.add() в store сам сбрасывает picker.value,
 * поэтому отдельный emit('close') здесь не нужен.
 */
function onPick(id: RoomTypeId) {
  emit('pick', id)
}
</script>

<template>
  <Teleport to="body">
    <div
      :style="{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: Z.modalOverlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }"
      @click.self="emit('close')"
    >
      <div
        :style="{
          width: '100%',
          maxWidth: '420px',
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '28px 24px',
          border: 'none',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          boxSizing: 'border-box',
        }"
      >
        <!-- batch11 #6 (#5): заголовок по центру, ×1.5 кегля (14 → 21) -->
        <div
          :style="{
            fontSize: '21px',
            fontWeight: 700,
            color: T.bg,
            marginBottom: '20px',
            textAlign: 'center',
            lineHeight: 1.25,
          }"
        >
          Добавить комнату
        </div>

        <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }">
          <button
            v-for="rt in RTS"
            :key="rt.id"
            :style="{
              padding: '14px 12px',
              border: 'none',
              borderRadius: '12px',
              background: '#F5F0E8',
              cursor: 'pointer',
              color: T.bg,
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'inherit',
            }"
            @click="onPick(rt.id)"
          >
            {{ rt.name }}
          </button>
        </div>

        <!-- batch11 #6 (#5): крупная «Отмена» — padding 20, font 22, weight 500 -->
        <button
          :style="{
            marginTop: '20px',
            width: '100%',
            padding: '20px',
            background: T.bg,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '22px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }"
          @click="emit('close')"
        >
          Отмена
        </button>
      </div>
    </div>
  </Teleport>
</template>
