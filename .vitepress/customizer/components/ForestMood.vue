<script setup lang="ts">
/**
 * ForestMood.vue — блок настроения как ЛЕСНАЯ СЦЕНА.
 *
 * Имя (порода × место) + легенда-синтез + слайдер карточек «Как это работает».
 * Всё из engine/forest.ts (forestScene + roomKnobs). Без модалки.
 * Тонируется цветом комнаты (tint = room.cardColor).
 */
import { computed, ref } from 'vue'
import { T } from '../theme/tokens'
import { forestScene, roomKnobs } from '../engine/forest'
import type { Room, RoomType } from '../data/rooms'

interface Props {
  rt: RoomType
  room: Room
  tint: string
  roomPrepName: string
}
const props = defineProps<Props>()

const scene = computed(() => forestScene(props.rt, props.room))
const knobs = computed(() => roomKnobs(props.rt, props.room))

const sliderRef = ref<HTMLElement | null>(null)
const active = ref(0)
function onScroll() {
  const el = sliderRef.value
  const n = knobs.value.length
  if (!el || n === 0) return
  active.value = Math.min(n - 1, Math.max(0, Math.round(el.scrollLeft / (el.scrollWidth / n))))
}
</script>

<template>
  <div
    :style="{
      border: `1px solid ${props.tint}`,
      background: props.tint + '0a',
      borderRadius: '16px',
      padding: '18px 14px 18px',
      marginBottom: '16px',
    }"
  >
    <div
      :style="{
        textAlign: 'center',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '2.5px',
        color: props.tint + 'bb',
      }"
    >
      Настроение {{ props.roomPrepName }}
    </div>

    <div :style="{ textAlign: 'center', fontSize: '22px', fontWeight: 700, color: T.text, marginTop: '10px' }">
      {{ scene.name }}
    </div>

    <div
      :style="{
        textAlign: 'center',
        fontSize: '13px',
        color: T.textSec,
        lineHeight: 1.6,
        maxWidth: '340px',
        margin: '8px auto 0',
      }"
    >
      {{ scene.legend }}
    </div>

    <template v-if="knobs.length > 0">
      <div :style="{ height: '1px', background: T.border, margin: '16px 0 14px' }" />

      <div ref="sliderRef" class="fm-slider" @scroll="onScroll">
        <div
          v-for="(k, i) in knobs"
          :key="i"
          class="fm-slide"
          :style="{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '13px', padding: '14px' }"
        >
          <div :style="{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '7px' }">
            <span :style="{ fontSize: '14px', fontWeight: 700, color: T.text }">{{ k.title }}</span>
            <span
              v-if="k.chip"
              :style="{
                marginLeft: 'auto',
                fontSize: '10px',
                fontWeight: 700,
                color: props.tint,
                background: props.tint + '1e',
                padding: '2px 7px',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
              }"
            >
              {{ k.chip }}
            </span>
          </div>
          <div :style="{ fontSize: '12.5px', color: T.textSec, lineHeight: 1.55 }">{{ k.text }}</div>
        </div>
      </div>

      <div :style="{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }">
        <span
          v-for="(k, i) in knobs"
          :key="i"
          :style="{
            height: '6px',
            borderRadius: '3px',
            transition: 'all .2s',
            width: i === active ? '16px' : '6px',
            background: i === active ? props.tint : 'rgba(255,255,255,0.18)',
          }"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.fm-slider {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.fm-slider::-webkit-scrollbar {
  display: none;
}
.fm-slide {
  flex: 0 0 82%;
  scroll-snap-align: center;
  min-height: 116px;
}
</style>
