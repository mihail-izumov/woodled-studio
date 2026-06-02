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

import { T } from '../theme/tokens'
import { FURN, gword } from '../data/furniture'
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

function handleToggle(id: FurnId) {
  const f = FURN[id]
  if (!f) return
  const isIn = props.room.furniture.includes(id)
  const next: FurnId[] = isIn
    ? props.room.furniture.filter((x) => x !== id)
    : [...props.room.furniture, id]

  const pct = Math.round(Math.abs(f.ab) * 100)
  const absorbs = f.ab > 0 // обычная мебель забирает свет; зеркало (ab<0) отражает
  let toast = ''
  if (isIn) {
    const verb = gword(f.g, 'убран', 'убрана', 'убрано')
    toast = absorbs
      ? `${f.name} ${verb} — вернулось ${pct}% света`
      : `${f.name} ${verb} — минус ${pct}% света`
  } else {
    const verb = gword(f.g, 'добавлен', 'добавлена', 'добавлено')
    toast = absorbs
      ? `${f.name} ${verb} — съедает ${pct}% света`
      : `${f.name} ${verb} — плюс ${pct}% света`
  }
  emit('toggle', next, toast)
}
</script>

<template>
  <div
    :style="{
      background: props.tint + '06',
      borderRadius: '16px',
      padding: '20px 16px 22px',
      marginTop: '16px',
      marginBottom: '16px',
      textAlign: 'center',
      border: `1px solid ${props.tint}33`,
    }"
  >
    <div
      :style="{
        fontSize: '17px',
        fontWeight: 700,
        color: T.text,
        marginBottom: '18px',
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

    <div v-if="props.furnPct !== 0" :style="{ marginTop: '16px' }">
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
      </span>
    </div>

  </div>
</template>
