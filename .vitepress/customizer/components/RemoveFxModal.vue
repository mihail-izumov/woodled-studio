<script setup lang="ts">
/**
 * RemoveFxModal.vue — «Убрать светильник?».
 *
 * Источник: woodled-v42.jsx (RemoveFxModal).
 * Минимальная модалка с двумя кнопками.
 */

import { computed } from 'vue'
import { T } from '../theme/tokens'
import { MD, type Fixture } from '../data/catalog'
import Modal from './ui/Modal.vue'

interface Props {
  item: Fixture
}
const props = defineProps<Props>()
const emit = defineEmits<{ confirm: []; close: [] }>()

const name = computed(() => MD[props.item.m]?.name ?? '')
</script>

<template>
  <Modal @close="emit('close')">
    <div :style="{ padding: '20px', textAlign: 'center' }">
      <div
        :style="{
          fontSize: '14px',
          fontWeight: 700,
          color: T.text,
          marginBottom: '8px',
        }"
      >
        Убрать {{ name }}?
      </div>
      <div :style="{ marginBottom: '14px' }" />
      <div :style="{ display: 'flex', gap: '8px' }">
        <button
          :style="{
            flex: 1,
            padding: '10px',
            background: 'none',
            border: `1px solid ${T.border}`,
            color: T.textSec,
            borderRadius: '6px',
            cursor: 'pointer',
          }"
          @click="emit('close')"
        >
          Оставить
        </button>
        <button
          :style="{
            flex: 1,
            padding: '10px',
            background: T.red,
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
          }"
          @click="emit('confirm')"
        >
          Убрать
        </button>
      </div>
    </div>
  </Modal>
</template>
