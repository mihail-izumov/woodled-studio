<script setup lang="ts">
/**
 * LumenDashboard.vue — Плашка с количеством ламп + прогресс-бар яркости.
 *
 * Источник: woodled-v42.jsx (секция Lumen Dashboard).
 */

import { T } from '../theme/tokens'
import type { Mood } from '../data/moods'
import type { Bright } from '../data/moods'
import Icon from './ui/Icons.vue'

interface Props {
  mood: Mood
  bright: Bright
  lamps: number
  actual: number
  base: number
  ratio: number
}
const props = defineProps<Props>()
</script>

<template>
  <div
    :style="{
      background: T.card,
      borderRadius: '10px',
      padding: '12px 14px',
      marginBottom: '16px',
      border: `1px solid ${props.mood.color}22`,
    }"
  >
    <div :style="{ display: 'flex', alignItems: 'flex-start', gap: '10px' }">
      <!-- Плашка со счётчиком ламп -->
      <div
        :style="{
          background: props.mood.color + '22',
          borderRadius: '8px',
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexShrink: 0,
        }"
      >
        <Icon name="bulb" :color="props.mood.color" :size="16" />
        <span
          :style="{
            fontSize: '14px',
            fontWeight: 700,
            color: props.mood.color,
          }"
        >
          {{ props.lamps }}
        </span>
      </div>

      <!-- Цифры + бейдж -->
      <div :style="{ flex: 1 }">
        <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }">
          <div :style="{ fontSize: '14px', color: T.text }">
            <span :style="{ fontWeight: 700 }">{{ props.actual.toLocaleString('ru-RU') }}</span>
            <span :style="{ color: props.mood.color, opacity: 0.6 }"> из </span>
            <span :style="{ fontWeight: 600, color: T.text + 'cc' }">{{ props.base.toLocaleString('ru-RU') }}</span>
            <span :style="{ color: props.mood.color, opacity: 0.6 }"> лм</span>
          </div>
          <span
            :style="{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '8px',
              background: props.mood.color + '20',
              fontSize: '10px',
              fontWeight: 600,
              color: props.mood.color,
              flexShrink: 0,
            }"
          >
            {{ props.bright.name }}
          </span>
        </div>

        <!-- Прогресс-бар -->
        <div
          :style="{
            marginTop: '6px',
            background: T.border,
            borderRadius: '4px',
            height: '6px',
            overflow: 'hidden',
          }"
        >
          <div
            :style="{
              height: '100%',
              width: `${Math.min(props.ratio * 100, 100)}%`,
              borderRadius: '4px',
              background: props.mood.color,
              transition: 'width .4s',
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
