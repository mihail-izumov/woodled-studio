<script setup lang="ts">
/**
 * FurnitureBlock.vue — Секция «Обстановка» в RoomDetail.
 *
 * Fix 5: Тост при добавлении мебели — только факт, без «нужно ещё».
 * Fix 11: marginBottom 16px — разлепить от MoodBlock.
 *
 * batch7 #11:
 *   - Чипы переведены в pill-режим (Chip prop `pill`):
 *     borderRadius 999px, padding 7px 14px, 13px / weight 600.
 *   - Текст-рекомендация увеличен 11px → 13px.
 *   - Gap между чипами увеличен 5px → 7px для воздуха между pills.
 */

import { computed } from 'vue'
import { T } from '../theme/tokens'
import { FURN, furnText, furnStatus } from '../data/furniture'
import type { FurnId, Room, RoomType } from '../data/rooms'
import Chip from './ui/Chip.vue'

interface Props {
  rt: RoomType
  room: Room
  furnPct: number
  tint?: string
}
const props = withDefaults(defineProps<Props>(), { tint: '#A89878' })
const emit = defineEmits<{
  toggle: [nextFurn: FurnId[], toast: string]
}>()

const text = computed(() => furnText(props.room.furniture, props.furnPct))
const status = computed(() => furnStatus(props.furnPct))

function handleToggle(id: FurnId) {
  const f = FURN[id]
  if (!f) return
  const isIn = props.room.furniture.includes(id)
  const next: FurnId[] = isIn
    ? props.room.furniture.filter((x) => x !== id)
    : [...props.room.furniture, id]

  let toast = ''
  if (isIn) {
    toast = `${f.name} убрана — вернулось ${Math.round(f.ab * 100)}% света`
  } else {
    toast = `${f.name}: −${Math.round(f.ab * 100)}% света`
  }
  emit('toggle', next, toast)
}
</script>

<template>
  <div
    :style="{
      background: props.tint + '08',
      borderRadius: '10px',
      padding: '12px',
      marginTop: '16px',
      marginBottom: '16px',
      textAlign: 'center',
      border: `1px solid ${props.tint}18`,
    }"
  >
    <div
      :style="{
        fontSize: '14px',
        fontWeight: 600,
        color: T.text,
        marginBottom: '10px',
      }"
    >
      Обстановка
    </div>

    <div
      :style="{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '7px',
        justifyContent: 'center',
      }"
    >
      <Chip
        v-for="id in props.rt.furn"
        :key="id"
        pill
        :active="props.room.furniture.includes(id)"
        :tint="props.tint"
        @click="handleToggle(id)"
      >
        {{ FURN[id]?.name }}
      </Chip>
    </div>

    <div v-if="props.furnPct !== 0" :style="{ marginTop: '10px' }">
      <span
        :style="{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '999px',
          background: props.tint + '18',
          fontSize: '12px',
          fontWeight: 600,
          color: props.tint,
        }"
      >
        <template v-if="props.furnPct > 0">−{{ props.furnPct }}% меньше света</template>
        <template v-else>+{{ Math.abs(props.furnPct) }}% больше</template>
        · {{ status }}
      </span>
    </div>

    <div
      :style="{
        fontSize: '13px',
        color: T.text,
        marginTop: '10px',
        lineHeight: 1.55,
      }"
    >
      {{ text }}
    </div>
  </div>
</template>
