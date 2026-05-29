<script setup lang="ts">
import { computed } from 'vue'
import { Check } from '../lib/icons'
import { T } from '../lib/theme'
import { countCritical, toDisplayUrl } from '../lib/gallery'
import type { GalleryEntry } from '../lib/types'
import { RTS } from '../../customizer/data/rooms'
import { MD } from '../../customizer/data/catalog'
import { MATS } from '../../customizer/data/materials'
import { ALL_ZONES } from '../../customizer/data/catalog'
import ImageWithFallback from './ImageWithFallback.vue'

const props = defineProps<{ entry: GalleryEntry }>()
defineEmits<{ click: [] }>()

const filled = computed(() => countCritical(props.entry))
const displayUrl = computed(() => toDisplayUrl(props.entry.url))

const summary = computed(() => {
  const parts: string[] = []
  const e = props.entry
  if (e.rooms.length)
    parts.push(e.rooms.map(id => RTS.find(r => r.id === id)?.name || id).join(', '))
  if (e.models.length)
    // MD — Record<ModelId, Model>, индексируем как объект
    parts.push(e.models.map(id => MD[id]?.name || id).join(', '))
  if (e.woods.length)
    parts.push(e.woods.map(id => MATS.find(w => w.id === id)?.name || id).join(', '))
  if (e.zones.length)
    parts.push(e.zones.map(id => ALL_ZONES.find(z => z.id === id)?.name || id).join(', '))
  return parts
})

function onEnter(e: MouseEvent) {
  (e.currentTarget as HTMLElement).style.background = T.cardAlt
}
function onLeave(e: MouseEvent) {
  (e.currentTarget as HTMLElement).style.background = 'transparent'
}
</script>

<template>
  <button
    :style="{
      width: '100%',
      display: 'grid',
      gridTemplateColumns: '52px minmax(0, 1.6fr) minmax(0, 2.4fr) auto',
      gap: '12px',
      alignItems: 'center',
      padding: '8px 10px',
      background: 'transparent',
      border: '1px solid ' + (entry.tagged ? T.green + '33' : T.border),
      borderRadius: '8px',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background .12s ease',
    }"
    @click="$emit('click')"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <!-- мини-превью -->
    <div :style="{
      position: 'relative',
      width: '52px', height: '39px',
      borderRadius: '5px',
      overflow: 'hidden',
      background: T.cardAlt,
      flexShrink: 0,
    }">
      <ImageWithFallback
        :src="displayUrl"
        :filename="entry.filename"
        :img-style="{
          width: '100%', height: '100%',
          objectFit: 'cover', display: 'block',
        }"
      />
    </div>

    <!-- имя -->
    <div :style="{
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '12px',
      color: T.text,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      minWidth: 0,
    }">
      {{ entry.filename }}
    </div>

    <!-- сводка тегов -->
    <div :style="{
      fontSize: '11.5px',
      color: T.textSec,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      minWidth: 0,
    }">
      <span v-if="summary.length">{{ summary.join(' · ') }}</span>
      <span v-else :style="{ color: T.textDim }">теги не проставлены</span>
    </div>

    <!-- статус -->
    <div :style="{
      display: 'flex', alignItems: 'center', gap: '8px',
      flexShrink: 0,
    }">
      <span :style="{
        fontSize: '11px',
        color: filled === 4 ? T.green : filled > 0 ? T.yellow : T.textDim,
        fontWeight: 600,
      }">
        {{ filled }}/4
      </span>
      <span
        v-if="entry.tagged"
        :style="{
          display: 'inline-flex', alignItems: 'center', gap: '3px',
          padding: '2px 8px',
          background: T.green + '15',
          border: '1px solid ' + (T.green + '44'),
          borderRadius: '999px',
          color: T.green,
          fontSize: '10px', fontWeight: 600,
        }"
      >
        <Check :size="10" :stroke-width="3" /> готово
      </span>
    </div>
  </button>
</template>
