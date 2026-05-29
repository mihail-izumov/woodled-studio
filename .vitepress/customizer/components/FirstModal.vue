<script setup lang="ts">
/**
 * FirstModal.vue — «С какой комнаты начнём?».
 *
 * Источник: woodled-v42.jsx (FirstModal).
 * Выбирается комната для старта редактирования, подсвечивается её цена.
 */

import { T } from '../theme/tokens'
import { getRT, type Room } from '../data/rooms'
import { fxPrice } from '../data/price-engine'
import Modal from './ui/Modal.vue'

interface Props {
  rooms: Room[]
  firstId: string | null
}
const props = defineProps<Props>()
const emit = defineEmits<{
  update: [id: string | null]
  close: []
}>()

function toggle(id: string) {
  emit('update', props.firstId === id ? null : id)
}
</script>

<template>
  <Modal @close="emit('close')">
    <div :style="{ padding: '20px' }">
      <div
        :style="{
          fontSize: '15px',
          fontWeight: 700,
          color: T.text,
          marginBottom: '14px',
        }"
      >
        С какой комнаты начнём?
      </div>
      <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
        <div
          v-for="r in props.rooms"
          :key="r.id"
          :style="{
            border: `${props.firstId === r.id ? '2px' : '1px'} solid ${props.firstId === r.id ? T.neutral : T.border}`,
            borderRadius: '8px',
            padding: '12px',
            cursor: 'pointer',
            background: props.firstId === r.id ? T.neutral + '11' : T.cardAlt,
            display: 'flex',
            justifyContent: 'space-between',
          }"
          @click="toggle(r.id)"
        >
          <span :style="{ fontWeight: 600, color: T.text }">
            {{ r.customName || getRT(r.typeId).name }}
          </span>
          <span
            :style="{
              fontWeight: 700,
              color: props.firstId === r.id ? T.neutral : T.textSec,
            }"
          >
            {{ fxPrice(r.fixtures).toLocaleString('ru-RU') }} ₽
          </span>
        </div>
      </div>
      <button
        :style="{
          marginTop: '14px',
          width: '100%',
          padding: '10px',
          background: T.neutral,
          color: T.bg,
          border: 'none',
          borderRadius: '6px',
          fontWeight: 700,
          cursor: 'pointer',
        }"
        @click="emit('close')"
      >
        Готово
      </button>
    </div>
  </Modal>
</template>
